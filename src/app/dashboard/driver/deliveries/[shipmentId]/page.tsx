'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Package, CheckCircle, XCircle, Truck, Clock } from 'lucide-react';
import { StatusBadge, PriorityBadge, PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

const STATUS_FLOW = ['PICKUP_CONFIRMED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED'];

export default function DriverDeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shipmentId = params.shipmentId as string;

  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({ status: '', location: '', notes: '' });
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchShipment = () => {
    fetch(`/api/shipments/${shipmentId}`)
      .then((r) => { if (r.ok) return r.json(); throw new Error('Not found'); })
      .then(setShipment)
      .catch(() => router.push('/dashboard/driver/deliveries'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchShipment(); }, [shipmentId]);

  const handleUpdate = async () => {
    if (!updateForm.status || !updateForm.location) return;
    setUpdating(true); setError('');
    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId, status: updateForm.status,
          location: updateForm.location, notes: updateForm.notes,
          idempotencyKey: `${shipmentId}-${updateForm.status}-${Date.now()}`,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Update failed'); }
      setSuccess('Status updated!');
      setShowUpdateModal(false);
      setUpdateForm({ status: '', location: '', notes: '' });
      fetchShipment();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.message); }
    finally { setUpdating(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }
  if (!shipment) return null;

  const nextStatuses = STATUS_FLOW.filter((s) => {
    const current = STATUS_FLOW.indexOf(shipment.status);
    const target = STATUS_FLOW.indexOf(s);
    if (shipment.status === 'ASSIGNED') return ['PICKUP_CONFIRMED'].includes(s);
    if (current === -1 || target === -1) return false;
    return target === current + 1 || s === 'DELIVERY_FAILED';
  });

  const eventIcons: Record<string, React.ReactNode> = {
    PICKUP_CONFIRMED: <CheckCircle className="h-4 w-4 text-cyan-400" />,
    IN_TRANSIT: <Truck className="h-4 w-4 text-sky-400" />,
    OUT_FOR_DELIVERY: <Truck className="h-4 w-4 text-amber-400" />,
    DELIVERED: <CheckCircle className="h-4 w-4 text-emerald-400" />,
    DELIVERY_FAILED: <XCircle className="h-4 w-4 text-red-400" />,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/driver/deliveries">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{shipment.shipmentNumber}</h1>
            <StatusBadge status={shipment.status} />
            <PriorityBadge priority={shipment.priority} />
          </div>
        </div>
        {nextStatuses.length > 0 && (
          <Button onClick={() => setShowUpdateModal(true)}>Update Status</Button>
        )}
      </div>

      {success && <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">{success}</div>}
      {error && !showUpdateModal && <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Shipment Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <div><p className="text-xs text-muted-foreground">Pickup</p><p className="text-sm">{shipment.pickupAddress}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <div><p className="text-xs text-muted-foreground">Delivery</p><p className="text-sm">{shipment.deliveryAddress}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div><p className="text-xs text-muted-foreground">Package</p><p className="text-sm">{shipment.packageDescription} · {shipment.packageWeightKg} kg</p></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="text-sm font-medium">{shipment.customer?.name}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card className="h-fit">
          <CardHeader><CardTitle>Tracking</CardTitle></CardHeader>
          <CardContent>
            {shipment.deliveryEvents?.length > 0 ? (
              <div className="space-y-0">
                {shipment.deliveryEvents.map((event: any, idx: number) => (
                  <div key={event.eventId} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-card">
                        {eventIcons[event.eventType] || <Clock className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      {idx < shipment.deliveryEvents.length - 1 && <div className="w-px flex-1 bg-border" />}
                    </div>
                    <div className="pb-6">
                      <p className="text-sm font-medium">{event.eventType.replace(/_/g, ' ')}</p>
                      {event.notes && <p className="text-xs text-muted-foreground">{event.notes}</p>}
                      <p className="text-xs text-muted-foreground/60 mt-0.5">{formatDate(event.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No events yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Update Dialog */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Delivery Status</DialogTitle></DialogHeader>
          {error && showUpdateModal && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={updateForm.status} onValueChange={(v) => setUpdateForm({ ...updateForm, status: v ?? '' })}>
                <SelectTrigger><SelectValue placeholder="Select status…" /></SelectTrigger>
                <SelectContent>
                  {nextStatuses.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={updateForm.location} onChange={(e) => setUpdateForm({ ...updateForm, location: e.target.value })} placeholder="Current location" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={updateForm.notes} onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })} placeholder="Additional notes…" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button onClick={handleUpdate} disabled={!updateForm.status || !updateForm.location || updating}>
              {updating ? 'Updating…' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
