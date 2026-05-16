import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UoM } from "@/generated/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { thrustArea, title, description, uom, target, recipientIds } = body;

  if (!thrustArea || !title || !uom || target === undefined || !recipientIds?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const activeCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true },
  });
  if (!activeCycle) {
    return NextResponse.json({ error: "No active goal cycle" }, { status: 400 });
  }

  // Find or create admin's sheet (to attach the master goal)
  const adminSheet = await prisma.goalSheet.upsert({
    where: {
      employeeId_cycleId: {
        employeeId: session.user.id,
        cycleId: activeCycle.id,
      },
    },
    create: {
      employeeId: session.user.id,
      cycleId: activeCycle.id,
      status: "DRAFT",
    },
    update: {},
  });

  // Create the master goal in the admin's sheet
  const masterGoal = await prisma.goal.create({
    data: {
      sheetId: adminSheet.id,
      thrustArea,
      title,
      description: description ?? null,
      uom: uom as UoM,
      target: Number(target),
      weightage: 10,
      isShared: true,
      primaryOwner: session.user.id,
    },
  });

  // For each recipient, find or create their sheet, then create a shared copy
  const created: string[] = [];
  for (const recipientId of recipientIds as string[]) {
    const sheet = await prisma.goalSheet.upsert({
      where: {
        employeeId_cycleId: {
          employeeId: recipientId,
          cycleId: activeCycle.id,
        },
      },
      create: {
        employeeId: recipientId,
        cycleId: activeCycle.id,
        status: "DRAFT",
      },
      update: {},
    });

    if (sheet.status !== "DRAFT") continue;

    const copy = await prisma.goal.create({
      data: {
        sheetId: sheet.id,
        thrustArea,
        title,
        description: description ?? null,
        uom: uom as UoM,
        target: Number(target),
        weightage: 10,
        isShared: true,
        primaryOwner: session.user.id,
        sourceGoalId: masterGoal.id,
      },
    });
    created.push(copy.id);
  }

  return NextResponse.json(
    { masterGoalId: masterGoal.id, copiesCreated: created.length },
    { status: 201 }
  );
}
