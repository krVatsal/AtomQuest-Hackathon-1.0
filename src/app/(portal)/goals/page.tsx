import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { GoalSheetView } from "./goal-sheet-view";

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true },
  });

  if (!activeCycle) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">My Goals</h1>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No active goal cycle. Contact your admin to open a cycle.
          </p>
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
      },
    },
  });

  return (
    <GoalSheetView
      cycleId={activeCycle.id}
      cycleYear={activeCycle.year}
      sheet={
        sheet
          ? {
              id: sheet.id,
              status: sheet.status,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              goals: sheet.goals.map((g: any) => ({
                id: g.id,
                thrustArea: g.thrustArea,
                title: g.title,
                description: g.description,
                uom: g.uom,
                target: g.target,
                weightage: g.weightage,
                isShared: g.isShared,
              })),
            }
          : null
      }
    />
  );
}
