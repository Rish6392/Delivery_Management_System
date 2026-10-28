export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft, MapPin, Package, Calendar, CheckCircle, XCircle, Truck, Clock, User } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default async function AdminShipmentDetailPage({ params }: { params: Promise<{ shipmentId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const { shipmentId } = await params;

  const shipment = await prisma.shipment.findUnique({
    where: { shipmentId },
    include: {
      customer: true,
      assignments: { include: { driver: true, vehicle: true, assignedBy: { select: { name: true } } }, orderBy: { assignedAt: 'desc' } },
      deliveryEvents: { orderBy: { createdAt: 'desc' } },
      proofOfDelivery: true,
    },
  });

  if (!shipment) notFound();

  const eventIcons: Record<string, React.ReactNode> = {
    CREATED: <Clock className="h-4 w-4 text-blue-400" />,
    ASSIGNED: <User className="h-4 w-4 text-indigo-400" />,
    PICKUP_CONFIRMED: <CheckCircle className="h-4 w-4 text-cyan-400" />,
    IN_TRANSIT: <Truck className="h-4 w-4 text-sky-400" />,
    OUT_FOR_DELIVERY: <Truck className="h-4 w-4 text-amber-400" />,
    DELIVERED: <CheckCircle className="h-4 w-4 text-emerald-400" />,
    DELIVERY_FAILED: <XCircle className="h-4 w-4 text-red-400" />,
    CANCELLED: <XCircle className="h-4 w-4 text-muted-foreground" />,
    RESCHEDULED: <Clock className="h-4 w-4 text-violet-400" />,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin/shipments">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{shipment.shipmentNumber}</h1>
            <StatusBadge status={shipment.status} />
            <PriorityBadge priority={shipment.priority} />
          </div>
          <p className="text-muted-foreground text-sm">{shipment.packageDescription}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipment Details */}
          <Card>
            <CardHeader><CardTitle>Shipment Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div><p className="text-xs text-muted-foreground">Scheduled Pickup</p><p className="text-sm">{shipment.scheduledPickupDate ? formatDate(shipment.scheduledPickupDate) : '—'}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <div><p className="text-xs text-muted-foreground">Scheduled Delivery</p><p className="text-sm">{shipment.scheduledDeliveryDate ? formatDate(shipment.scheduledDeliveryDate) : '—'}</p></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Customer</p>
                <p className="text-sm font-medium">{shipment.customer.name}</p>
                <p className="text-xs text-muted-foreground">{shipment.customer.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Assignments */}
          <Card>
            <CardHeader><CardTitle>Assignment History</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {shipment.assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assignments yet.</p>
              ) : (
                shipment.assignments.map((a) => (
                  <div key={a.assignmentId} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{a.driver.name}</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>Vehicle: <span className="text-foreground">{a.vehicle.registrationNumber}</span></div>
                      <div>Assigned by: <span className="text-foreground">{a.assignedBy.name}</span></div>
                      <div>Started: {a.startedAt ? formatDate(a.startedAt) : '—'}</div>
                      <div>Ended: {a.endedAt ? formatDate(a.endedAt) : '—'}</div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Proof of Delivery */}
          {shipment.proofOfDelivery.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Proof of Delivery</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {shipment.proofOfDelivery.map((p) => (
                  <div key={p.proofId} className="flex items-center justify-between rounded-md p-3 border">
                    <div>
                      <p className="text-sm font-medium">{p.fileName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.uploadedAt)}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — Timeline */}
        <Card className="h-fit">
          <CardHeader><CardTitle>Tracking Timeline</CardTitle></CardHeader>
          <CardContent>
            {shipment.deliveryEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet.</p>
            ) : (
              <div className="space-y-0">
                {shipment.deliveryEvents.map((event, idx) => (
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
                      {event.location && <p className="text-xs text-muted-foreground">📍 {event.location}</p>}
                      <p className="text-xs text-muted-foreground/60 mt-0.5">{formatDate(event.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
