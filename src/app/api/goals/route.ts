import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { goalSchema } from "@/lib/validations/goal";
import type { UoM } from "@/generated/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { thrustArea, title, description, uom, target, weightage } = parsed.data;

  // Find the employee's active sheet
  const activeCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true },
  });
  if (!activeCycle) {
    return NextResponse.json(
      { error: "No active goal cycle" },
      { status: 400 }
    );
  }

  const sheet = await prisma.goalSheet.findUnique({
    where: {
      employeeId_cycleId: {
        employeeId: session.user.id,
        cycleId: activeCycle.id,
      },
    },
    include: { goals: true },
  });

  if (!sheet) {
    return NextResponse.json(
      { error: "No goal sheet found. Start goal setting first." },
      { status: 400 }
    );
  }

  if (sheet.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Goal sheet is not in DRAFT status" },
      { status: 403 }
    );
  }

  // Max 8 goals
  if (sheet.goals.length >= 8) {
    return NextResponse.json(
      { error: "Maximum 8 goals allowed per sheet" },
      { status: 400 }
    );
  }

  // Total weightage check
  const currentTotal = sheet.goals.reduce(
    (sum: number, g: { weightage: number }) => sum + g.weightage,
    0
  );
  if (currentTotal + weightage > 100) {
    return NextResponse.json(
      {
        error: `Total weightage would be ${currentTotal + weightage}%. Maximum is 100%.`,
      },
      { status: 400 }
    );
  }

  const goal = await prisma.goal.create({
    data: {
      sheetId: sheet.id,
      thrustArea,
      title,
      description: description ?? null,
      uom: uom as UoM,
      target,
      weightage,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
