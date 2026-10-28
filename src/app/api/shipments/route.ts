export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError, BusinessError } from '@/lib/auth-helpers';
import { createShipment, getShipments } from '@/services/shipment.service';
import { createShipmentSchema, paginationSchema } from '@/lib/validations';

// GET /api/shipments - List shipments
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;

    const query = paginationSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    // Customers can only see their own shipments
    const customerId = user.role === 'CUSTOMER' ? user.customerId || undefined : 
      searchParams.get('customerId') || undefined;

    const result = await getShipments({
      ...query,
      customerId: customerId || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/shipments - Create shipment
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Only customers, admins, and dispatchers can create shipments
    if (!['CUSTOMER', 'ADMIN', 'DISPATCHER'].includes(user.role)) {
      throw new BusinessError('Insufficient permissions', 403);
    }

    const body = await request.json();
    const validated = createShipmentSchema.parse(body);

    // For customers, use their own customer ID
    let customerId = body.customerId;
    if (user.role === 'CUSTOMER') {
      if (!user.customerId) {
        throw new BusinessError('Customer profile not found', 400);
      }
      customerId = user.customerId;
    } else if (!customerId) {
      throw new BusinessError('Customer ID is required', 400);
    }

    const shipment = await createShipment({
      ...validated,
      customerId,
      userId: user.userId,
    });

    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
