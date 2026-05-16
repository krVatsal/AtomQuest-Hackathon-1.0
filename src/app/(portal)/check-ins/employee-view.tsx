"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AchievementInput } from "@/components/check-ins/AchievementInput";
import { ProgressScore } from "@/components/shared/ProgressScore";
import type { UoMType } from "@/lib/scoring";

// ─── Types ──────────────────────────────────────────────────

interface GoalRow {
  id: string;
  title: string;
  uom: string;
  target: number;
  weightage: number;
  achievement: { actual: number | null; status: string } | null;
}

interface Props {
  quarter: string;
  cycleYear: number;
  goals: GoalRow[];
}

type AchieveStatus = "NOT_STARTED" | "ON_TRACK" | "COMPLETED";

const STATUS_OPTIONS: { value: AchieveStatus; label: string }[] = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "ON_TRACK", label: "On Track" },
  { value: "COMPLETED", label: "Completed" },
];

// ─── Component ──────────────────────────────────────────────

export function EmployeeCheckInsView({ quarter, cycleYear, goals }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Local editable state keyed by goalId
  const [entries, setEntries] = useState<
    Record<string, { actual: number | null; status: AchieveStatus }>
  >(() => {
    const init: Record<string, { actual: number | null; status: AchieveStatus }> = {};
    for (const g of goals) {
      init[g.id] = {
        actual: g.achievement?.actual ?? null,
        status: (g.achievement?.status as AchieveStatus) ?? "NOT_STARTED",
      };
    }
    return init;
  });

  function updateActual(goalId: string, actual: number | null) {
    setEntries((prev) => ({
      ...prev,
      [goalId]: { ...prev[goalId], actual },
    }));
    setSaved(false);
  }

  function updateStatus(goalId: string, status: AchieveStatus) {
    setEntries((prev) => ({
      ...prev,
      [goalId]: { ...prev[goalId], status },
    }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      for (const goalId of Object.keys(entries)) {
        const entry = entries[goalId];
        const res = await fetch("/api/achievements", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goalId,
            quarter,
            actual: entry.actual,
            status: entry.status,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? `Failed to save achievement for goal ${goalId}`);
          setSaving(false);
          return;
        }
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Check-Ins</h1>
          <p className="text-sm text-muted-foreground">
            {quarter} · Cycle {cycleYear} · {goals.length} goal
            {goals.length !== 1 && "s"}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Achievements saved successfully.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Goals — {quarter}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Goal</TableHead>
                <TableHead className="w-20 text-center">Target</TableHead>
                <TableHead className="w-40">Actual</TableHead>
                <TableHead className="w-36">Status</TableHead>
                <TableHead className="w-20 text-center">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.map((goal) => {
                const entry = entries[goal.id];
                return (
                  <TableRow key={goal.id}>
                    <TableCell>
                      <p className="font-medium">{goal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {goal.weightage}% weightage
                      </p>
                    </TableCell>
                    <TableCell className="text-center">{goal.target}</TableCell>
                    <TableCell>
                      <AchievementInput
                        uom={goal.uom as UoMType}
                        value={entry?.actual ?? null}
                        onChange={(v) => updateActual(goal.id, v)}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={entry?.status ?? "NOT_STARTED"}
                        onValueChange={(v) =>
                          updateStatus(goal.id, v as AchieveStatus)
                        }
                      >
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      <ProgressScore
                        uom={goal.uom as UoMType}
                        target={goal.target}
                        actual={entry?.actual}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
