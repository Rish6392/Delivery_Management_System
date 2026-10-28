'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList } from 'lucide-react';
import { StatusBadge, PageHeader, Pagination, EmptyState } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '15' });
      const res = await fetch(`/api/assignments?${params}`);
      const data = await res.json();
      setAssignments(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Assignments" description="Driver-vehicle assignment history" />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : assignments.length === 0 ? (
            <div className="p-6"><EmptyState icon={<ClipboardList className="h-10 w-10" />} title="No assignments yet" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment ID</TableHead>
                  <TableHead>Shipment</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Assigned By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Assigned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.assignmentId}>
                    <TableCell className="font-mono text-xs">{a.assignmentId}</TableCell>
                    <TableCell className="font-medium">{a.shipment?.shipmentNumber}</TableCell>
                    <TableCell>{a.driver?.name}</TableCell>
                    <TableCell>{a.vehicle?.registrationNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{a.assignedBy?.name}</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">{formatDate(a.assignedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
