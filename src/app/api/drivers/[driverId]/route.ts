export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, handleApiError, BusinessError } from '@/lib/auth-helpers';
import prisma from '@/lib/db';
import { updateDriverSchema } from '@/lib/validations';
import { createAuditLog } from '@/services/audit.service';

// GET /api/drivers/[driverId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    await requireRole('ADMIN', 'DISPATCHER');
    const { driverId } = await params;

    const driver = await prisma.driver.findUnique({
      where: { driverId },
      include: {
        user: { select: { email: true, status: true } },
        assignments: {
          include: {
            shipment: { select: { shipmentNumber: true, status: true, shipmentId: true } },
            vehicle: { select: { registrationNumber: true } },
          },
          orderBy: { assignedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!driver) {
      throw new BusinessError('Driver not found', 404);
    }

    return NextResponse.json(driver);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/drivers/[driverId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const user = await requireRole('ADMIN');
    const { driverId } = await params;

    const body = await request.json();
    const validated = updateDriverSchema.parse(body);

    const existing = await prisma.driver.findUnique({ where: { driverId } });
    if (!existing) {
      throw new BusinessError('Driver not found', 404);
    }

    const updateData: any = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.phone) updateData.phone = validated.phone;
    if (validated.licenseNumber) updateData.licenseNumber = validated.licenseNumber;
    if (validated.licenseExpiry) updateData.licenseExpiry = new Date(validated.licenseExpiry);
    if (validated.status) updateData.status = validated.status;
    if (validated.currentStatus) updateData.currentStatus = validated.currentStatus;

    const driver = await prisma.driver.update({
      where: { driverId },
      data: updateData,
    });

    await createAuditLog({
      userId: user.userId,
      action: 'DRIVER_UPDATED',
      entityType: 'DRIVER',
      entityId: driverId,
      metadata: validated as Record<string, unknown>,
    });

    return NextResponse.json(driver);
  } catch (error) {
    return handleApiError(error);
  }
}
