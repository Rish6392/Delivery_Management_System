'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Package, Truck, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { StatCard, PageHeader, StatusBadge } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports')
      .then((r) => r.json())
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" description="Operational analytics" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (!report) return <div className="text-muted-foreground">Failed to load reports.</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Reports" description="Operational analytics and performance metrics" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Shipments" value={report.shipments?.total || 0} icon={<Package className="h-5 w-5" />} />
        <StatCard title="Delivered" value={report.shipments?.delivered || 0} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard title="In Transit" value={report.shipments?.inTransit || 0} icon={<Truck className="h-5 w-5" />} />
        <StatCard title="Failed" value={report.shipments?.failed || 0} icon={<XCircle className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Active Drivers" value={report.drivers?.active || 0} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Pending Shipments" value={report.shipments?.created || 0} icon={<Clock className="h-5 w-5" />} />
        <StatCard title="Cancelled" value={report.shipments?.cancelled || 0} icon={<XCircle className="h-5 w-5" />} />
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader><CardTitle>Shipment Status Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {report.shipments?.byStatus && Object.entries(report.shipments.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-md border p-3">
                <StatusBadge status={status} />
                <span className="text-lg font-bold">{count as number}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Breakdown */}
      {report.shipments?.byPriority && (
        <Card>
          <CardHeader><CardTitle>Priority Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(report.shipments.byPriority).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between rounded-md border p-3">
                  <span className="text-sm font-medium">{priority}</span>
                  <span className="text-lg font-bold">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
