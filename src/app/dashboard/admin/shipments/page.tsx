'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, RefreshCw } from 'lucide-react';
import { StatusBadge, PriorityBadge, PageHeader, Pagination } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [assignForm, setAssignForm] = useState({ driverId: '', vehicleId: '' });
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    } catch { setError('Failed to load shipments'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  const openAssignModal = async (shipmentId: string) => {
    setSelectedShipment(shipmentId);
    setShowAssignModal(true);
    setAssignForm({ driverId: '', vehicleId: '' });
    setError('');
    try {
      const [dr, vr] = await Promise.all([fetch('/api/drivers?limit=100'), fetch('/api/vehicles?limit=100')]);
      const dd = await dr.json(); const vd = await vr.json();
      setDrivers(dd.data?.filter((d: any) => d.currentStatus === 'AVAILABLE' && d.status === 'ACTIVE') || []);
      setVehicles(vd.data?.filter((v: any) => v.currentStatus === 'AVAILABLE' && v.status === 'ACTIVE') || []);
    } catch { setError('Failed to load resources'); }
  };

  const handleAssign = async () => {
    if (!assignForm.driverId || !assignForm.vehicleId || !selectedShipment) return;
    setAssigning(true); setError('');
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId: selectedShipment, driverId: assignForm.driverId, vehicleId: assignForm.vehicleId }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Assignment failed'); }
      setSuccess('Driver assigned successfully!');
      setShowAssignModal(false);
      fetchShipments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.message); }
    finally { setAssigning(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Shipments" description="Manage all shipments and assignments">
        <Button variant="outline" size="sm" onClick={fetchShipments}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </PageHeader>

      {success && (
        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">{success}</div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search shipments…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? 'ALL'); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="CREATED">Created</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="PICKUP_CONFIRMED">Pickup Confirmed</SelectItem>
            <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
            <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="DELIVERY_FAILED">Failed</SelectItem>
            <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((s) => (
                  <TableRow key={s.shipmentId}>
                    <TableCell>
                      <Link href={`/dashboard/admin/shipments/${s.shipmentId}`} className="font-medium text-primary hover:underline">
                        {s.shipmentNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{s.customer?.name}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-muted-foreground">{s.packageDescription}</TableCell>
                    <TableCell>{s.packageWeightKg} kg</TableCell>
                    <TableCell><PriorityBadge priority={s.priority} /></TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{s.assignments?.[0]?.driver?.name || '—'}</TableCell>
                    <TableCell className="text-right">
                      {(s.status === 'CREATED' || s.status === 'RESCHEDULED') && (
                        <Button size="sm" onClick={() => openAssignModal(s.shipmentId)}>Assign</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Assign Dialog */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver & Vehicle</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Driver</Label>
              <Select value={assignForm.driverId} onValueChange={(v) => setAssignForm({ ...assignForm, driverId: v ?? '' })}>
                <SelectTrigger><SelectValue placeholder="Choose a driver…" /></SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.driverId} value={d.driverId}>{d.name} ({d.employeeNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Select value={assignForm.vehicleId} onValueChange={(v) => setAssignForm({ ...assignForm, vehicleId: v ?? '' })}>
                <SelectTrigger><SelectValue placeholder="Choose a vehicle…" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.vehicleId} value={v.vehicleId}>{v.registrationNumber} ({v.vehicleType}, {v.capacityKg}kg)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button onClick={handleAssign} disabled={!assignForm.driverId || !assignForm.vehicleId || assigning}>
              {assigning ? 'Assigning…' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
