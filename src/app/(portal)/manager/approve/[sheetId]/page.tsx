import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ApproveView } from "./approve-view";

export default async function ApproveSheetPage({
  params,
}: {
  params: { sheetId: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: params.sheetId },
    include: {
      employee: { select: { id: true, name: true, email: true, managerId: true } },
      goals: { orderBy: { weightage: "desc" } },
    },
  });

  if (!sheet) notFound();

  if (sheet.employee.managerId !== session.user.id) {
    redirect("/manager/team");
  }

  return (
    <ApproveView
      sheet={{
        id: sheet.id,
        status: sheet.status,
        returnReason: sheet.returnReason,
        employee: {
          name: sheet.employee.name,
          email: sheet.employee.email,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        goals: sheet.goals.map((g: any) => ({
          id: g.id,
          thrustArea: g.thrustArea,
          title: g.title,
          description: g.description,
          uom: g.uom,
          target: g.target,
          weightage: g.weightage,
          isShared: g.isShared,
        })),
      }}
    />
  );
}
