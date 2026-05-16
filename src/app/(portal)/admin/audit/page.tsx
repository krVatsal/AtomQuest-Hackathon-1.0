"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AuditEntry {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
  user: { name: string; email: string };
}

interface AuditResponse {
  logs: AuditEntry[];
  total: number;
  page: number;
  totalPages: number;
}

const ENTITY_OPTIONS = ["", "GoalSheet", "Goal", "Achievement", "User"];

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [entity, setEntity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (entity) params.set("entity", entity);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/admin/audit?${params}`);
      if (!res.ok) return;
      const data: AuditResponse = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } finally {
      setLoading(false);
    }
  }, [entity, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    fetchLogs(1);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label>Entity Type</Label>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
              >
                {ENTITY_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o || "All"}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Date From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date To</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <Button type="submit" variant="outline">Apply</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setEntity(""); setDateFrom(""); setDateTo(""); }}
            >
              Clear
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Old Value</TableHead>
                <TableHead>New Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!loading && logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No audit entries found.
                  </TableCell>
                </TableRow>
              )}
              {!loading && logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{log.user.name}</div>
                    <div className="text-xs text-muted-foreground">{log.user.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.entity}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.field ?? "—"}</TableCell>
                  <TableCell className="max-w-32 truncate text-muted-foreground">{log.oldValue ?? "—"}</TableCell>
                  <TableCell className="max-w-32 truncate">{log.newValue ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} total entries</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => fetchLogs(page - 1)}
            >
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => fetchLogs(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
