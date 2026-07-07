import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";

export class SettingsRepository {
  async getString(key: string) {
    const row = await prisma.applicationSetting.findUnique({ where: { key } });
    return typeof row?.value === "string" ? row.value : null;
  }

  setJson(key: string, value: Prisma.InputJsonValue) {
    return prisma.applicationSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}
