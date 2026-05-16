"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompletionDashboard } from "@/components/admin/CompletionDashboard";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;
type Q = (typeof QUARTERS)[number];

interface GoalReport {
  id: string;
  title: string;
  thrustArea: string;
  uom: string;
  target: number;
  weightage: number;
  actuals: Record<Q, number | null>;
  score: number | null;
}

interface EmployeeReport {
  id: string;
  name: string;
  email: string;
  department: string | null;
  managerName: string | null;
  sheetStatus: string | null;
  checkInsDone: Record<Q, boolean>;
  goals: GoalReport[];
}

interface CycleInfo {
  year: number;
  q1Open: string;
  q2Open: string;
  q3Open: string;
  q4Open: string;
}

const SCORE_COLOR = (s: number | null) => {
  if (s === null) return "text-muted-foreground";
  if (s >= 86) return "text-green-700 font-semibold";
  if (s >= 60) return "text-amber-700 font-semibold";
  return "text-red-700 font-semibold";
};

export function ReportsClient({
  employees,
  cycle,
}: {
  employees: EmployeeReport[];
  cycle: CycleInfo | null;
}) {
  const [deptFilter, setDeptFilter] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [exporting, setExporting] = useState(false);

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).sort() as string[],
    [employees]
  );
  const managers = useMemo(
    () => Array.from(new Set(employees.map((e) => e.managerName).filter(Boolean))).sort() as string[],
    [employees]
  );

  const filtered = useMemo(
    () =>
      employees.filter(
        (e) =>
          (!deptFilter || e.department === deptFilter) &&
          (!managerFilter || e.managerName === managerFilter)
      ),
    [employees, deptFilter, managerFilter]
  );

  const barData = useMemo(() => {
    const withSheet = filtered.filter((e) => e.sheetStatus !== null);
    return QUARTERS.map((q) => ({
      quarter: q,
      completion:
        withSheet.length === 0
          ? 0
          : Math.round(
              (withSheet.filter((e) => e.checkInsDone[q]).length / withSheet.length) * 100
            ),
    }));
  }, [filtered]);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/reports/export");
      if (!res.ok) { alert("Export failed"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${cycle?.year ?? "latest"}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  if (!cycle) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">No active goal cycle.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Cycle {cycle.year}</p>
        </div>
        <Button onClick={handleExport} disabled={exporting} variant="outline">
          {exporting ? "Exporting…" : "⬇ Export to Excel"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          value={managerFilter}
          onChange={(e) => setManagerFilter(e.target.value)}
        >
          <option value="">All Managers</option>
          {managers.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        {(deptFilter || managerFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setDeptFilter(""); setManagerFilter(""); }}>
            Clear filters
          </Button>
        )}
        <span className="self-center text-sm text-muted-foreground">
          {filtered.length} of {employees.length} employees
        </span>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Check-in Completion % per Quarter</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="quarter" tick={{ fontSize: 13 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v}%`, "Completion"]} />
              <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Completion Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Completion Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-1">
          <CompletionDashboard employees={filtered} cycle={cycle} />
        </CardContent>
      </Card>

      {/* Achievement Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Achievement Report</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead>UoM</TableHead>
                <TableHead className="text-right">Target</TableHead>
                {QUARTERS.map((q) => (
                  <TableHead key={q} className="text-right">{q} Actual</TableHead>
                ))}
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.flatMap((emp) =>
                emp.goals.map((g) => (
                  <TableRow key={`${emp.id}-${g.id}`}>
                    <TableCell>
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-xs text-muted-foreground">{emp.department ?? ""}</div>
                    </TableCell>
                    <TableCell>
                      <div>{g.title}</div>
                      <div className="text-xs text-muted-foreground">{g.thrustArea}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{g.uom}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{g.target}</TableCell>
                    {QUARTERS.map((q) => (
                      <TableCell key={q} className="text-right text-muted-foreground">
                        {g.actuals[q] ?? "—"}
                      </TableCell>
                    ))}
                    <TableCell className={`text-right ${SCORE_COLOR(g.score)}`}>
                      {g.score !== null ? `${g.score}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {filtered.every((e) => e.goals.length === 0) && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                    No goals found for the current filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
