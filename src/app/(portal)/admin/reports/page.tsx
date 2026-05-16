import { prisma } from "@/lib/prisma";
import { computeScore } from "@/lib/scoring";
import type { UoMType } from "@/lib/scoring";
import { ReportsClient } from "./reports-client";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;
type Q = (typeof QUARTERS)[number];

export default async function AdminReportsPage() {
  const cycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });

  const employees = await prisma.user.findMany({
    where: { role: { in: ["EMPLOYEE", "MANAGER"] } },
    include: {
      manager: { select: { name: true } },
      goalSheets: {
        where: cycle ? { cycleId: cycle.id } : { cycleId: "__never__" },
        include: {
          goals: {
            include: { achievements: true, checkIns: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const employeeReports = employees.map((emp) => {
    const sheet = emp.goalSheets[0] ?? null;
    const goals = sheet?.goals ?? [];

    const checkInsDone = Object.fromEntries(
      QUARTERS.map((q) => [
        q,
        goals.some((g) => g.checkIns.some((c) => c.quarter === q)),
      ])
    ) as Record<Q, boolean>;

    const goalReports = goals.map((g) => {
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

      return {
        id: g.id,
        title: g.title,
        thrustArea: g.thrustArea,
        uom: g.uom,
        target: g.target,
        weightage: g.weightage,
        actuals,
        score,
      };
    });

    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      department: emp.department,
      managerName: emp.manager?.name ?? null,
      sheetStatus: sheet?.status ?? null,
      checkInsDone,
      goals: goalReports,
    };
  });

  const cycleInfo = cycle
    ? {
        year: cycle.year,
        q1Open: cycle.q1Open.toISOString(),
        q2Open: cycle.q2Open.toISOString(),
        q3Open: cycle.q3Open.toISOString(),
        q4Open: cycle.q4Open.toISOString(),
      }
    : null;

  return <ReportsClient employees={employeeReports} cycle={cycleInfo} />;
}
