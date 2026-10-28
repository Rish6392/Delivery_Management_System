import prisma from '@/lib/db';
import { ShipmentStatus, DeliveryEventType, AssignmentStatus } from '@prisma/client';
import { isValidTransition } from '@/lib/state-machine';
import { createAuditLog } from './audit.service';
import { generateId } from '@/lib/utils';
import { BusinessError } from '@/lib/auth-helpers';

/**
 * Create a driver+vehicle assignment for a shipment.
 * 
 * This is the core concurrency-safe operation (Challenge 1 + Challenge 4).
 * Uses PostgreSQL row-level locks (SELECT FOR UPDATE) within a serializable
 * transaction to prevent double-assignment of drivers or vehicles.
 */
export async function createAssignment(data: {
  shipmentId: string;
  driverId: string;
  vehicleId: string;
  assignedByUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    // 1. Lock and verify the shipment
    const shipments = await tx.$queryRaw<Array<{
      shipment_id: string;
      status: string;
      customer_id: string;
    }>>`
      SELECT shipment_id, status, customer_id 
      FROM shipments 
      WHERE shipment_id = ${data.shipmentId} 
      FOR UPDATE
    `;

    if (shipments.length === 0) {
      throw new BusinessError('Shipment not found', 404);
    }

    const shipment = shipments[0];

    // Check if shipment is in an assignable state
    if (!isValidTransition(shipment.status as ShipmentStatus, ShipmentStatus.ASSIGNED)) {
      throw new BusinessError(
        `Cannot assign driver to shipment in ${shipment.status} status`,
        409
      );
    }

    // 2. Lock and verify the driver
    const drivers = await tx.$queryRaw<Array<{
      driver_id: string;
      status: string;
      current_status: string;
      name: string;
    }>>`
      SELECT driver_id, status, current_status, name 
      FROM drivers 
      WHERE driver_id = ${data.driverId} 
      FOR UPDATE
    `;

    if (drivers.length === 0) {
      throw new BusinessError('Driver not found', 404);
    }

    const driver = drivers[0];

    // Driver must be ACTIVE (employment status)
    if (driver.status !== 'ACTIVE') {
      throw new BusinessError(`Driver ${driver.name} is ${driver.status} and cannot be assigned`, 409);
    }

    // Driver must be AVAILABLE (current availability)
    if (driver.current_status !== 'AVAILABLE') {
      throw new BusinessError(
        `Driver ${driver.name} is currently ${driver.current_status} and cannot be assigned`,
        409
      );
    }

    // Double-check: no active assignments for this driver
    const existingDriverAssignment = await tx.driverAssignment.findFirst({
      where: {
        driverId: data.driverId,
        status: AssignmentStatus.ACTIVE,
      },
    });

    if (existingDriverAssignment) {
      throw new BusinessError(
        `Driver ${driver.name} already has an active assignment (${existingDriverAssignment.assignmentId})`,
        409
      );
    }

    // 3. Lock and verify the vehicle
    const vehicles = await tx.$queryRaw<Array<{
      vehicle_id: string;
      status: string;
      current_status: string;
      registration_number: string;
    }>>`
      SELECT vehicle_id, status, current_status, registration_number 
      FROM vehicles 
      WHERE vehicle_id = ${data.vehicleId} 
      FOR UPDATE
    `;

    if (vehicles.length === 0) {
      throw new BusinessError('Vehicle not found', 404);
    }

    const vehicle = vehicles[0];

    // Vehicle must be ACTIVE
    if (vehicle.status !== 'ACTIVE') {
      throw new BusinessError(
        `Vehicle ${vehicle.registration_number} is ${vehicle.status} and cannot be assigned`,
        409
      );
    }

    // Vehicle must be AVAILABLE
    if (vehicle.current_status !== 'AVAILABLE') {
      throw new BusinessError(
        `Vehicle ${vehicle.registration_number} is currently ${vehicle.current_status} and cannot be assigned`,
        409
      );
    }

    // Double-check: no active assignments for this vehicle
    const existingVehicleAssignment = await tx.driverAssignment.findFirst({
      where: {
        vehicleId: data.vehicleId,
        status: AssignmentStatus.ACTIVE,
      },
    });

    if (existingVehicleAssignment) {
      throw new BusinessError(
        `Vehicle ${vehicle.registration_number} already has an active assignment (${existingVehicleAssignment.assignmentId})`,
        409
      );
    }

    // 4. Create the assignment
    const assignmentId = generateId('ASN');
    const assignment = await tx.driverAssignment.create({
      data: {
        assignmentId,
        shipmentId: data.shipmentId,
        driverId: data.driverId,
        vehicleId: data.vehicleId,
        assignedById: data.assignedByUserId,
        status: AssignmentStatus.ACTIVE,
      },
    });

    // 5. Update shipment status to ASSIGNED
    await tx.shipment.update({
      where: { shipmentId: data.shipmentId },
      data: { status: ShipmentStatus.ASSIGNED },
    });

    // 6. Update driver status
    await tx.driver.update({
      where: { driverId: data.driverId },
      data: { currentStatus: 'ASSIGNED' },
    });

    // 7. Update vehicle status
    await tx.vehicle.update({
      where: { vehicleId: data.vehicleId },
      data: {
        currentStatus: 'ASSIGNED',
        currentDriverId: data.driverId,
      },
    });

    // 8. Create delivery event
    await tx.deliveryEvent.create({
      data: {
        eventId: generateId('EVT'),
        shipmentId: data.shipmentId,
        driverId: data.driverId,
        eventType: DeliveryEventType.ASSIGNED,
        location: 'Dispatch Center',
        notes: `Assigned to driver ${driver.name} with vehicle ${vehicle.registration_number}`,
        idempotencyKey: `assign-${data.shipmentId}-${assignmentId}`,
      },
    });

    // 9. Audit log
    await createAuditLog(
      {
        userId: data.assignedByUserId,
        action: 'DRIVER_ASSIGNED',
        entityType: 'DRIVER_ASSIGNMENT',
        entityId: assignmentId,
        metadata: {
          driver: data.driverId,
          vehicle: data.vehicleId,
          shipment: data.shipmentId,
        },
      },
      tx
    );

    return assignment;
  }, {
    // Use serializable isolation level for maximum safety against race conditions
    isolationLevel: 'Serializable',
    timeout: 10000,
  });
}

/**
 * Get assignments with filters.
 */
export async function getAssignments(params: {
  page?: number;
  limit?: number;
  driverId?: string;
  shipmentId?: string;
  status?: string;
}) {
  const { page = 1, limit = 20, driverId, shipmentId, status } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (driverId) where.driverId = driverId;
  if (shipmentId) where.shipmentId = shipmentId;
  if (status) where.status = status as AssignmentStatus;

  const [assignments, total] = await Promise.all([
    prisma.driverAssignment.findMany({
      where,
      include: {
        shipment: {
          include: {
            customer: { select: { name: true } },
          },
        },
        driver: { select: { name: true, phone: true, driverId: true } },
        vehicle: { select: { registrationNumber: true, vehicleType: true, vehicleId: true } },
        assignedBy: { select: { name: true } },
      },
      orderBy: { assignedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.driverAssignment.count({ where }),
  ]);

  return {
    data: assignments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
