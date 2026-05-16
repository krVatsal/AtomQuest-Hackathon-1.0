import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UnlockClient } from "./unlock-client";

export default async function AdminUnlockPage({
  params,
}: {
  params: { goalId: string };
}) {
  const goal = await prisma.goal.findUnique({
    where: { id: params.goalId },
    include: {
      sheet: {
        include: {
          employee: { select: { id: true, name: true, email: true } },
          cycle: { select: { year: true } },
        },
      },
    },
  });

  if (!goal) notFound();

  return (
    <UnlockClient
      goal={{
        id: goal.id,
        title: goal.title,
        thrustArea: goal.thrustArea,
        sheetId: goal.sheetId,
        sheetStatus: goal.sheet.status,
        cycleYear: goal.sheet.cycle.year,
        employee: goal.sheet.employee,
      }}
    />
  );
}
