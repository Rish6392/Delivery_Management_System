export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, handleApiError } from '@/lib/auth-helpers';
import prisma from '@/lib/db';

// GET /api/reports
export async function GET(request: NextRequest) {
  try {
    await requireRole('ADMIN', 'DISPATCHER');

    const [
      totalShipments,
      shipmentsByStatus,
      totalDrivers,
      availableDrivers,
      totalVehicles,
      availableVehicles,
      totalCustomers,
      recentShipments,
      deliveryPerformance,
    ] = await Promise.all([
      prisma.shipment.count(),
      prisma.shipment.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.driver.count({ where: { status: 'ACTIVE' } }),
      prisma.driver.count({ where: { status: 'ACTIVE', currentStatus: 'AVAILABLE' } }),
      prisma.vehicle.count({ where: { status: 'ACTIVE' } }),
      prisma.vehicle.count({ where: { status: 'ACTIVE', currentStatus: 'AVAILABLE' } }),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.shipment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customer: { select: { name: true } },
          assignments: {
            where: { status: 'ACTIVE' },
            include: { driver: { select: { name: true } } },
            take: 1,
          },
        },
      }),
      prisma.shipment.groupBy({
        by: ['priority'],
        _count: { priority: true },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    shipmentsByStatus.forEach((s) => {
      statusMap[s.status] = s._count.status;
    });

    const priorityMap: Record<string, number> = {};
    deliveryPerformance.forEach((p) => {
      priorityMap[p.priority] = p._count.priority;
    });

    return NextResponse.json({
      overview: {
        totalShipments,
        activeDeliveries: (statusMap['ASSIGNED'] || 0) + (statusMap['PICKUP_CONFIRMED'] || 0) + 
          (statusMap['IN_TRANSIT'] || 0) + (statusMap['OUT_FOR_DELIVERY'] || 0),
        deliveredShipments: statusMap['DELIVERED'] || 0,
        failedDeliveries: statusMap['DELIVERY_FAILED'] || 0,
        cancelledShipments: statusMap['CANCELLED'] || 0,
        pendingShipments: statusMap['CREATED'] || 0,
        totalDrivers,
        availableDrivers,
        totalVehicles,
        availableVehicles,
        totalCustomers,
      },
      shipmentsByStatus: statusMap,
      shipmentsByPriority: priorityMap,
      recentShipments,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
