'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { StatusBadge, PriorityBadge, PageHeader, Pagination, EmptyState } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function DriverDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/deliveries')
      .then((r) => r.json())
      .then((d) => setDeliveries(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Deliveries" />
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Deliveries" description="All your assigned shipments" />

      {deliveries.length === 0 ? (
        <EmptyState icon={<Package className="h-10 w-10" />} title="No deliveries" description="You haven't been assigned any deliveries yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deliveries.map((s: any) => (
            <Link key={s.shipmentId} href={`/dashboard/driver/deliveries/${s.shipmentId}`}>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{s.shipmentNumber}</CardTitle>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={s.priority} />
                      <StatusBadge status={s.status} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{s.packageDescription} · {s.packageWeightKg} kg</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>📍 {s.pickupAddress}</p>
                    <p>🏁 {s.deliveryAddress}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Customer: {s.customer?.name}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
