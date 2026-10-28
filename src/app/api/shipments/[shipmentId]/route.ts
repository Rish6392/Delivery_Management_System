export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/auth-helpers';
import { getShipment } from '@/services/shipment.service';

// GET /api/shipments/[shipmentId] - Get shipment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const user = await requireAuth();
    const { shipmentId } = await params;

    // Drivers: verify they are assigned to this shipment
    if (user.role === 'DRIVER') {
      const shipment = await getShipment(shipmentId);
      const isAssigned = shipment.assignments.some(
        a => a.driver.driverId === user.driverId && ['ACTIVE', 'COMPLETED'].includes(a.status)
      );
      if (!isAssigned) {
        return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
      }
      return NextResponse.json(shipment);
    }

    const shipment = await getShipment(
      shipmentId,
      user.userId,
      user.role,
      user.customerId || undefined
    );

    return NextResponse.json(shipment);
  } catch (error) {
    return handleApiError(error);
  }
}
