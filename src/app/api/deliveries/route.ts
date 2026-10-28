export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, handleApiError, BusinessError } from '@/lib/auth-helpers';
import { updateDeliveryStatus, getDriverDeliveries } from '@/services/delivery.service';
import { updateDeliveryStatusSchema } from '@/lib/validations';

// GET /api/deliveries - Get driver's deliveries
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;

    if (user.role === 'DRIVER') {
      if (!user.driverId) {
        throw new BusinessError('Driver profile not found', 400);
      }
      const deliveries = await getDriverDeliveries(user.driverId, status);
      return NextResponse.json({ data: deliveries });
    }

    if (['ADMIN', 'DISPATCHER'].includes(user.role)) {
      const driverId = searchParams.get('driverId');
      if (!driverId) {
        throw new BusinessError('Driver ID is required', 400);
      }
      const deliveries = await getDriverDeliveries(driverId, status);
      return NextResponse.json({ data: deliveries });
    }

    throw new BusinessError('Insufficient permissions', 403);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/deliveries - Update delivery status
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== 'DRIVER') {
      throw new BusinessError('Only drivers can update delivery status', 403);
    }

    if (!user.driverId) {
      throw new BusinessError('Driver profile not found', 400);
    }

    const body = await request.json();
    const validated = updateDeliveryStatusSchema.parse(body);

    const result = await updateDeliveryStatus({
      shipmentId: body.shipmentId,
      driverId: user.driverId,
      status: validated.status,
      location: validated.location,
      notes: validated.notes,
      failureReason: validated.failureReason,
      idempotencyKey: validated.idempotencyKey,
      userId: user.userId,
    });

    return NextResponse.json(result, { status: result.idempotent ? 200 : 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
