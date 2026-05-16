import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  SUBMITTED: "default",
  APPROVED: "default",
  LOCKED: "outline",
  RETURNED: "destructive",
};

export default async function ManagerTeamPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  const activeCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true },
  });

  const employees = await prisma.user.findMany({
    where: { managerId: session.user.id },
    include: {
      goalSheets: {
        where: activeCycle ? { cycleId: activeCycle.id } : undefined,
        include: { goals: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Team</h1>
        <p className="text-sm text-muted-foreground">
          {activeCycle
            ? `Goal Cycle ${activeCycle.year}`
            : "No active goal cycle"}
          {" · "}
          {employees.length} direct report{employees.length !== 1 && "s"}
        </p>
      </div>

      {employees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No direct reports found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Direct Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-center"># Goals</TableHead>
                  <TableHead className="text-center">Total Weightage</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => {
                  const sheet = emp.goalSheets[0] ?? null;
                  const goalCount = sheet?.goals.length ?? 0;
                  const totalWeight = sheet
                    ? sheet.goals.reduce(
                        (s: number, g: { weightage: number }) =>
                          s + g.weightage,
                        0
                      )
                    : 0;

                  return (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {emp.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{goalCount}</TableCell>
                      <TableCell className="text-center">
                        {totalWeight}%
                      </TableCell>
                      <TableCell className="text-center">
                        {sheet ? (
                          <Badge
                            variant={
                              STATUS_VARIANT[sheet.status] ?? "secondary"
                            }
                          >
                            {sheet.status}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Not started
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {sheet && sheet.status === "SUBMITTED" ? (
                          <Link
                            href={`/manager/approve/${sheet.id}`}
                          >
                            <Button size="sm">Review</Button>
                          </Link>
                        ) : sheet ? (
                          <Link
                            href={`/manager/approve/${sheet.id}`}
                          >
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
