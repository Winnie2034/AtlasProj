import type { SyncStatus } from "../types/api.js";
import { prisma } from "../db/prisma.js";

export class SyncHistoryRepository {
  createRunning(startedAt: Date) {
    return prisma.syncHistory.create({ data: { startedAt, status: "running" } });
  }

  latestFinished() {
    return prisma.syncHistory.findFirst({
      where: { finishedAt: { not: null } },
      orderBy: { startedAt: "desc" },
    });
  }

  update(
    id: string,
    data: Partial<{
      finishedAt: Date;
      status: SyncStatus;
      workoutsFetched: number;
      workoutsCreated: number;
      workoutsUpdated: number;
      workoutsDeleted: number;
      errorMessage: string;
    }>,
  ) {
    return prisma.syncHistory.update({ where: { id }, data });
  }
}
