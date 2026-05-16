import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Quarter } from "@/generated/prisma";

const VALID_QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { goalId, quarter, comment } = body as {
    goalId: string;
    quarter: Quarter;
    comment: string;
  };

  if (!goalId || !quarter || !comment?.trim()) {
    return NextResponse.json(
      { error: "goalId, quarter, and comment are required" },
      { status: 400 }
    );
  }

  if (!VALID_QUARTERS.includes(quarter)) {
    return NextResponse.json({ error: "Invalid quarter" }, { status: 400 });
  }

  // Verify goal exists and belongs to one of this manager's reports
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { sheet: { include: { employee: true } } },
  });

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  if (goal.sheet.employee.managerId !== session.user.id) {
    return NextResponse.json(
      { error: "You are not this employee's manager" },
      { status: 403 }
    );
  }

  if (goal.sheet.status !== "LOCKED") {
    return NextResponse.json(
      { error: "Check-ins only allowed on LOCKED sheets" },
      { status: 400 }
    );
  }

  const checkIn = await prisma.checkIn.create({
    data: {
      managerId: session.user.id,
      goalId,
      quarter,
      comment: comment.trim(),
    },
  });

  return NextResponse.json(checkIn, { status: 201 });
}
