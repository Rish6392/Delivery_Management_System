'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/* ─── Status Badge ──────────────────────────────────────────────── */

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CREATED: 'secondary',
  ASSIGNED: 'default',
  PICKUP_CONFIRMED: 'default',
  IN_TRANSIT: 'default',
  OUT_FOR_DELIVERY: 'default',
  DELIVERED: 'default',
  DELIVERY_FAILED: 'destructive',
  RESCHEDULED: 'secondary',
  CANCELLED: 'outline',
  ACTIVE: 'default',
  AVAILABLE: 'default',
  MAINTENANCE: 'secondary',
  INACTIVE: 'outline',
  COMPLETED: 'default',
  FAILED: 'destructive',
  ON_DELIVERY: 'default',
  EN_ROUTE: 'default',
};

const statusColor: Record<string, string> = {
  CREATED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  ASSIGNED: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  PICKUP_CONFIRMED: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  IN_TRANSIT: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  OUT_FOR_DELIVERY: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  DELIVERED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  DELIVERY_FAILED: 'bg-red-500/15 text-red-400 border-red-500/30',
  RESCHEDULED: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  CANCELLED: 'bg-muted text-muted-foreground border-border',
  ACTIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  AVAILABLE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  MAINTENANCE: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  INACTIVE: 'bg-muted text-muted-foreground border-border',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  FAILED: 'bg-red-500/15 text-red-400 border-red-500/30',
  ON_DELIVERY: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  EN_ROUTE: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[11px] font-semibold tracking-wide border',
        statusColor[status] || 'bg-muted text-muted-foreground',
        className
      )}
    >
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}

/* ─── Priority Badge ────────────────────────────────────────────── */

const priorityColor: Record<string, string> = {
  LOW: 'bg-muted text-muted-foreground border-border',
  NORMAL: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  HIGH: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  URGENT: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[11px] font-semibold tracking-wide border',
        priorityColor[priority] || 'bg-muted text-muted-foreground',
        className
      )}
    >
      {priority}
    </Badge>
  );
}

/* ─── Stat Card ─────────────────────────────────────────────────── */

export function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

/* ─── Page Header ───────────────────────────────────────────────── */

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm mt-0.5">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 mt-2 sm:mt-0">{children}</div>}
    </div>
  );
}

/* ─── Empty State ───────────────────────────────────────────────── */

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground mb-3">{icon}</div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      </CardContent>
    </Card>
  );
}

/* ─── Pagination ────────────────────────────────────────────────── */

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-md text-sm font-medium border border-border bg-card hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>
      <span className="px-4 py-1.5 text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 rounded-md text-sm font-medium border border-border bg-card hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}
