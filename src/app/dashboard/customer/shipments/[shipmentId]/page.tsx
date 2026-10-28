'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Package, Calendar, CheckCircle, XCircle, Truck, Clock } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function CustomerShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shipmentId = params.shipmentId as string;

  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch(`/api/shipments/${shipmentId}`)
      .then((r) => { if (r.ok) return r.json(); throw new Error('Not found'); })
      .then(setShipment)
      .catch(() => router.push('/dashboard/customer/shipments'))
      .finally(() => setLoading(false));
  }, [shipmentId, router]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    setCancelling(true); setError('');
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to cancel'); }
      setSuccess('Shipment cancelled successfully');
      setShowCancel(false);
      const updated = await fetch(`/api/shipments/${shipmentId}`).then(r => r.json());
      setShipment(updated);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.message); }
    finally { setCancelling(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }
  if (!shipment) return null;

  const canCancel = ['CREATED', 'ASSIGNED', 'DELIVERY_FAILED'].includes(shipment.status);

  const eventIcons: Record<string, React.ReactNode> = {
    CREATED: <Clock className="h-4 w-4 text-blue-400" />,
    ASSIGNED: <Truck className="h-4 w-4 text-indigo-400" />,
    PICKUP_CONFIRMED: <CheckCircle className="h-4 w-4 text-cyan-400" />,
    IN_TRANSIT: <Truck className="h-4 w-4 text-sky-400" />,
    OUT_FOR_DELIVERY: <Truck className="h-4 w-4 text-amber-400" />,
    DELIVERED: <CheckCircle className="h-4 w-4 text-emerald-400" />,
    DELIVERY_FAILED: <XCircle className="h-4 w-4 text-red-400" />,
    CANCELLED: <XCircle className="h-4 w-4 text-muted-foreground" />,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/customer/shipments">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{shipment.shipmentNumber}</h1>
              <StatusBadge status={shipment.status} />
            </div>
            <p className="text-muted-foreground text-sm">{shipment.packageDescription}</p>
          </div>
        </div>
        {canCancel && <Button variant="destructive" onClick={() => setShowCancel(true)}>Cancel Shipment</Button>}
      </div>

      {error && <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>}
      {success && <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">{success}</div>}

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
                <div><p className="text-xs text-muted-foreground">Weight</p><p className="text-sm">{shipment.packageWeightKg} kg</p></div>
              </div>
              <div><p className="text-xs text-muted-foreground">Priority</p><PriorityBadge priority={shipment.priority} /></div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div><p className="text-xs text-muted-foreground">Scheduled Pickup</p><p className="text-sm">{shipment.scheduledPickupDate ? formatDate(shipment.scheduledPickupDate) : '—'}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <div><p className="text-xs text-muted-foreground">Scheduled Delivery</p><p className="text-sm">{shipment.scheduledDeliveryDate ? formatDate(shipment.scheduledDeliveryDate) : '—'}</p></div>
              </div>
            </CardContent>
          </Card>

          {shipment.proofOfDelivery?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Proof of Delivery</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {shipment.proofOfDelivery.map((p: any) => (
                  <div key={p.proofId} className="flex items-center justify-between rounded-md p-3 border">
                    <div><p className="text-sm font-medium">{p.fileName}</p><p className="text-xs text-muted-foreground">{formatDate(p.uploadedAt)}</p></div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
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
              <p className="text-sm text-muted-foreground">No tracking events yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel Shipment</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Reason for cancellation</Label>
            <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Why are you cancelling?" />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Back</Button>} />
            <Button variant="destructive" onClick={handleCancel} disabled={!cancelReason.trim() || cancelling}>
              {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
