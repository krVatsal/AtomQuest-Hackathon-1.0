import { prisma } from "@/lib/prisma";
import { PushGoalClient } from "./push-goal-client";

export default async function AdminPushGoalPage() {
  const employees = await prisma.user.findMany({
    where: { role: { in: ["EMPLOYEE", "MANAGER"] } },
    select: { id: true, name: true, email: true, department: true },
    orderBy: { name: "asc" },
  });

  return <PushGoalClient employees={employees} />;
}
