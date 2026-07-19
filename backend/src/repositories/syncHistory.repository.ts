import { prisma } from "../db/prisma.js";

type SyncStatus = "running" | "success" | "partial_failure" | "failed";

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
