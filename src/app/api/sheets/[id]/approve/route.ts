import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendGoalApproved } from "@/lib/email";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  const sheet = await prisma.goalSheet.findUnique({
    where: { id },
    include: { goals: true, employee: true },
  });

  if (!sheet) {
    return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
  }

  // Only the employee's manager can approve
  if (sheet.employee.managerId !== session.user.id) {
    return NextResponse.json(
      { error: "You are not this employee's manager" },
      { status: 403 }
    );
  }

  if (sheet.status !== "SUBMITTED") {
    return NextResponse.json(
      { error: "Only SUBMITTED sheets can be approved" },
      { status: 400 }
    );
  }

  // Re-validate weightage rules
  if (sheet.goals.length === 0) {
    return NextResponse.json(
      { error: "Sheet has no goals" },
      { status: 400 }
    );
  }

  const totalWeightage = sheet.goals.reduce(
    (sum: number, g: { weightage: number }) => sum + g.weightage,
    0
  );

  if (totalWeightage !== 100) {
    return NextResponse.json(
      { error: `Total weightage must be 100%. Current: ${totalWeightage}%` },
      { status: 400 }
    );
  }

  for (const g of sheet.goals) {
    if (g.weightage < 10) {
      return NextResponse.json(
        { error: `Goal "${g.title}" has weightage below 10%` },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.goalSheet.update({
    where: { id },
    data: {
      status: "LOCKED",
      approvedAt: new Date(),
    },
  });

  // Send email notification (fire-and-forget)
  sendGoalApproved({ email: sheet.employee.email, name: sheet.employee.name });

  return NextResponse.json(updated);
}
