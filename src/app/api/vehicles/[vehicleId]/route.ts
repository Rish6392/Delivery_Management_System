export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, handleApiError, BusinessError } from '@/lib/auth-helpers';
import prisma from '@/lib/db';
import { updateVehicleSchema } from '@/lib/validations';
import { createAuditLog } from '@/services/audit.service';

// GET /api/vehicles/[vehicleId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    await requireRole('ADMIN', 'DISPATCHER');
    const { vehicleId } = await params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { vehicleId },
      include: {
        currentDriver: { select: { name: true, driverId: true } },
        assignments: {
          include: {
            shipment: { select: { shipmentNumber: true, status: true } },
            driver: { select: { name: true } },
          },
          orderBy: { assignedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!vehicle) {
      throw new BusinessError('Vehicle not found', 404);
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/vehicles/[vehicleId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const user = await requireRole('ADMIN');
    const { vehicleId } = await params;

    const body = await request.json();
    const validated = updateVehicleSchema.parse(body);

    const existing = await prisma.vehicle.findUnique({ where: { vehicleId } });
    if (!existing) {
      throw new BusinessError('Vehicle not found', 404);
    }

    const updateData: any = {};
    if (validated.registrationNumber) updateData.registrationNumber = validated.registrationNumber;
    if (validated.vehicleType) updateData.vehicleType = validated.vehicleType;
    if (validated.capacityKg) updateData.capacityKg = validated.capacityKg;
    if (validated.status) updateData.status = validated.status;
    if (validated.currentStatus) updateData.currentStatus = validated.currentStatus;

    const vehicle = await prisma.vehicle.update({
      where: { vehicleId },
      data: updateData,
    });

    await createAuditLog({
      userId: user.userId,
      action: 'VEHICLE_UPDATED',
      entityType: 'VEHICLE',
      entityId: vehicleId,
      metadata: validated as Record<string, unknown>,
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    return handleApiError(error);
  }
}
