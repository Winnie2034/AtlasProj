import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

await prisma.applicationSetting.upsert({
  where: { key: "hevy_api_key_configured" },
  update: {},
  create: { key: "hevy_api_key_configured", value: false },
});

await prisma.$disconnect();
