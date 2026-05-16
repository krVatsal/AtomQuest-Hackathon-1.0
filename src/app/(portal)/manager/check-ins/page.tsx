import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getActiveQuarter } from "@/lib/quarters";
import { ManagerCheckInsView } from "./manager-view";

export default async function ManagerCheckInsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  const activeCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true },
  });

  if (!activeCycle) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Team Check-Ins</h1>
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
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Team Check-Ins</h1>
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No quarter is currently open. Check-ins will be available when a quarter opens.
        </div>
      </div>
    );
  }

  // Fetch all team members with LOCKED sheets
  const employees = await prisma.user.findMany({
    where: { managerId: session.user.id },
    include: {
      goalSheets: {
        where: { cycleId: activeCycle.id, status: "LOCKED" },
        include: {
          goals: {
            orderBy: { weightage: "desc" },
            include: {
              achievements: { where: { quarter: activeQ.quarter } },
              checkIns: { where: { quarter: activeQ.quarter, managerId: session.user.id } },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamData = employees
    .filter((emp) => emp.goalSheets.length > 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((emp: any) => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      goals: emp.goalSheets[0].goals.map((g: any) => ({
        id: g.id,
        title: g.title,
        uom: g.uom,
        target: g.target,
        weightage: g.weightage,
        actual: g.achievements[0]?.actual ?? null,
        status: g.achievements[0]?.status ?? "NOT_STARTED",
        lastCheckIn: g.checkIns[0]?.comment ?? null,
      })),
    }));

  return (
    <ManagerCheckInsView
      quarter={activeQ.quarter}
      cycleYear={activeCycle.year}
      team={teamData}
    />
  );
}
