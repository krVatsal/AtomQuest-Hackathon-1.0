import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendGoalReturned } from "@/lib/email";

export async function POST(
  req: Request,
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

  const body = await req.json();
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!reason) {
    return NextResponse.json(
      { error: "A reason is required when returning a sheet" },
      { status: 400 }
    );
  }

  const sheet = await prisma.goalSheet.findUnique({
    where: { id },
    include: { employee: true },
  });

  if (!sheet) {
    return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
  }

  if (sheet.employee.managerId !== session.user.id) {
    return NextResponse.json(
      { error: "You are not this employee's manager" },
      { status: 403 }
    );
  }

  if (sheet.status !== "SUBMITTED") {
    return NextResponse.json(
      { error: "Only SUBMITTED sheets can be returned" },
      { status: 400 }
    );
  }

  const updated = await prisma.goalSheet.update({
    where: { id },
    data: {
      status: "RETURNED",
      returnReason: reason,
    },
  });

  // Send email notification (fire-and-forget)
  sendGoalReturned(
    { email: sheet.employee.email, name: sheet.employee.name },
    reason
  );

  return NextResponse.json(updated);
}
