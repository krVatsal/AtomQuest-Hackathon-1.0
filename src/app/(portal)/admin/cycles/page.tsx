import { prisma } from "@/lib/prisma";
import { CyclesClient } from "./cycles-client";

export default async function AdminCyclesPage() {
  const cycles = await prisma.goalCycle.findMany({ orderBy: { year: "desc" } });

  return (
    <CyclesClient
      initialCycles={cycles.map((c) => ({
        id: c.id,
        year: c.year,
        isActive: c.isActive,
        phase1Open: c.phase1Open.toISOString(),
        q1Open: c.q1Open.toISOString(),
        q2Open: c.q2Open.toISOString(),
        q3Open: c.q3Open.toISOString(),
        q4Open: c.q4Open.toISOString(),
      }))}
    />
  );
}
