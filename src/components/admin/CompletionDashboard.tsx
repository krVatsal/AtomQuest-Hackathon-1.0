"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;
type Q = (typeof QUARTERS)[number];

interface EmployeeRow {
  id: string;
  name: string;
  managerName: string | null;
  department: string | null;
  sheetStatus: string | null;
  checkInsDone: Record<Q, boolean>;
}

interface CycleInfo {
  q1Open: string;
  q2Open: string;
  q3Open: string;
  q4Open: string;
}

function getQuarterState(
  q: Q,
  cycle: CycleInfo,
  done: boolean
): "done" | "overdue" | "open" | "not-open" {
  const opens: Record<Q, Date> = {
    Q1: new Date(cycle.q1Open),
    Q2: new Date(cycle.q2Open),
    Q3: new Date(cycle.q3Open),
    Q4: new Date(cycle.q4Open),
  };
  const closes: Record<Q, Date> = {
    Q1: new Date(cycle.q2Open),
    Q2: new Date(cycle.q3Open),
    Q3: new Date(cycle.q4Open),
    Q4: new Date(new Date(cycle.q4Open).getFullYear() + 1, 3, 30),
  };

  const now = new Date();
  if (now < opens[q]) return "not-open";
  if (done) return "done";
  if (now >= closes[q]) return "overdue";
  return "open";
}

const STATE_STYLES: Record<string, string> = {
  done: "bg-green-100 text-green-800 border-green-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
  open: "bg-amber-100 text-amber-800 border-amber-200",
  "not-open": "bg-muted text-muted-foreground border-border",
};

const STATE_LABELS: Record<string, string> = {
  done: "✅",
  overdue: "❌",
  open: "⏳",
  "not-open": "—",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  SUBMITTED: "default",
  APPROVED: "default",
  LOCKED: "outline",
  RETURNED: "destructive",
};

export function CompletionDashboard({
  employees,
  cycle,
}: {
  employees: EmployeeRow[];
  cycle: CycleInfo;
}) {
  if (employees.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No employees to display.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Employee</th>
            <th className="px-3 py-2 text-left font-medium">Manager</th>
            <th className="px-3 py-2 text-left font-medium">Dept</th>
            <th className="px-3 py-2 text-center font-medium">Status</th>
            {QUARTERS.map((q) => (
              <th key={q} className="px-3 py-2 text-center font-medium">
                {q}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, i) => (
            <tr
              key={emp.id}
              className={cn(
                "border-b transition-colors hover:bg-muted/30",
                i % 2 === 0 ? "" : "bg-muted/10"
              )}
            >
              <td className="px-3 py-2 font-medium">{emp.name}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {emp.managerName ?? "—"}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {emp.department ?? "—"}
              </td>
              <td className="px-3 py-2 text-center">
                {emp.sheetStatus ? (
                  <Badge
                    variant={STATUS_VARIANT[emp.sheetStatus] ?? "secondary"}
                    className="text-xs"
                  >
                    {emp.sheetStatus}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              {QUARTERS.map((q) => {
                const state = getQuarterState(q, cycle, emp.checkInsDone[q]);
                return (
                  <td key={q} className="px-3 py-2 text-center">
                    <span
                      className={cn(
                        "inline-block rounded border px-2 py-0.5 text-xs",
                        STATE_STYLES[state]
                      )}
                      title={state}
                    >
                      {STATE_LABELS[state]}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
