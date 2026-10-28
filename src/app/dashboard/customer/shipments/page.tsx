'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Package } from 'lucide-react';
import { StatusBadge, PriorityBadge, PageHeader, Pagination, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function CustomerShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(), limit: '15',
        ...(search && { search }),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
      });
      const res = await fetch(`/api/shipments?${params}`);
      const data = await res.json();
      setShipments(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Shipments" description="Track all your shipments">
        <Link href="/dashboard/customer/shipments/new">
          <Button>+ New Shipment</Button>
        </Link>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? 'ALL'); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="CREATED">Created</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="DELIVERY_FAILED">Failed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : shipments.length === 0 ? (
        <EmptyState icon={<Package className="h-10 w-10" />} title="No shipments found" />
      ) : (
        <div className="space-y-3">
          {shipments.map((s) => (
            <Link key={s.shipmentId} href={`/dashboard/customer/shipments/${s.shipmentId}`}>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer mb-3">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-medium">{s.shipmentNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={s.priority} />
                      <StatusBadge status={s.status} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{s.packageDescription} · {s.packageWeightKg} kg</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs text-muted-foreground">
                    <span>📍 {s.pickupAddress}</span>
                    <span>🏁 {s.deliveryAddress}</span>
                    <span>📅 {formatDate(s.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
