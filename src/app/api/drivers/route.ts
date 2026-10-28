export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireAuth, handleApiError, BusinessError } from '@/lib/auth-helpers';
import prisma from '@/lib/db';
import { createDriverSchema, updateDriverSchema, paginationSchema } from '@/lib/validations';
import { generateId } from '@/lib/utils';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/services/audit.service';

// GET /api/drivers - List drivers
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
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { employeeNumber: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        include: {
          user: { select: { email: true, status: true } },
          assignments: {
            where: { status: 'ACTIVE' },
            include: {
              shipment: { select: { shipmentNumber: true, status: true } },
            },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: ((query.page || 1) - 1) * (query.limit || 20),
        take: query.limit || 20,
      }),
      prisma.driver.count({ where }),
    ]);

    return NextResponse.json({
      data: drivers,
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

// POST /api/drivers - Create driver
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('ADMIN');

    const body = await request.json();
    const validated = createDriverSchema.parse(body);

    const passwordHash = await bcrypt.hash(validated.password, 12);
    const userId = generateId('USR');
    const driverId = generateId('DRV');
    const employeeNumber = `DRV-EMP-${Date.now().toString(36).toUpperCase()}`;

    const result = await prisma.$transaction(async (tx) => {
      // Create user account
      const newUser = await tx.user.create({
        data: {
          userId,
          name: validated.name,
          email: validated.email,
          passwordHash,
          role: 'DRIVER',
          status: 'ACTIVE',
        },
      });

      // Create driver profile
      const driver = await tx.driver.create({
        data: {
          driverId,
          employeeNumber,
          userId,
          name: validated.name,
          phone: validated.phone,
          licenseNumber: validated.licenseNumber,
          licenseExpiry: new Date(validated.licenseExpiry),
          status: 'ACTIVE',
          currentStatus: 'AVAILABLE',
        },
      });

      await createAuditLog({
        userId: user.userId,
        action: 'DRIVER_CREATED',
        entityType: 'DRIVER',
        entityId: driverId,
        metadata: { name: validated.name },
      }, tx);

      return driver;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
