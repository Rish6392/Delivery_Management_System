'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

export default function NewShipmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    pickupAddress: '', deliveryAddress: '', packageDescription: '',
    packageWeightKg: '', priority: 'NORMAL',
    scheduledPickupDate: '', scheduledDeliveryDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/shipments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form, packageWeightKg: parseFloat(form.packageWeightKg),
          scheduledPickupDate: form.scheduledPickupDate ? new Date(form.scheduledPickupDate).toISOString() : undefined,
          scheduledDeliveryDate: form.scheduledDeliveryDate ? new Date(form.scheduledDeliveryDate).toISOString() : undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to create'); }
      router.push('/dashboard/customer/shipments');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <Link href="/dashboard/customer/shipments" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Shipments
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create New Shipment</CardTitle>
          <CardDescription>Fill in the details to create a new shipment</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="pickup">Pickup Address</Label>
              <Input id="pickup" value={form.pickupAddress} onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })} placeholder="Enter pickup address" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery">Delivery Address</Label>
              <Input id="delivery" value={form.deliveryAddress} onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })} placeholder="Enter delivery address" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Package Description</Label>
              <Textarea id="desc" value={form.packageDescription} onChange={(e) => setForm({ ...form, packageDescription: e.target.value })} placeholder="Describe contents" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input id="weight" type="number" step="0.1" value={form.packageWeightKg} onChange={(e) => setForm({ ...form, packageWeightKg: e.target.value })} placeholder="0.0" required />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v ?? 'NORMAL' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupDate">Scheduled Pickup</Label>
                <Input id="pickupDate" type="datetime-local" value={form.scheduledPickupDate} onChange={(e) => setForm({ ...form, scheduledPickupDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Scheduled Delivery</Label>
                <Input id="deliveryDate" type="datetime-local" value={form.scheduledDeliveryDate} onChange={(e) => setForm({ ...form, scheduledDeliveryDate: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create Shipment'}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
