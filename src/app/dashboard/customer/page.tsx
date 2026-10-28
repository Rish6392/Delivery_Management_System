export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { Package, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { StatCard, StatusBadge, PriorityBadge, PageHeader } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default async function CustomerDashboard() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const user = session.user as any;

  if (!user.customerId) {
    return <div className="text-muted-foreground p-8">Customer profile not configured.</div>;
  }

  const shipments = await prisma.shipment.findMany({
    where: { customerId: user.customerId },
    orderBy: { createdAt: 'desc' },
  });

  const delivered = shipments.filter((s) => s.status === 'DELIVERED').length;
  const active = shipments.filter((s) => !['DELIVERED', 'CANCELLED', 'DELIVERY_FAILED'].includes(s.status)).length;
  const failed = shipments.filter((s) => s.status === 'DELIVERY_FAILED').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={`Welcome, ${user.name}`} description="Track and manage your shipments">
        <Link href="/dashboard/customer/shipments/new">
          <Button>+ New Shipment</Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Shipments" value={shipments.length} icon={<Package className="h-5 w-5" />} />
        <StatCard title="Active" value={active} icon={<Clock className="h-5 w-5" />} />
        <StatCard title="Delivered" value={delivered} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard title="Failed" value={failed} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">My Shipments</CardTitle>
          <Link href="/dashboard/customer/shipments" className="text-sm text-primary hover:underline">View all →</Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shipment</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.slice(0, 10).map((s) => (
                <TableRow key={s.shipmentId}>
                  <TableCell>
                    <Link href={`/dashboard/customer/shipments/${s.shipmentId}`} className="font-medium text-primary hover:underline">
                      {s.shipmentNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.packageDescription}</TableCell>
                  <TableCell><PriorityBadge priority={s.priority} /></TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
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
