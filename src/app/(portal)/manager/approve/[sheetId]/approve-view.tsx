"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Types ──────────────────────────────────────────────────

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

interface SheetPayload {
  id: string;
  status: string;
  returnReason: string | null;
  employee: { name: string; email: string };
  goals: GoalData[];
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

// ─── Component ──────────────────────────────────────────────

export function ApproveView({ sheet }: { sheet: SheetPayload }) {
  const router = useRouter();

  // Local editable copies
  const [goals, setGoals] = useState<GoalData[]>(sheet.goals);
  const [approving, setApproving] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returning, setReturning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubmitted = sheet.status === "SUBMITTED";
  const totalWeightage = goals.reduce((s, g) => s + g.weightage, 0);

  function updateGoalField(
    id: string,
    field: "target" | "weightage",
    value: number
  ) {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  }

  // Compute a simple reference score per goal (% of target achieved — placeholder 0 for now)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function computeScore(_goal: GoalData): string {
    return "—";
  }

  // ─── Approve ────────────────────────────────────────────

  async function handleApprove() {
    setApproving(true);
    setError(null);

    // Save any inline edits first
    try {
      for (const goal of goals) {
        const original = sheet.goals.find((g) => g.id === goal.id);
        if (
          original &&
          (original.target !== goal.target ||
            original.weightage !== goal.weightage)
        ) {
          const res = await fetch(`/api/goals/${goal.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              thrustArea: goal.thrustArea,
              title: goal.title,
              description: goal.description ?? "",
              uom: goal.uom,
              target: goal.target,
              weightage: goal.weightage,
            }),
          });
          if (!res.ok) {
            const data = await res.json();
            setError(data.error ?? "Failed to save edits");
            setApproving(false);
            return;
          }
        }
      }

      const res = await fetch(`/api/sheets/${sheet.id}/approve`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Approval failed");
        setApproving(false);
        return;
      }

      router.push("/manager/team");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setApproving(false);
    }
  }

  // ─── Return ─────────────────────────────────────────────

  async function handleReturn() {
    setReturning(true);
    setError(null);

    try {
      const res = await fetch(`/api/sheets/${sheet.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: returnReason }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Return failed");
        setReturning(false);
        return;
      }

      setReturnDialogOpen(false);
      router.push("/manager/team");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setReturning(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/manager/team"
            className="text-sm text-muted-foreground hover:underline"
          >
            &larr; Back to Team
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            {sheet.employee.name}&apos;s Goals
          </h1>
          <p className="text-sm text-muted-foreground">
            {sheet.employee.email}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[sheet.status] ?? "secondary"}>
          {sheet.status}
        </Badge>
      </div>

      {sheet.returnReason && sheet.status === "RETURNED" && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-red-600">
              Previously returned:
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {sheet.returnReason}
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Goal Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Goals ({goals.length}) · Weightage: {totalWeightage}%
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thrust Area</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead>UoM</TableHead>
                <TableHead className="w-24">Target</TableHead>
                <TableHead className="w-28">Weightage (%)</TableHead>
                <TableHead className="w-24 text-center text-muted-foreground">
                  Score
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.map((goal) => (
                <TableRow key={goal.id}>
                  <TableCell>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {goal.thrustArea}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{goal.title}</p>
                    {goal.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {goal.description}
                      </p>
                    )}
                    {goal.isShared && (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        Shared
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {UOM_LABELS[goal.uom] ?? goal.uom}
                  </TableCell>
                  <TableCell>
                    {isSubmitted ? (
                      <Input
                        type="number"
                        step="any"
                        className="h-7 w-20 text-sm"
                        value={goal.target}
                        onChange={(e) =>
                          updateGoalField(
                            goal.id,
                            "target",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    ) : (
                      <span>{goal.target}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isSubmitted ? (
                      <Input
                        type="number"
                        min={10}
                        max={100}
                        className="h-7 w-20 text-sm"
                        value={goal.weightage}
                        onChange={(e) =>
                          updateGoalField(
                            goal.id,
                            "weightage",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    ) : (
                      <span>{goal.weightage}%</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {computeScore(goal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Actions */}
      {isSubmitted && (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => setReturnDialogOpen(true)}
            disabled={approving}
          >
            Return for Rework
          </Button>
          <Button
            onClick={handleApprove}
            disabled={approving || totalWeightage !== 100}
          >
            {approving ? "Approving..." : "Approve & Lock"}
          </Button>
        </div>
      )}

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return for Rework</DialogTitle>
            <DialogDescription>
              Provide feedback so {sheet.employee.name} can revise their goals.
              They will receive an email notification.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for returning..."
            rows={4}
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReturnDialogOpen(false)}
              disabled={returning}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReturn}
              disabled={returning || !returnReason.trim()}
            >
              {returning ? "Returning..." : "Return Sheet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
