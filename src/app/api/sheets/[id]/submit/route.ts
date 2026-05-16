import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTeamsCard } from "@/lib/teams";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const sheet = await prisma.goalSheet.findUnique({
    where: { id },
    include: { goals: true, employee: { include: { manager: true } } },
  });

  if (!sheet) {
    return NextResponse.json(
      { error: "Goal sheet not found" },
      { status: 404 }
    );
  }

  if (sheet.employeeId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (sheet.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only DRAFT sheets can be submitted" },
      { status: 400 }
    );
  }

  if (sheet.goals.length === 0) {
    return NextResponse.json(
      { error: "Add at least one goal before submitting" },
      { status: 400 }
    );
  }

  const totalWeightage = sheet.goals.reduce(
    (sum: number, g: { weightage: number }) => sum + g.weightage,
    0
  );

  if (totalWeightage !== 100) {
    return NextResponse.json(
      { error: `Total weightage must be exactly 100%. Current: ${totalWeightage}%` },
      { status: 400 }
    );
  }

  const updated = await prisma.goalSheet.update({
    where: { id },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  // Notify manager via Teams (fire-and-forget)
  const employee = sheet.employee as { name: string; manager: { email: string } | null } | undefined;
  if (employee?.manager) {
    const appUrl = process.env.NEXTAUTH_URL ?? "";
    sendTeamsCard({
      title: "New Goal Sheet Submitted",
      body: `${employee.name} has submitted their goal sheet for your review.`,
      deepLink: `${appUrl}/manager/approve/${id}`,
      deepLinkLabel: "Review Sheet",
    }).catch(() => {});
  }

  return NextResponse.json(updated);
}
