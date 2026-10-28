'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface ShipmentActionsProps {
  shipmentId: string;
  status: string;
}

export function ShipmentActions({ shipmentId, status }: ShipmentActionsProps) {
  const router = useRouter();
  const [showCancel, setShowCancel] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleData, setRescheduleData] = useState({ pickupDate: '', deliveryDate: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canCancel = ['CREATED', 'ASSIGNED', 'DELIVERY_FAILED'].includes(status);
  const canReschedule = status === 'DELIVERY_FAILED';

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to cancel'); }
      setShowCancel(false);
      router.refresh();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleReschedule = async () => {
    if (!rescheduleData.pickupDate || !rescheduleData.deliveryDate) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/reschedule`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledPickupDate: new Date(rescheduleData.pickupDate).toISOString(),
          scheduledDeliveryDate: new Date(rescheduleData.deliveryDate).toISOString(),
          notes: rescheduleData.notes,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to reschedule'); }
      setShowReschedule(false);
      router.refresh();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="flex gap-3">
        {canReschedule && (
          <Button variant="outline" onClick={() => setShowReschedule(true)}>Reschedule</Button>
        )}
        {canCancel && (
          <Button variant="destructive" onClick={() => setShowCancel(true)}>Cancel Shipment</Button>
        )}
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel Shipment</DialogTitle></DialogHeader>
          {error && <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="space-y-2">
            <Label>Cancellation Reason</Label>
            <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Enter reason…" />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Back</Button>} />
            <Button variant="destructive" onClick={handleCancel} disabled={!cancelReason.trim() || loading}>
              {loading ? 'Cancelling…' : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showReschedule} onOpenChange={setShowReschedule}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reschedule Delivery</DialogTitle></DialogHeader>
          {error && <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Pickup Date</Label>
              <Input type="datetime-local" value={rescheduleData.pickupDate} onChange={(e) => setRescheduleData({ ...rescheduleData, pickupDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>New Delivery Date</Label>
              <Input type="datetime-local" value={rescheduleData.deliveryDate} onChange={(e) => setRescheduleData({ ...rescheduleData, deliveryDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea value={rescheduleData.notes} onChange={(e) => setRescheduleData({ ...rescheduleData, notes: e.target.value })} placeholder="Notes…" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button onClick={handleReschedule} disabled={!rescheduleData.pickupDate || !rescheduleData.deliveryDate || loading}>
              {loading ? 'Rescheduling…' : 'Reschedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
