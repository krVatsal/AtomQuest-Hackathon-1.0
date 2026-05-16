import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: { goalId: string } }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { goalId } = params;

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { sheet: true },
  });

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.goalSheet.update({
      where: { id: goal.sheetId },
      data: { status: "DRAFT" },
    }),
    prisma.auditLog.create({
      data: {
        entity: "GoalSheet",
        entityId: goal.sheetId,
        action: "ADMIN_UNLOCK",
        field: "status",
        oldValue: goal.sheet.status,
        newValue: "DRAFT",
        userId: session.user.id,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
