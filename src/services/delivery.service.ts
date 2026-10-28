import prisma from '@/lib/db';
import { ShipmentStatus, DeliveryEventType } from '@prisma/client';
import { isValidTransition } from '@/lib/state-machine';
import { createAuditLog } from './audit.service';
import { generateId } from '@/lib/utils';
import { BusinessError } from '@/lib/auth-helpers';

/**
 * Update delivery status with idempotency support (Challenge 6).
 * 
 * The idempotency key ensures that if a driver submits the same status update
 * twice (e.g., due to network failure), only one event is created.
 */
export async function updateDeliveryStatus(data: {
  shipmentId: string;
  driverId: string;
  status: string;
  location?: string;
  notes?: string;
  failureReason?: string;
  idempotencyKey: string;
  userId: string;
}) {
  // Check for existing idempotent request
  const existingEvent = await prisma.deliveryEvent.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
  });

  if (existingEvent) {
    // Verify the payload matches (same shipment, same event type)
    if (
      existingEvent.shipmentId !== data.shipmentId ||
      existingEvent.eventType !== data.status
    ) {
      throw new BusinessError(
        'Idempotency key already used with different parameters',
        409
      );
    }
    // Return the existing event (idempotent response)
    return { event: existingEvent, idempotent: true };
  }

  return prisma.$transaction(async (tx) => {
    // Lock the shipment for update
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
    const newStatus = data.status as ShipmentStatus;

    // Validate state transition
    if (!isValidTransition(shipment.status as ShipmentStatus, newStatus)) {
      throw new BusinessError(
        `Invalid status transition from ${shipment.status} to ${newStatus}`,
        409
      );
    }

    // Verify driver is assigned to this shipment
    const activeAssignment = await tx.driverAssignment.findFirst({
      where: {
        shipmentId: data.shipmentId,
        driverId: data.driverId,
        status: 'ACTIVE',
      },
    });

    if (!activeAssignment) {
      throw new BusinessError(
        'You are not assigned to this shipment',
        403
      );
    }

    // Handle specific status updates
    const updateData: any = { status: newStatus };

    if (newStatus === ShipmentStatus.DELIVERY_FAILED) {
      if (!data.failureReason) {
        throw new BusinessError('Failure reason is required for failed deliveries', 400);
      }
      updateData.failureReason = data.failureReason;
    }

    // Update shipment status
    await tx.shipment.update({
      where: { shipmentId: data.shipmentId },
      data: updateData,
    });

    // Handle assignment status changes
    if (newStatus === ShipmentStatus.DELIVERED) {
      // Complete the assignment
      await tx.driverAssignment.update({
        where: { assignmentId: activeAssignment.assignmentId },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
        },
      });

      // Release driver
      await tx.driver.update({
        where: { driverId: data.driverId },
        data: { currentStatus: 'AVAILABLE' },
      });

      // Release vehicle
      await tx.vehicle.update({
        where: { vehicleId: activeAssignment.vehicleId },
        data: {
          currentStatus: 'AVAILABLE',
          currentDriverId: null,
        },
      });
    } else if (newStatus === ShipmentStatus.DELIVERY_FAILED) {
      // Mark assignment as failed
      await tx.driverAssignment.update({
        where: { assignmentId: activeAssignment.assignmentId },
        data: {
          status: 'FAILED',
          endedAt: new Date(),
        },
      });

      // Release driver
      await tx.driver.update({
        where: { driverId: data.driverId },
        data: { currentStatus: 'AVAILABLE' },
      });

      // Release vehicle
      await tx.vehicle.update({
        where: { vehicleId: activeAssignment.vehicleId },
        data: {
          currentStatus: 'AVAILABLE',
          currentDriverId: null,
        },
      });
    } else if (newStatus === ShipmentStatus.PICKUP_CONFIRMED) {
      // Start the assignment
      await tx.driverAssignment.update({
        where: { assignmentId: activeAssignment.assignmentId },
        data: { startedAt: new Date() },
      });

      // Update driver to ON_DELIVERY
      await tx.driver.update({
        where: { driverId: data.driverId },
        data: { currentStatus: 'ON_DELIVERY' },
      });

      // Update vehicle to IN_TRANSIT
      await tx.vehicle.update({
        where: { vehicleId: activeAssignment.vehicleId },
        data: { currentStatus: 'IN_TRANSIT' },
      });
    }

    // Create delivery event with idempotency key
    const event = await tx.deliveryEvent.create({
      data: {
        eventId: generateId('EVT'),
        shipmentId: data.shipmentId,
        driverId: data.driverId,
        eventType: newStatus as unknown as DeliveryEventType,
        location: data.location || '',
        notes: data.notes || (data.failureReason ? `Failed: ${data.failureReason}` : ''),
        idempotencyKey: data.idempotencyKey,
      },
    });

    // Audit log
    await createAuditLog(
      {
        userId: data.userId,
        action: `SHIPMENT_${newStatus}`,
        entityType: 'SHIPMENT',
        entityId: data.shipmentId,
        metadata: {
          previousStatus: shipment.status,
          newStatus,
          driverId: data.driverId,
        },
      },
      tx
    );

    return { event, idempotent: false };
  }, {
    timeout: 10000,
  });
}

/**
 * Get delivery events for a driver's assigned shipments.
 */
export async function getDriverDeliveries(driverId: string, status?: string) {
  const where: any = { driverId };
  if (status) where.status = status;

  return prisma.driverAssignment.findMany({
    where,
    include: {
      shipment: {
        include: {
          customer: { select: { name: true, phone: true, address: true } },
          deliveryEvents: { orderBy: { createdAt: 'desc' }, take: 1 },
          proofOfDelivery: true,
        },
      },
      vehicle: { select: { registrationNumber: true, vehicleType: true } },
    },
    orderBy: { assignedAt: 'desc' },
  });
}
