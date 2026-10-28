export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, handleApiError, BusinessError } from '@/lib/auth-helpers';
import prisma from '@/lib/db';
import { createVehicleSchema, updateVehicleSchema, paginationSchema } from '@/lib/validations';
import { generateId } from '@/lib/utils';
import { createAuditLog } from '@/services/audit.service';

// GET /api/vehicles
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole('ADMIN', 'DISPATCHER');
    const searchParams = request.nextUrl.searchParams;

    const query = paginationSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
    });

    const where: any = {};
    if (query.status) where.currentStatus = query.status;
    if (query.search) {
      where.OR = [
        { registrationNumber: { contains: query.search, mode: 'insensitive' } },
        { vehicleType: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: {
          currentDriver: { select: { name: true, driverId: true } },
          assignments: {
            where: { status: 'ACTIVE' },
            include: {
              shipment: { select: { shipmentNumber: true } },
              driver: { select: { name: true } },
            },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: ((query.page || 1) - 1) * (query.limit || 20),
        take: query.limit || 20,
      }),
      prisma.vehicle.count({ where }),
    ]);

    return NextResponse.json({
      data: vehicles,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 20,
        total,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/vehicles
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('ADMIN');

    const body = await request.json();
    const validated = createVehicleSchema.parse(body);

    const vehicleId = generateId('VEH');

    const vehicle = await prisma.vehicle.create({
      data: {
        vehicleId,
        registrationNumber: validated.registrationNumber,
        vehicleType: validated.vehicleType,
        capacityKg: validated.capacityKg,
        status: 'ACTIVE',
        currentStatus: 'AVAILABLE',
      },
    });

    await createAuditLog({
      userId: user.userId,
      action: 'VEHICLE_CREATED',
      entityType: 'VEHICLE',
      entityId: vehicleId,
      metadata: { registrationNumber: validated.registrationNumber },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
