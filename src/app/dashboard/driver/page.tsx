export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { Package, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { StatCard, StatusBadge, PriorityBadge, PageHeader } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default async function DriverDashboard() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const user = session.user as any;

  if (!user.driverId) return <div className="text-muted-foreground p-8">Driver profile not configured.</div>;

  const assignments = await prisma.driverAssignment.findMany({
    where: { driverId: user.driverId },
    include: {
      shipment: { include: { customer: { select: { name: true } } } },
      vehicle: { select: { registrationNumber: true, vehicleType: true } },
    },
    orderBy: { assignedAt: 'desc' },
  });

  const active = assignments.filter((a) => a.status === 'ACTIVE');
  const completed = assignments.filter((a) => a.status === 'COMPLETED');
  const activeShipments = active.map((a) => a.shipment);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Driver Dashboard" description={`Welcome back, ${user.name}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Deliveries" value={active.length} icon={<Package className="h-5 w-5" />} />
        <StatCard title="Completed" value={completed.length} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard title="Total Assigned" value={assignments.length} icon={<Clock className="h-5 w-5" />} />
        <StatCard
          title="Needs Attention"
          value={activeShipments.filter((s) => s.status === 'DELIVERY_FAILED').length}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* Active Deliveries */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Active Deliveries</h2>
          <Link href="/dashboard/driver/deliveries" className="text-sm text-primary hover:underline">View all →</Link>
        </div>

        {activeShipments.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No active deliveries.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeShipments.map((s) => {
              const assignment = active.find((a) => a.shipmentId === s.shipmentId);
              return (
                <Link key={s.shipmentId} href={`/dashboard/driver/deliveries/${s.shipmentId}`}>
                  <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{s.shipmentNumber}</CardTitle>
                        <StatusBadge status={s.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="text-muted-foreground">{s.packageDescription}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span>📍 {s.pickupAddress}</span>
                        <span>🏁 {s.deliveryAddress}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Customer: {s.customer.name}</span>
                        <PriorityBadge priority={s.priority} />
                      </div>
                      {assignment && (
                        <p className="text-xs text-muted-foreground">Vehicle: {assignment.vehicle.registrationNumber}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
