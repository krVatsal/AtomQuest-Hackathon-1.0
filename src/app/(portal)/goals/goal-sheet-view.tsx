"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GoalForm } from "@/components/goals/GoalForm";
import { WeightageBar } from "@/components/goals/WeightageBar";
import { SubmitButton } from "./submit-button";
import type { GoalFormValues } from "@/lib/validations/goal";

interface GoalData {
  id: string;
  thrustArea: string;
  title: string;
  description: string | null;
  uom: string;
  target: number;
  weightage: number;
  isShared: boolean;
}

interface SheetData {
  id: string;
  status: string;
  goals: GoalData[];
}

interface GoalSheetViewProps {
  cycleId: string;
  cycleYear: number;
  sheet: SheetData | null;
}

const UOM_LABELS: Record<string, string> = {
  NUMERIC_MIN: "Numeric (Min)",
  NUMERIC_MAX: "Numeric (Max)",
  TIMELINE: "Timeline",
  ZERO: "Zero",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  SUBMITTED: "default",
  APPROVED: "default",
  LOCKED: "outline",
  RETURNED: "destructive",
};

export function GoalSheetView({ cycleId, cycleYear, sheet }: GoalSheetViewProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);

  const isDraft = sheet?.status === "DRAFT";
  const isReadOnly = sheet?.status === "LOCKED" || sheet?.status === "APPROVED";
  const totalWeightage = sheet?.goals.reduce((s, g) => s + g.weightage, 0) ?? 0;

  async function createSheet() {
    setSheetLoading(true);
    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleId }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSheetLoading(false);
    }
  }

  async function handleAddGoal(data: GoalFormValues) {
    setFormLoading(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Failed to add goal");
        return;
      }
      setCreating(false);
      router.refresh();
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdateGoal(id: string, data: GoalFormValues) {
    setFormLoading(true);
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Failed to update goal");
        return;
      }
      setEditingId(null);
      router.refresh();
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeleteGoal(id: string) {
    if (!confirm("Delete this goal?")) return;
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error ?? "Failed to delete goal");
      return;
    }
    router.refresh();
  }

  // No sheet yet — show start button
  if (!sheet) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">My Goals</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">
              Goal cycle <strong>{cycleYear}</strong> is active. Start setting your goals.
            </p>
            <Button onClick={createSheet} disabled={sheetLoading}>
              {sheetLoading ? "Creating..." : "Start Goal Setting"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Goals</h1>
          <p className="text-sm text-muted-foreground">
            Cycle {cycleYear} &middot; {sheet.goals.length} goal
            {sheet.goals.length !== 1 && "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[sheet.status] ?? "secondary"}>
            {sheet.status}
          </Badge>
          {isDraft && (
            <SubmitButton
              sheetId={sheet.id}
              totalWeightage={totalWeightage}
              goalCount={sheet.goals.length}
              isDraft={isDraft}
            />
          )}
        </div>
      </div>

      {/* Weightage Bar */}
      <Card>
        <CardContent className="pt-6">
          <WeightageBar
            goals={sheet.goals.map((g) => ({
              id: g.id,
              title: g.title,
              weightage: g.weightage,
            }))}
          />
        </CardContent>
      </Card>

      {/* Goal List */}
      <div className="space-y-3">
        {sheet.goals.map((goal) =>
          editingId === goal.id ? (
            <Card key={goal.id}>
              <CardHeader>
                <CardTitle className="text-base">Edit Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <GoalForm
                  defaultValues={{
                    thrustArea: goal.thrustArea,
                    title: goal.title,
                    description: goal.description ?? "",
                    uom: goal.uom as GoalFormValues["uom"],
                    target: goal.target,
                    weightage: goal.weightage,
                  }}
                  isShared={goal.isShared}
                  onSubmit={(data) => handleUpdateGoal(goal.id, data)}
                  onCancel={() => setEditingId(null)}
                  isLoading={formLoading}
                />
              </CardContent>
            </Card>
          ) : (
            <Card key={goal.id}>
              <CardContent className="flex items-start justify-between gap-4 pt-6">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {goal.thrustArea}
                    </span>
                    {goal.isShared && (
                      <Badge variant="outline" className="text-[10px]">
                        Shared
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium">{goal.title}</p>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground">
                      {goal.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
                    <span>UoM: {UOM_LABELS[goal.uom] ?? goal.uom}</span>
                    <span>Target: {goal.target}</span>
                    <span className="font-semibold text-foreground">
                      Weightage: {goal.weightage}%
                    </span>
                  </div>
                </div>

                {isDraft && !isReadOnly && (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(goal.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Add Goal */}
      {isDraft && !isReadOnly && (
        <>
          {creating ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">New Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <GoalForm
                  onSubmit={handleAddGoal}
                  onCancel={() => setCreating(false)}
                  isLoading={formLoading}
                />
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setCreating(true)}
              disabled={sheet.goals.length >= 8}
            >
              {sheet.goals.length >= 8
                ? "Maximum 8 goals reached"
                : "+ Add Goal"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
