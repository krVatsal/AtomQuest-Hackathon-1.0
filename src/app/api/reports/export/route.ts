import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeScore } from "@/lib/scoring";
import type { UoMType } from "@/lib/scoring";
import * as XLSX from "xlsx";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;
type Q = (typeof QUARTERS)[number];

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
  if (!cycle) {
    return NextResponse.json({ error: "No active goal cycle" }, { status: 400 });
  }

  const employees = await prisma.user.findMany({
    where: { role: { in: ["EMPLOYEE", "MANAGER"] } },
    include: {
      manager: { select: { name: true } },
      goalSheets: {
        where: { cycleId: cycle.id },
        include: {
          goals: { include: { achievements: true, checkIns: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // ── Sheet 1: Achievement Summary ─────────────────────────────────────────
  const achievementRows: Record<string, string | number | null>[] = [];

  for (const emp of employees) {
    const sheet = emp.goalSheets[0];
    if (!sheet) continue;
    for (const g of sheet.goals) {
      const actuals = Object.fromEntries(
        QUARTERS.map((q) => {
          const ach = g.achievements.find((a) => a.quarter === q);
          return [q, ach?.actual ?? null];
        })
      ) as Record<Q, number | null>;

      const quarterScores = QUARTERS.map((q) =>
        computeScore(g.uom as UoMType, g.target, actuals[q])
      ).filter((s): s is number => s !== null);
      const score =
        quarterScores.length > 0
          ? Math.round(quarterScores.reduce((a, b) => a + b, 0) / quarterScores.length)
          : null;

      achievementRows.push({
        Employee: emp.name,
        Email: emp.email,
        Department: emp.department ?? "",
        Manager: emp.manager?.name ?? "",
        "Thrust Area": g.thrustArea,
        "Goal Title": g.title,
        UoM: g.uom,
        "Weightage (%)": g.weightage,
        Target: g.target,
        "Q1 Actual": actuals.Q1,
        "Q2 Actual": actuals.Q2,
        "Q3 Actual": actuals.Q3,
        "Q4 Actual": actuals.Q4,
        "Score (%)": score,
      });
    }
  }

  // ── Sheet 2: Completion Status ────────────────────────────────────────────
  const completionRows: Record<string, string | boolean>[] = employees.map((emp) => {
    const sheet = emp.goalSheets[0];
    const goals = sheet?.goals ?? [];
    return {
      Employee: emp.name,
      Email: emp.email,
      Department: emp.department ?? "",
      Manager: emp.manager?.name ?? "",
      "Sheet Status": sheet?.status ?? "Not Started",
      ...Object.fromEntries(
        QUARTERS.map((q) => [
          `${q} Check-in`,
          goals.some((g) => g.checkIns.some((c) => c.quarter === q)) ? "Yes" : "No",
        ])
      ),
    };
  });

  // ── Build workbook ────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(achievementRows);
  XLSX.utils.book_append_sheet(wb, ws1, "Achievement Summary");

  const ws2 = XLSX.utils.json_to_sheet(completionRows);
  XLSX.utils.book_append_sheet(wb, ws2, "Completion Status");

  const buffer: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="report-${cycle.year}.xlsx"`,
    },
  });
}
