export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/auth-helpers';
import { getShipmentTracking } from '@/services/shipment.service';

// GET /api/shipments/[shipmentId]/tracking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const user = await requireAuth();
    const { shipmentId } = await params;

    const customerId = user.role === 'CUSTOMER' ? user.customerId || undefined : undefined;

    const events = await getShipmentTracking(shipmentId, customerId);

    return NextResponse.json({ data: events });
  } catch (error) {
    return handleApiError(error);
  }
}
