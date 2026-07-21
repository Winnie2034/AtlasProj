import { HevyClient } from "./hevy/hevy.client.js";
import { normalizeWorkout } from "./hevy/normalize.js";
import { prisma } from "../db/prisma.js";
import { WorkoutRepository } from "../repositories/workout.repository.js";
import { HevyApiError } from "../utils/AppError.js";
import { ExerciseTemplateMetadataService } from "./exerciseTemplateMetadata.service.js";
import { HevyConnectionService } from "./hevyConnection.service.js";

type SyncError = { hevyWorkoutId: string; message: string };

type SyncSummary = {
  syncId: string;
  status: "success" | "partial_failure" | "failed";
  startedAt: string;
  finishedAt: string;
  workoutsFetched: number;
  workoutsCreated: number;
  workoutsUpdated: number;
  workoutsDeleted: number;
  errors: SyncError[];
};

type SyncContext = {
  userId: string;
  hevy: HevyClient;
  templateMetadata: ExerciseTemplateMetadataService;
};

export class SyncService {
  constructor(
    private workouts = new WorkoutRepository(),
    private connections = new HevyConnectionService(),
  ) {}

  async runSync(userId: string) {
    const startedAt = new Date();
    const { client: hevy, connection } = await this.connections.clientForUser(userId);
    await this.connections.beginSync(userId);
    const context: SyncContext = {
      userId,
      hevy,
      templateMetadata: new ExerciseTemplateMetadataService(userId, hevy),
    };
    const sync = await prisma.syncHistory.create({ data: { userId, startedAt, status: "running" } }).catch(async (error) => {
      await this.connections.finishSync(userId, startedAt.toISOString(), false);
      throw error;
    });
    const summary: SyncSummary = {
      syncId: sync.id,
      status: "success" as "success" | "partial_failure" | "failed",
      startedAt: startedAt.toISOString(),
      finishedAt: "",
      workoutsFetched: 0,
      workoutsCreated: 0,
      workoutsUpdated: 0,
      workoutsDeleted: 0,
      errors: [] as SyncError[],
    };

    try {
      console.info({ syncId: sync.id }, "sync started");
      const cursor = connection.lastSuccessfulSyncCursor;
      if (cursor) {
        await this.runIncremental(context, cursor, summary);
      } else {
        await this.runFull(context, summary);
      }

      summary.status = summary.errors.length > 0 ? "partial_failure" : "success";
      const finishedAt = new Date();
      summary.finishedAt = finishedAt.toISOString();
      await prisma.syncHistory.updateMany({
        where: { id: sync.id, userId },
        data: {
          finishedAt,
          status: summary.status,
          workoutsFetched: summary.workoutsFetched,
          workoutsCreated: summary.workoutsCreated,
          workoutsUpdated: summary.workoutsUpdated,
          workoutsDeleted: summary.workoutsDeleted,
          errorMessage: summary.errors.length ? JSON.stringify(summary.errors) : undefined,
        },
      });
      // Store the sync start time to create a safe overlap window for the next incremental sync.
      await this.connections.finishSync(userId, startedAt.toISOString(), true);
      console.info({ syncId: sync.id, status: summary.status }, "sync finished");
      return summary;
    } catch (error) {
      const finishedAt = new Date();
      summary.status = "failed";
      summary.finishedAt = finishedAt.toISOString();
      await prisma.syncHistory.updateMany({
        where: { id: sync.id, userId },
        data: {
          finishedAt,
          status: "failed",
          workoutsFetched: summary.workoutsFetched,
          workoutsCreated: summary.workoutsCreated,
          workoutsUpdated: summary.workoutsUpdated,
          workoutsDeleted: summary.workoutsDeleted,
          errorMessage: error instanceof Error ? error.message : "Unknown sync failure",
        },
      });
      console.error({ syncId: sync.id, err: error }, "sync failed");
      await this.connections.finishSync(userId, startedAt.toISOString(), false);
      if (error instanceof HevyApiError) {
        throw error;
      }
      throw new HevyApiError("Sync failed before Atlas could fetch usable Hevy data", "SYNC_FAILED", 500);
    }
  }

  private async runFull(context: SyncContext, summary: SyncSummary) {
    const pageSize = 10;
    const count = await context.hevy.getWorkoutCount();
    const totalPages = Math.ceil(count.count / pageSize);

    for (let page = 1; page <= totalPages; page += 1) {
      const payload = await context.hevy.getWorkoutsPage(page, pageSize);
      console.info({ page, pageSize, count: payload.workouts.length }, "fetched Hevy workout page");
      for (const workout of payload.workouts) {
        await this.saveWorkout(context, workout.id, async () => workout, summary);
      }
    }
  }

  private async runIncremental(context: SyncContext, cursor: string, summary: SyncSummary) {
    const pageSize = 10;
    for (let page = 1; ; page += 1) {
      const payload = await context.hevy.getWorkoutEventsSince(cursor, page, pageSize);
      if (payload.events.length === 0) {
        break;
      }

      for (const event of payload.events) {
        const workoutId = event.workout_id;
        if (!workoutId) {
          summary.errors.push({ hevyWorkoutId: "unknown", message: "Hevy event did not include a workout id" });
          continue;
        }

        if (event.type === "deleted") {
          const deleted = await this.workouts.deleteByHevyId(context.userId, workoutId);
          summary.workoutsDeleted += deleted.count;
        } else {
          await this.saveWorkout(context, workoutId, () => context.hevy.getWorkoutById(workoutId), summary);
        }
      }

      if (payload.events.length < pageSize) {
        break;
      }
    }
  }

  private async saveWorkout(
    context: SyncContext,
    hevyWorkoutId: string,
    loadWorkout: () => Promise<Parameters<typeof normalizeWorkout>[0]>,
    summary: SyncSummary,
  ) {
    try {
      const workout = await loadWorkout();
      summary.workoutsFetched += 1;
      const normalized = normalizeWorkout(workout);
      await context.templateMetadata.ensureMetadataForTemplateIds(
        normalized.exercises.map((exercise) => exercise.hevyExerciseTemplateId),
      );
      const result = await this.workouts.upsertNormalized(context.userId, normalized);
      if (result.action === "created") summary.workoutsCreated += 1;
      if (result.action === "updated") summary.workoutsUpdated += 1;
      console.info({ hevyWorkoutId, action: result.action }, "workout sync complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown workout sync error";
      summary.errors.push({ hevyWorkoutId, message });
      console.error({ hevyWorkoutId, err: error }, "workout sync failed");
    }
  }
}
