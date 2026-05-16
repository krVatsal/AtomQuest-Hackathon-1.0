import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { goalSchema } from "@/lib/validations/goal";
import type { UoM } from "@/generated/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const goal = await prisma.goal.findUnique({
    where: { id },
    include: { sheet: { include: { goals: true } } },
  });

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  if (goal.sheet.employeeId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (goal.sheet.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Cannot edit goals on a non-DRAFT sheet" },
      { status: 403 }
    );
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

  // Total weightage check (exclude current goal from sum)
  const othersTotal = goal.sheet.goals
    .filter((g: { id: string }) => g.id !== id)
    .reduce(
      (sum: number, g: { weightage: number }) => sum + g.weightage,
      0
    );

  if (othersTotal + weightage > 100) {
    return NextResponse.json(
      {
        error: `Total weightage would be ${othersTotal + weightage}%. Maximum is 100%.`,
      },
      { status: 400 }
    );
  }

  const updated = await prisma.goal.update({
    where: { id },
    data: {
      thrustArea,
      title,
      description: description ?? null,
      uom: uom as UoM,
      target,
      weightage,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const goal = await prisma.goal.findUnique({
    where: { id },
    include: { sheet: true },
  });

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  if (goal.sheet.employeeId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (goal.sheet.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Cannot delete goals on a non-DRAFT sheet" },
      { status: 403 }
    );
  }

  await prisma.goal.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
