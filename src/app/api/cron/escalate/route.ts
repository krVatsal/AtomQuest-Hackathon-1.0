import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendGoalSubmissionReminder,
  sendManagerApprovalReminder,
  sendCheckInReminder,
} from "@/lib/email";
import type { QuarterKey } from "@/lib/quarters";

const QUARTERS: QuarterKey[] = ["Q1", "Q2", "Q3", "Q4"];

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function GET(req: Request) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
  if (!cycle) {
    return NextResponse.json({ skipped: "No active cycle" });
  }

  const now = new Date();
  const summary = { submissionReminders: 0, approvalReminders: 0, checkInReminders: 0 };

  // ── 1. Goal Submission Overdue (7 days after phase1Open) ────────────────
  const submissionDeadline = addDays(cycle.phase1Open, 7);
  if (now >= submissionDeadline) {
    const employees = await prisma.user.findMany({
      where: { role: { in: ["EMPLOYEE", "MANAGER"] } },
      include: {
        goalSheets: { where: { cycleId: cycle.id } },
      },
    });

    for (const emp of employees) {
      const sheet = emp.goalSheets[0];
      if (!sheet || sheet.status === "DRAFT") {
        await sendGoalSubmissionReminder(
          { email: emp.email, name: emp.name },
          submissionDeadline
        );
        summary.submissionReminders++;
      }
    }
  }

  // ── 2. Manager Approval Overdue (5 days after submission) ───────────────
  const approvalDeadline = addDays(now, -5); // sheets submitted more than 5 days ago
  const overdueSheets = await prisma.goalSheet.findMany({
    where: {
      cycleId: cycle.id,
      status: "SUBMITTED",
      submittedAt: { lte: approvalDeadline },
    },
    include: {
      employee: {
        include: { manager: true },
      },
    },
  });

  // Group by manager
  const byManager = new Map<string, { manager: { name: string; email: string }; count: number }>();
  for (const sheet of overdueSheets) {
    const mgr = sheet.employee.manager;
    if (!mgr) continue;
    const existing = byManager.get(mgr.id);
    if (existing) {
      existing.count++;
    } else {
      byManager.set(mgr.id, { manager: { name: mgr.name, email: mgr.email }, count: 1 });
    }
  }

  for (const { manager, count } of Array.from(byManager.values())) {
    await sendManagerApprovalReminder(manager, count);
    summary.approvalReminders++;
  }

  // ── 3. Check-in Window Closing in ≤3 Days ───────────────────────────────
  const cycleDates = {
    Q1: { open: cycle.q1Open, close: cycle.q2Open },
    Q2: { open: cycle.q2Open, close: cycle.q3Open },
    Q3: { open: cycle.q3Open, close: cycle.q4Open },
    Q4: { open: cycle.q4Open, close: new Date(cycle.year + 1, 3, 30) },
  } as Record<QuarterKey, { open: Date; close: Date }>;

  for (const q of QUARTERS) {
    const { open, close } = cycleDates[q];
    const warnFrom = addDays(close, -3);
    if (now < open || now < warnFrom || now >= close) continue;

    // Find LOCKED sheets where no Achievement.actual exists for this quarter
    const sheets = await prisma.goalSheet.findMany({
      where: { cycleId: cycle.id, status: "LOCKED" },
      include: {
        employee: true,
        goals: {
          include: {
            achievements: { where: { quarter: q } },
          },
        },
      },
    });

    for (const sheet of sheets) {
      const hasActual = sheet.goals.some((g) =>
        g.achievements.some((a) => a.actual !== null)
      );
      if (!hasActual) {
        await sendCheckInReminder(
          { email: sheet.employee.email, name: sheet.employee.name },
          q,
          close
        );
        summary.checkInReminders++;
      }
    }
  }

  return NextResponse.json({ ok: true, ...summary });
}
