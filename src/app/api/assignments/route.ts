export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, handleApiError } from '@/lib/auth-helpers';
import { createAssignment, getAssignments } from '@/services/assignment.service';
import { createAssignmentSchema } from '@/lib/validations';

// GET /api/assignments - List assignments
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole('ADMIN', 'DISPATCHER');
    const searchParams = request.nextUrl.searchParams;

    const result = await getAssignments({
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      driverId: searchParams.get('driverId') || undefined,
      shipmentId: searchParams.get('shipmentId') || undefined,
      status: searchParams.get('status') || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/assignments - Create assignment
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('ADMIN', 'DISPATCHER');
    
    const body = await request.json();
    const validated = createAssignmentSchema.parse(body);

    const assignment = await createAssignment({
      ...validated,
      assignedByUserId: user.userId,
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
