"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string | null;
}

const UOM_OPTIONS = [
  { value: "NUMERIC_MAX", label: "Numeric (Max)" },
  { value: "NUMERIC_MIN", label: "Numeric (Min)" },
  { value: "TIMELINE", label: "Timeline" },
  { value: "ZERO", label: "Zero" },
] as const;

export function PushGoalClient({ employees }: { employees: Employee[] }) {
  const [thrustArea, setThrustArea] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uom, setUom] = useState<string>("NUMERIC_MAX");
  const [target, setTarget] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ copiesCreated: number } | null>(null);

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  function toggleEmployee(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((e) => e.id)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.size === 0) { alert("Select at least one recipient"); return; }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/push-shared-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thrustArea,
          title,
          description: description || undefined,
          uom,
          target: Number(target),
          recipientIds: Array.from(selectedIds),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Failed to push goal");
        return;
      }
      const data = await res.json();
      setResult(data);
      setThrustArea(""); setTitle(""); setDescription(""); setTarget("");
      setSelectedIds(new Set());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Push Shared Goal</h1>

      {result && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Successfully pushed to <strong>{result.copiesCreated}</strong> recipient(s).
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Goal Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="thrustArea">Thrust Area</Label>
              <Input id="thrustArea" value={thrustArea} onChange={(e) => setThrustArea(e.target.value)} required placeholder="e.g. Customer Success" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Goal Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Achieve NPS > 70" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Additional context" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uom">Unit of Measure</Label>
              <select
                id="uom"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={uom}
                onChange={(e) => setUom(e.target.value)}
              >
                {UOM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target">Target (fixed for all recipients)</Label>
              <Input id="target" type="number" min="0" step="any" value={target} onChange={(e) => setTarget(e.target.value)} required placeholder="100" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Recipients{" "}
                {selectedIds.size > 0 && (
                  <Badge variant="secondary" className="ml-1">{selectedIds.size} selected</Badge>
                )}
              </CardTitle>
              <button type="button" onClick={toggleAll} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                {selectedIds.size === filtered.length && filtered.length > 0 ? "Deselect all" : "Select all"}
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Search employees…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="max-h-72 overflow-y-auto space-y-1 rounded-md border p-2">
              {filtered.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">No employees found</p>
              )}
              {filtered.map((emp) => (
                <label
                  key={emp.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(emp.id)}
                    onChange={() => toggleEmployee(emp.id)}
                    className="accent-primary"
                  />
                  <span className="flex-1 text-sm font-medium">{emp.name}</span>
                  <span className="text-xs text-muted-foreground">{emp.department ?? emp.email}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={submitting || selectedIds.size === 0}>
          {submitting ? "Pushing..." : `Push to ${selectedIds.size} recipient${selectedIds.size !== 1 ? "s" : ""}`}
        </Button>
      </form>
    </div>
  );
}
