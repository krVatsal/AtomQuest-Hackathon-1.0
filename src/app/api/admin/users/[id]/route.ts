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
  const { role, managerId } = body;

  const validRoles = ["EMPLOYEE", "MANAGER", "ADMIN"];
  if (role !== undefined && !validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(role !== undefined && { role }),
      ...(managerId !== undefined && {
        managerId: managerId === null ? null : managerId,
      }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      managerId: true,
      manager: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(user);
}
