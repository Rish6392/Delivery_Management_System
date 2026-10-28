import prisma from '@/lib/db';
import { ShipmentStatus, DeliveryEventType, Prisma } from '@prisma/client';
import { isValidTransition, canCancel, CANCELLABLE_STATUSES } from '@/lib/state-machine';
import { createAuditLog } from './audit.service';
import { generateId } from '@/lib/utils';
import { BusinessError } from '@/lib/auth-helpers';

/**
 * Create a new shipment for a customer.
 */
export async function createShipment(data: {
  customerId: string;
  pickupAddress: string;
  deliveryAddress: string;
  packageDescription: string;
  packageWeightKg: number;
  priority?: string;
  scheduledPickupDate?: string;
  scheduledDeliveryDate?: string;
  userId: string;
}) {
  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { customerId: data.customerId },
  });
  if (!customer) {
    throw new BusinessError('Customer not found', 404);
  }

  // Generate unique shipment identifiers
  const shipmentId = generateId('SHP');
  const shipmentCount = await prisma.shipment.count();
  const shipmentNumber = `SHIP-${String(shipmentCount + 1).padStart(5, '0')}`;

  return prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.create({
      data: {
        shipmentId,
        shipmentNumber,
        customerId: data.customerId,
        pickupAddress: data.pickupAddress,
        deliveryAddress: data.deliveryAddress,
        packageDescription: data.packageDescription,
        packageWeightKg: data.packageWeightKg,
        priority: (data.priority as any) || 'NORMAL',
        scheduledPickupDate: data.scheduledPickupDate ? new Date(data.scheduledPickupDate) : null,
        scheduledDeliveryDate: data.scheduledDeliveryDate ? new Date(data.scheduledDeliveryDate) : null,
        status: ShipmentStatus.CREATED,
      },
    });

    // Create delivery event
    await tx.deliveryEvent.create({
      data: {
        eventId: generateId('EVT'),
        shipmentId: shipment.shipmentId,
        driverId: null,
        eventType: DeliveryEventType.CREATED,
        location: 'Origin',
        notes: 'Shipment booked',
        idempotencyKey: `create-${shipment.shipmentId}`,
      },
    });

    // Audit log
    await createAuditLog(
      {
        userId: data.userId,
        action: 'SHIPMENT_CREATED',
        entityType: 'SHIPMENT',
        entityId: shipment.shipmentId,
        metadata: { customer: data.customerId },
      },
      tx
    );

    return shipment;
  });
}

/**
 * Get shipment by ID with ownership verification.
 */
export async function getShipment(shipmentId: string, userId?: string, role?: string, customerId?: string) {
  const shipment = await prisma.shipment.findUnique({
    where: { shipmentId },
    include: {
      customer: true,
      assignments: {
        include: {
          driver: true,
          vehicle: true,
          assignedBy: { select: { name: true } },
        },
        orderBy: { assignedAt: 'desc' },
      },
      deliveryEvents: {
        orderBy: { createdAt: 'asc' },
      },
      proofOfDelivery: true,
    },
  });

  if (!shipment) {
    throw new BusinessError('Shipment not found', 404);
  }

  // Ownership check for customers
  if (role === 'CUSTOMER' && customerId && shipment.customerId !== customerId) {
    throw new BusinessError('Shipment not found', 404); // 404 to avoid leaking existence
  }

  return shipment;
}

/**
 * Get shipments list with pagination and filters.
 */
export async function getShipments(params: {
  page?: number;
  limit?: number;
  status?: string;
  customerId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { page = 1, limit = 20, status, customerId, search, sortBy = 'createdAt', sortOrder = 'desc' } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.ShipmentWhereInput = {};
  if (status) where.status = status as ShipmentStatus;
  if (customerId) where.customerId = customerId;
  if (search) {
    where.OR = [
      { shipmentNumber: { contains: search, mode: 'insensitive' } },
      { packageDescription: { contains: search, mode: 'insensitive' } },
      { pickupAddress: { contains: search, mode: 'insensitive' } },
      { deliveryAddress: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      include: {
        customer: { select: { name: true, customerId: true } },
        assignments: {
          where: { status: 'ACTIVE' },
          include: {
            driver: { select: { name: true, driverId: true } },
            vehicle: { select: { registrationNumber: true, vehicleId: true } },
          },
          take: 1,
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.shipment.count({ where }),
  ]);

  return {
    data: shipments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Cancel a shipment with proper state validation and resource release.
 */
export async function cancelShipment(
  shipmentId: string,
  reason: string,
  userId: string,
  role: string,
  customerId?: string
) {
  return prisma.$transaction(async (tx) => {
    // Lock the shipment row for update
    const shipments = await tx.$queryRaw<Array<{
      shipment_id: string;
      status: string;
      customer_id: string;
    }>>`
      SELECT shipment_id, status, customer_id 
      FROM shipments 
      WHERE shipment_id = ${shipmentId} 
      FOR UPDATE
    `;

    if (shipments.length === 0) {
      throw new BusinessError('Shipment not found', 404);
    }

    const shipment = shipments[0];

    // Ownership check for customers
    if (role === 'CUSTOMER' && customerId && shipment.customer_id !== customerId) {
      throw new BusinessError('Shipment not found', 404);
    }

    // Check if shipment can be cancelled
    if (!canCancel(shipment.status as ShipmentStatus)) {
      throw new BusinessError(
        `Cannot cancel shipment in ${shipment.status} status. Cancellation is only allowed for: ${CANCELLABLE_STATUSES.join(', ')}`,
        409
      );
    }

    // Cancel any active assignments and release resources
    const activeAssignments = await tx.driverAssignment.findMany({
      where: {
        shipmentId,
        status: 'ACTIVE',
      },
    });

    for (const assignment of activeAssignments) {
      // Cancel the assignment
      await tx.driverAssignment.update({
        where: { assignmentId: assignment.assignmentId },
        data: {
          status: 'CANCELLED',
          endedAt: new Date(),
        },
      });

      // Release the driver
      await tx.driver.update({
        where: { driverId: assignment.driverId },
        data: { currentStatus: 'AVAILABLE' },
      });

      // Release the vehicle
      await tx.vehicle.update({
        where: { vehicleId: assignment.vehicleId },
        data: {
          currentStatus: 'AVAILABLE',
          currentDriverId: null,
        },
      });
    }

    // Update shipment status
    const updated = await tx.shipment.update({
      where: { shipmentId },
      data: {
        status: ShipmentStatus.CANCELLED,
        cancellationReason: reason,
      },
    });

    // Create delivery event
    await tx.deliveryEvent.create({
      data: {
        eventId: generateId('EVT'),
        shipmentId,
        eventType: DeliveryEventType.CANCELLED,
        location: 'System',
        notes: `Cancelled: ${reason}`,
        idempotencyKey: `cancel-${shipmentId}-${Date.now()}`,
      },
    });

    // Audit log
    await createAuditLog(
      {
        userId,
        action: 'SHIPMENT_CANCELLED',
        entityType: 'SHIPMENT',
        entityId: shipmentId,
        metadata: { reason, previousStatus: shipment.status },
      },
      tx
    );

    return updated;
  });
}

/**
 * Get shipment tracking timeline.
 */
export async function getShipmentTracking(shipmentId: string, customerId?: string) {
  const shipment = await prisma.shipment.findUnique({
    where: { shipmentId },
    select: { customerId: true },
  });

  if (!shipment) {
    throw new BusinessError('Shipment not found', 404);
  }

  if (customerId && shipment.customerId !== customerId) {
    throw new BusinessError('Shipment not found', 404);
  }

  return prisma.deliveryEvent.findMany({
    where: { shipmentId },
    orderBy: { createdAt: 'asc' },
    include: {
      driver: { select: { name: true } },
    },
  });
}

/**
 * Reschedule a failed delivery.
 */
export async function rescheduleShipment(
  shipmentId: string,
  data: { scheduledPickupDate: string; scheduledDeliveryDate: string; notes?: string },
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const shipments = await tx.$queryRaw<Array<{
      shipment_id: string;
      status: string;
    }>>`
      SELECT shipment_id, status FROM shipments 
      WHERE shipment_id = ${shipmentId} 
      FOR UPDATE
    `;

    if (shipments.length === 0) {
      throw new BusinessError('Shipment not found', 404);
    }

    const shipment = shipments[0];

    if (!isValidTransition(shipment.status as ShipmentStatus, ShipmentStatus.RESCHEDULED)) {
      throw new BusinessError(
        `Cannot reschedule shipment in ${shipment.status} status. Only DELIVERY_FAILED shipments can be rescheduled.`,
        409
      );
    }

    // Cancel any existing active/failed assignments
    await tx.driverAssignment.updateMany({
      where: {
        shipmentId,
        status: { in: ['ACTIVE', 'FAILED'] },
      },
      data: {
        status: 'CANCELLED',
        endedAt: new Date(),
      },
    });

    const updated = await tx.shipment.update({
      where: { shipmentId },
      data: {
        status: ShipmentStatus.RESCHEDULED,
        scheduledPickupDate: new Date(data.scheduledPickupDate),
        scheduledDeliveryDate: new Date(data.scheduledDeliveryDate),
        failureReason: null,
      },
    });

    await tx.deliveryEvent.create({
      data: {
        eventId: generateId('EVT'),
        shipmentId,
        eventType: DeliveryEventType.RESCHEDULED,
        location: 'System',
        notes: data.notes || 'Delivery rescheduled',
        idempotencyKey: `reschedule-${shipmentId}-${Date.now()}`,
      },
    });

    await createAuditLog(
      {
        userId,
        action: 'SHIPMENT_RESCHEDULED',
        entityType: 'SHIPMENT',
        entityId: shipmentId,
        metadata: {
          scheduledPickupDate: data.scheduledPickupDate,
          scheduledDeliveryDate: data.scheduledDeliveryDate,
        },
      },
      tx
    );

    return updated;
  });
}
