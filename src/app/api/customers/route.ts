export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireAuth, handleApiError, BusinessError } from '@/lib/auth-helpers';
import prisma from '@/lib/db';
import { paginationSchema } from '@/lib/validations';

// GET /api/customers
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole('ADMIN', 'DISPATCHER');
    const searchParams = request.nextUrl.searchParams;

    const query = paginationSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
      search: searchParams.get('search') || undefined,
    });

    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { customerNumber: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          user: { select: { email: true, status: true } },
          _count: { select: { shipments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: ((query.page || 1) - 1) * (query.limit || 20),
        take: query.limit || 20,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      data: customers,
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
