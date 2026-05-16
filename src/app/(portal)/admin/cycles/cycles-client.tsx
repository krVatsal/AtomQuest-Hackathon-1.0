"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Cycle {
  id: string;
  year: number;
  isActive: boolean;
  phase1Open: string;
  q1Open: string;
  q2Open: string;
  q3Open: string;
  q4Open: string;
}

const DATE_FIELDS: { key: keyof Omit<Cycle, "id" | "year" | "isActive">; label: string }[] = [
  { key: "phase1Open", label: "Phase 1 Open" },
  { key: "q1Open", label: "Q1 Open" },
  { key: "q2Open", label: "Q2 Open" },
  { key: "q3Open", label: "Q3 Open" },
  { key: "q4Open", label: "Q4 Open" },
];

const toDateInput = (iso: string) => iso.slice(0, 10);

export function CyclesClient({ initialCycles }: { initialCycles: Cycle[] }) {
  const router = useRouter();
  const [cycles, setCycles] = useState<Cycle[]>(initialCycles);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const emptyForm = { year: "", phase1Open: "", q1Open: "", q2Open: "", q3Open: "", q4Open: "" };
  const [form, setForm] = useState(emptyForm);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Failed to create cycle");
        return;
      }
      setForm(emptyForm);
      setShowForm(false);
      router.refresh();
      const data = await res.clone().json();
      setCycles((prev) => [data, ...prev]);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(cycle: Cycle) {
    setToggling(cycle.id);
    try {
      const res = await fetch(`/api/admin/cycles/${cycle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setActive: !cycle.isActive }),
      });
      if (!res.ok) {
        alert("Failed to update cycle");
        return;
      }
      setCycles((prev) =>
        prev.map((c) => ({
          ...c,
          isActive: !cycle.isActive ? c.id === cycle.id : false,
        }))
      );
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Goal Cycles</h1>
        <Button onClick={() => setShowForm((v) => !v)} variant={showForm ? "outline" : "default"}>
          {showForm ? "Cancel" : "+ New Cycle"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create New Cycle</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="2025"
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                    required
                  />
                </div>
                {DATE_FIELDS.map(({ key, label }) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      type="date"
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      required
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Create Cycle"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {cycles.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No cycles yet.</p>
        )}
        {cycles.map((cycle) => (
          <Card key={cycle.id}>
            <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">Cycle {cycle.year}</span>
                  <Badge variant={cycle.isActive ? "default" : "secondary"}>
                    {cycle.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-muted-foreground sm:grid-cols-3">
                  {DATE_FIELDS.map(({ key, label }) => (
                    <span key={key}>
                      <span className="font-medium text-foreground">{label}:</span>{" "}
                      {toDateInput(cycle[key])}
                    </span>
                  ))}
                </div>
              </div>
              <Button
                variant={cycle.isActive ? "destructive" : "outline"}
                size="sm"
                disabled={toggling === cycle.id}
                onClick={() => handleToggleActive(cycle)}
              >
                {toggling === cycle.id
                  ? "Updating..."
                  : cycle.isActive
                  ? "Deactivate"
                  : "Set Active"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
