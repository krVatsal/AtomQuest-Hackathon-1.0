import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const body = await req.json();

  if (body.setActive === true) {
    // Deactivate all cycles, then activate the requested one
    await prisma.goalCycle.updateMany({ data: { isActive: false } });
    const cycle = await prisma.goalCycle.update({
      where: { id },
      data: { isActive: true },
    });
    return NextResponse.json(cycle);
  }

  if (body.setActive === false) {
    const cycle = await prisma.goalCycle.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json(cycle);
  }

  // General field update
  const { year, phase1Open, q1Open, q2Open, q3Open, q4Open } = body;
  const cycle = await prisma.goalCycle.update({
    where: { id },
    data: {
      ...(year !== undefined && { year: Number(year) }),
      ...(phase1Open !== undefined && { phase1Open: new Date(phase1Open) }),
      ...(q1Open !== undefined && { q1Open: new Date(q1Open) }),
      ...(q2Open !== undefined && { q2Open: new Date(q2Open) }),
      ...(q3Open !== undefined && { q3Open: new Date(q3Open) }),
      ...(q4Open !== undefined && { q4Open: new Date(q4Open) }),
    },
  });

  return NextResponse.json(cycle);
}
