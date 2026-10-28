export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, handleApiError } from '@/lib/auth-helpers';
import { rescheduleShipment } from '@/services/shipment.service';
import { rescheduleShipmentSchema } from '@/lib/validations';

// POST /api/shipments/[shipmentId]/reschedule
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const user = await requireRole('ADMIN', 'DISPATCHER');
    const { shipmentId } = await params;

    const body = await request.json();
    const validated = rescheduleShipmentSchema.parse(body);

    const shipment = await rescheduleShipment(shipmentId, validated, user.userId);

    return NextResponse.json(shipment);
  } catch (error) {
    return handleApiError(error);
  }
}
