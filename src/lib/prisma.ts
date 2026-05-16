import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildPrismaClient() {
  const rawUrl = process.env.DATABASE_URL!;
  const url = new URL(rawUrl);
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", "3");
  }
  if (!url.searchParams.has("pool_timeout")) {
    url.searchParams.set("pool_timeout", "20");
  }
  return new PrismaClient({ datasourceUrl: url.toString() });
}

export const prisma = globalForPrisma.prisma ?? buildPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
