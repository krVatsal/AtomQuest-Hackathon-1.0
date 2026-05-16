import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveQuarter } from "@/lib/quarters";
import type { Quarter, AchieveStatus } from "@/generated/prisma";

const VALID_STATUSES: AchieveStatus[] = ["NOT_STARTED", "ON_TRACK", "COMPLETED"];
const VALID_QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { goalId, quarter, actual, status } = body as {
    goalId: string;
    quarter: Quarter;
    actual: number | null;
    status: AchieveStatus;
  };

  if (!goalId || !quarter) {
    return NextResponse.json({ error: "goalId and quarter are required" }, { status: 400 });
  }

  if (!VALID_QUARTERS.includes(quarter)) {
    return NextResponse.json({ error: "Invalid quarter" }, { status: 400 });
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Verify goal belongs to this employee and sheet is LOCKED
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { sheet: { include: { cycle: true } } },
  });

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  if (goal.sheet.employeeId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (goal.sheet.status !== "LOCKED") {
    return NextResponse.json(
      { error: "Achievements can only be updated on LOCKED sheets" },
      { status: 400 }
    );
  }

  // Verify quarter is currently open
  const cycle = goal.sheet.cycle;
  const activeQ = getActiveQuarter({
    phase1Open: cycle.phase1Open,
    q1Open: cycle.q1Open,
    q2Open: cycle.q2Open,
    q3Open: cycle.q3Open,
    q4Open: cycle.q4Open,
    year: cycle.year,
  });

  if (!activeQ || activeQ.quarter !== quarter) {
    return NextResponse.json(
      { error: `Quarter ${quarter} is not currently open` },
      { status: 400 }
    );
  }

  // Upsert achievement
  const achievement = await prisma.achievement.upsert({
    where: { goalId_quarter: { goalId, quarter } },
    update: {
      actual: actual ?? null,
      status: status ?? "NOT_STARTED",
    },
    create: {
      goalId,
      quarter,
      actual: actual ?? null,
      status: status ?? "NOT_STARTED",
    },
  });

  // Sync to shared copies if this is a primary goal (not itself a copy)
  if (!goal.isShared && !goal.sourceGoalId) {
    const copies = await prisma.goal.findMany({
      where: { sourceGoalId: goal.id },
    });

    for (const copy of copies) {
      await prisma.achievement.upsert({
        where: { goalId_quarter: { goalId: copy.id, quarter } },
        update: {
          actual: actual ?? null,
          status: status ?? "NOT_STARTED",
        },
        create: {
          goalId: copy.id,
          quarter,
          actual: actual ?? null,
          status: status ?? "NOT_STARTED",
        },
      });
    }
  }

  return NextResponse.json(achievement);
}
