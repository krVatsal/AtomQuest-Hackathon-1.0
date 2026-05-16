"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProgressScore } from "@/components/shared/ProgressScore";
import type { UoMType } from "@/lib/scoring";

// ─── Types ──────────────────────────────────────────────────

interface GoalRow {
  id: string;
  title: string;
  uom: string;
  target: number;
  weightage: number;
  actual: number | null;
  status: string;
  lastCheckIn: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  goals: GoalRow[];
}

interface Props {
  quarter: string;
  cycleYear: number;
  team: TeamMember[];
}

// ─── Component ──────────────────────────────────────────────

export function ManagerCheckInsView({ quarter, cycleYear, team }: Props) {
  const router = useRouter();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  function setComment(goalId: string, value: string) {
    setComments((prev) => ({ ...prev, [goalId]: value }));
  }

  async function submitCheckIn(goalId: string) {
    const comment = comments[goalId]?.trim();
    if (!comment) return;

    setSubmitting(goalId);
    setSuccessId(null);

    try {
      const res = await fetch("/api/check-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, quarter, comment }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to save check-in");
        return;
      }

      setComments((prev) => ({ ...prev, [goalId]: "" }));
      setSuccessId(goalId);
      router.refresh();
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(null);
    }
  }

  if (team.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Team Check-Ins</h1>
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No team members with locked goal sheets for the current cycle.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Check-Ins</h1>
        <p className="text-sm text-muted-foreground">
          {quarter} · Cycle {cycleYear} · {team.length} team member
          {team.length !== 1 && "s"}
        </p>
      </div>

      {team.map((member) => (
        <Card key={member.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {member.name}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {member.email}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goal</TableHead>
                  <TableHead className="w-20 text-center">Target</TableHead>
                  <TableHead className="w-20 text-center">Actual</TableHead>
                  <TableHead className="w-20 text-center">Score</TableHead>
                  <TableHead>Check-In</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {member.goals.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell>
                      <p className="font-medium">{goal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {goal.weightage}% · {goal.status.replace("_", " ")}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">{goal.target}</TableCell>
                    <TableCell className="text-center">
                      {goal.actual !== null ? goal.actual : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <ProgressScore
                        uom={goal.uom as UoMType}
                        target={goal.target}
                        actual={goal.actual}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {goal.lastCheckIn && (
                          <p className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                            Previous: {goal.lastCheckIn}
                          </p>
                        )}
                        <div className="flex items-start gap-2">
                          <Textarea
                            placeholder="Add check-in comment..."
                            rows={2}
                            className="min-w-[200px] text-xs"
                            value={comments[goal.id] ?? ""}
                            onChange={(e) =>
                              setComment(goal.id, e.target.value)
                            }
                          />
                          <Button
                            size="sm"
                            disabled={
                              submitting === goal.id ||
                              !comments[goal.id]?.trim()
                            }
                            onClick={() => submitCheckIn(goal.id)}
                          >
                            {submitting === goal.id ? "..." : "Save"}
                          </Button>
                        </div>
                        {successId === goal.id && (
                          <p className="text-xs text-emerald-600">Saved!</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
