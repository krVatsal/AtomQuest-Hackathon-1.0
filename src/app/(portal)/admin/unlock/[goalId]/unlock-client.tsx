"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GoalInfo {
  id: string;
  title: string;
  thrustArea: string;
  sheetId: string;
  sheetStatus: string;
  cycleYear: number;
  employee: { id: string; name: string; email: string };
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  SUBMITTED: "default",
  APPROVED: "default",
  LOCKED: "outline",
  RETURNED: "destructive",
};

export function UnlockClient({ goal }: { goal: GoalInfo }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const canUnlock = goal.sheetStatus !== "DRAFT";

  async function handleUnlock() {
    if (!confirm(`Unlock "${goal.title}" and set the sheet back to DRAFT? This will allow the employee to edit their goals again.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/unlock/${goal.id}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Failed to unlock");
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="mb-2 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Unlock Goal Sheet</h1>
      </div>

      {done && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Sheet has been set back to <strong>DRAFT</strong>. The employee can now edit their goals.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Goal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Goal</span>
            <span className="font-medium text-right">{goal.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Thrust Area</span>
            <span>{goal.thrustArea}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cycle</span>
            <span>{goal.cycleYear}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Employee</span>
            <span className="text-right">
              <div className="font-medium">{goal.employee.name}</div>
              <div className="text-xs text-muted-foreground">{goal.employee.email}</div>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Sheet Status</span>
            <Badge variant={STATUS_VARIANT[goal.sheetStatus] ?? "secondary"}>
              {goal.sheetStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {canUnlock ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Unlocking will reset the sheet status to <strong>DRAFT</strong> and create an audit log entry.
          </p>
          <Button
            variant="destructive"
            disabled={loading || done}
            onClick={handleUnlock}
          >
            {loading ? "Unlocking..." : "Unlock for Editing"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This sheet is already in <strong>DRAFT</strong> — no action needed.
        </p>
      )}
    </div>
  );
}
