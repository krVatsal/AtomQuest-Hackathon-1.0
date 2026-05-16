import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const cycles = await prisma.goalCycle.findMany({ orderBy: { year: "desc" } });
  return NextResponse.json(cycles);
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { year, phase1Open, q1Open, q2Open, q3Open, q4Open } = body;

  if (!year || !phase1Open || !q1Open || !q2Open || !q3Open || !q4Open) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const cycle = await prisma.goalCycle.create({
    data: {
      year: Number(year),
      phase1Open: new Date(phase1Open),
      q1Open: new Date(q1Open),
      q2Open: new Date(q2Open),
      q3Open: new Date(q3Open),
      q4Open: new Date(q4Open),
      isActive: false,
    },
  });

  return NextResponse.json(cycle, { status: 201 });
}
