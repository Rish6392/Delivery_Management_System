export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError, BusinessError } from '@/lib/auth-helpers';
import { cancelShipment } from '@/services/shipment.service';
import { cancelShipmentSchema } from '@/lib/validations';

// POST /api/shipments/[shipmentId]/cancel
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const user = await requireAuth();
    const { shipmentId } = await params;

    // Only customers (own shipments), admins, and dispatchers can cancel
    if (!['CUSTOMER', 'ADMIN', 'DISPATCHER'].includes(user.role)) {
      throw new BusinessError('Insufficient permissions', 403);
    }

    const body = await request.json();
    const validated = cancelShipmentSchema.parse(body);

    const shipment = await cancelShipment(
      shipmentId,
      validated.reason,
      user.userId,
      user.role,
      user.customerId || undefined
    );

    return NextResponse.json(shipment);
  } catch (error) {
    return handleApiError(error);
  }
}
