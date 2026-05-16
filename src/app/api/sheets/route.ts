import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { cycleId } = body as { cycleId: string };

  if (!cycleId) {
    return NextResponse.json(
      { error: "cycleId is required" },
      { status: 400 }
    );
  }

  const cycle = await prisma.goalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle || !cycle.isActive) {
    return NextResponse.json(
      { error: "Goal cycle not found or inactive" },
      { status: 400 }
    );
  }

  const existing = await prisma.goalSheet.findUnique({
    where: {
      employeeId_cycleId: {
        employeeId: session.user.id,
        cycleId,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Goal sheet already exists for this cycle" },
      { status: 409 }
    );
  }

  const sheet = await prisma.goalSheet.create({
    data: {
      employeeId: session.user.id,
      cycleId,
    },
  });

  return NextResponse.json(sheet, { status: 201 });
}
