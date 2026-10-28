export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { Package, Truck, Users, Car, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { StatCard, StatusBadge, PriorityBadge, PageHeader } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [
    totalShipments, shipmentsByStatus,
    totalDrivers, availableDrivers,
    totalVehicles, availableVehicles,
    totalCustomers, recentShipments, failedDeliveries,
  ] = await Promise.all([
    prisma.shipment.count(),
    prisma.shipment.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.driver.count({ where: { status: 'ACTIVE' } }),
    prisma.driver.count({ where: { status: 'ACTIVE', currentStatus: 'AVAILABLE' } }),
    prisma.vehicle.count({ where: { status: 'ACTIVE' } }),
    prisma.vehicle.count({ where: { status: 'ACTIVE', currentStatus: 'AVAILABLE' } }),
    prisma.customer.count({ where: { status: 'ACTIVE' } }),
    prisma.shipment.findMany({
      orderBy: { createdAt: 'desc' }, take: 8,
      include: {
        customer: { select: { name: true } },
        assignments: { where: { status: 'ACTIVE' }, include: { driver: { select: { name: true } } }, take: 1 },
      },
    }),
    prisma.shipment.findMany({ where: { status: 'DELIVERY_FAILED' }, include: { customer: { select: { name: true } } } }),
  ]);

  const statusMap: Record<string, number> = {};
  shipmentsByStatus.forEach((s) => { statusMap[s.status] = s._count.status; });
  const activeDeliveries = (statusMap['ASSIGNED'] || 0) + (statusMap['PICKUP_CONFIRMED'] || 0) + (statusMap['IN_TRANSIT'] || 0) + (statusMap['OUT_FOR_DELIVERY'] || 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Dashboard" description={`Welcome back, ${(session.user as any).name}`} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Shipments" value={totalShipments} icon={<Package className="h-5 w-5" />} />
        <StatCard title="Active Deliveries" value={activeDeliveries} icon={<Truck className="h-5 w-5" />} />
        <StatCard title="Delivered" value={statusMap['DELIVERED'] || 0} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard title="Failed" value={statusMap['DELIVERY_FAILED'] || 0} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Available Drivers" value={`${availableDrivers}/${totalDrivers}`} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Available Vehicles" value={`${availableVehicles}/${totalVehicles}`} icon={<Car className="h-5 w-5" />} />
        <StatCard title="Total Customers" value={totalCustomers} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Pending" value={statusMap['CREATED'] || 0} subtitle="Awaiting assignment" icon={<Clock className="h-5 w-5" />} />
      </div>

      {/* Failed Deliveries Alert */}
      {failedDeliveries.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-destructive flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" /> Failed Deliveries Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {failedDeliveries.map((s) => (
              <Link
                key={s.shipmentId}
                href={`/dashboard/admin/shipments/${s.shipmentId}`}
                className="flex items-center justify-between rounded-md p-2.5 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{s.shipmentNumber}</span>
                  <span className="text-muted-foreground text-sm">{s.customer.name}</span>
                </div>
                <StatusBadge status={s.status} />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Shipments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Shipments</CardTitle>
          <Link href="/dashboard/admin/shipments" className="text-sm text-primary hover:underline">
            View all →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shipment</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentShipments.map((s) => (
                <TableRow key={s.shipmentId}>
                  <TableCell>
                    <Link href={`/dashboard/admin/shipments/${s.shipmentId}`} className="font-medium text-primary hover:underline">
                      {s.shipmentNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{s.customer.name}</TableCell>
                  <TableCell><PriorityBadge priority={s.priority} /></TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{s.assignments[0]?.driver.name || '—'}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">{formatDate(s.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
