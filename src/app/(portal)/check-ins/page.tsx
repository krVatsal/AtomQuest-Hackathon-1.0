import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getActiveQuarter, nextCheckInMonth } from "@/lib/quarters";
import { EmployeeCheckInsView } from "./employee-view";

export default async function CheckInsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true },
  });

  if (!activeCycle) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Check-Ins</h1>
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No active goal cycle.
        </div>
      </div>
    );
  }

  const activeQ = getActiveQuarter({
    phase1Open: activeCycle.phase1Open,
    q1Open: activeCycle.q1Open,
    q2Open: activeCycle.q2Open,
    q3Open: activeCycle.q3Open,
    q4Open: activeCycle.q4Open,
    year: activeCycle.year,
  });

  if (!activeQ) {
    const nextMonth = nextCheckInMonth({
      phase1Open: activeCycle.phase1Open,
      q1Open: activeCycle.q1Open,
      q2Open: activeCycle.q2Open,
      q3Open: activeCycle.q3Open,
      q4Open: activeCycle.q4Open,
      year: activeCycle.year,
    });
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Check-Ins</h1>
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          Goal setting phase — check-ins open in {nextMonth}.
        </div>
      </div>
    );
  }

  const sheet = await prisma.goalSheet.findUnique({
    where: {
      employeeId_cycleId: {
        employeeId: session.user.id,
        cycleId: activeCycle.id,
      },
    },
    include: {
      goals: {
        orderBy: { weightage: "desc" },
        include: {
          achievements: { where: { quarter: activeQ.quarter } },
        },
      },
    },
  });

  if (!sheet || sheet.status !== "LOCKED") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Check-Ins</h1>
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          Your goal sheet must be approved and locked before you can log achievements.
        </div>
      </div>
    );
  }

  return (
    <EmployeeCheckInsView
      quarter={activeQ.quarter}
      cycleYear={activeCycle.year}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      goals={sheet.goals.map((g: any) => ({
        id: g.id,
        title: g.title,
        uom: g.uom,
        target: g.target,
        weightage: g.weightage,
        achievement: g.achievements[0]
          ? { actual: g.achievements[0].actual, status: g.achievements[0].status }
          : null,
      }))}
    />
  );
}
