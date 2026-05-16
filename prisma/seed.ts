import { PrismaClient, Role } from "../src/generated/prisma";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await hash("password123", 12);

  // Create manager first (no manager above them)
  const manager = await prisma.user.upsert({
    where: { email: "manager@demo.com" },
    update: {},
    create: {
      email: "manager@demo.com",
      name: "Demo Manager",
      password,
      role: Role.MANAGER,
    },
  });

  // Create employee reporting to manager
  await prisma.user.upsert({
    where: { email: "employee@demo.com" },
    update: {},
    create: {
      email: "employee@demo.com",
      name: "Demo Employee",
      password,
      role: Role.EMPLOYEE,
      managerId: manager.id,
    },
  });

  // Create admin
  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      name: "Demo Admin",
      password,
      role: Role.ADMIN,
    },
  });

  console.log("✅ Seed data created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
