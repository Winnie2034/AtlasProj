import { HevyClient } from "./hevy/hevy.client.js";
import { normalizeWorkout } from "./hevy/normalize.js";
import { SettingsRepository } from "../repositories/settings.repository.js";
import { SyncHistoryRepository } from "../repositories/syncHistory.repository.js";
import { WorkoutRepository } from "../repositories/workout.repository.js";
import { HevyApiError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";
import { ExerciseTemplateMetadataService } from "./exerciseTemplateMetadata.service.js";

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

export class SyncService {
  constructor(
    private hevy = new HevyClient(),
    private workouts = new WorkoutRepository(),
    private syncHistory = new SyncHistoryRepository(),
    private settings = new SettingsRepository(),
    private templateMetadata = new ExerciseTemplateMetadataService(hevy),
  ) {}

  async runSync() {
    const startedAt = new Date();
    const sync = await this.syncHistory.createRunning(startedAt);
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
      logger.info({ syncId: sync.id }, "sync started");
      const cursor = await this.settings.getString("last_successful_sync_cursor");
      if (cursor) {
        await this.runIncremental(cursor, summary);
      } else {
        await this.runFull(summary);
      }

      summary.status = summary.errors.length > 0 ? "partial_failure" : "success";
      const finishedAt = new Date();
      summary.finishedAt = finishedAt.toISOString();
      await this.syncHistory.update(sync.id, {
        finishedAt,
        status: summary.status,
        workoutsFetched: summary.workoutsFetched,
        workoutsCreated: summary.workoutsCreated,
        workoutsUpdated: summary.workoutsUpdated,
        workoutsDeleted: summary.workoutsDeleted,
        errorMessage: summary.errors.length ? JSON.stringify(summary.errors) : undefined,
      });
      await this.settings.setJson("last_successful_sync_cursor", startedAt.toISOString());
      logger.info({ syncId: sync.id, status: summary.status }, "sync finished");
      return summary;
    } catch (error) {
      const finishedAt = new Date();
      summary.status = "failed";
      summary.finishedAt = finishedAt.toISOString();
      await this.syncHistory.update(sync.id, {
        finishedAt,
        status: "failed",
        workoutsFetched: summary.workoutsFetched,
        workoutsCreated: summary.workoutsCreated,
        workoutsUpdated: summary.workoutsUpdated,
        workoutsDeleted: summary.workoutsDeleted,
        errorMessage: error instanceof Error ? error.message : "Unknown sync failure",
      });
      logger.error({ syncId: sync.id, err: error }, "sync failed");
      if (error instanceof HevyApiError) {
        throw error;
      }
      throw new HevyApiError("Sync failed before Atlas could fetch usable Hevy data", "SYNC_FAILED", 500);
    }
  }

  private async runFull(summary: SyncSummary) {
    const pageSize = 10;
    const count = await this.hevy.getWorkoutCount();
    const totalPages = Math.ceil(count.count / pageSize);

    for (let page = 1; page <= totalPages; page += 1) {
      const payload = await this.hevy.getWorkoutsPage(page, pageSize);
      logger.info({ page, pageSize, count: payload.workouts.length }, "fetched Hevy workout page");
      for (const workout of payload.workouts) {
        await this.saveWorkout(workout.id, async () => workout, summary);
      }
    }
  }

  private async runIncremental(cursor: string, summary: SyncSummary) {
    const pageSize = 10;
    for (let page = 1; ; page += 1) {
      const payload = await this.hevy.getWorkoutEventsSince(cursor, page, pageSize);
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
          const deleted = await this.workouts.deleteByHevyId(workoutId);
          summary.workoutsDeleted += deleted.count;
        } else {
          await this.saveWorkout(workoutId, () => this.hevy.getWorkoutById(workoutId), summary);
        }
      }

      if (payload.events.length < pageSize) {
        break;
      }
    }
  }

  private async saveWorkout(
    hevyWorkoutId: string,
    loadWorkout: () => Promise<Parameters<typeof normalizeWorkout>[0]>,
    summary: SyncSummary,
  ) {
    try {
      const workout = await loadWorkout();
      summary.workoutsFetched += 1;
      const normalized = normalizeWorkout(workout);
      await this.templateMetadata.ensureMetadataForTemplateIds(
        normalized.exercises.map((exercise) => exercise.hevyExerciseTemplateId),
      );
      const result = await this.workouts.upsertNormalized(normalized);
      if (result.action === "created") summary.workoutsCreated += 1;
      if (result.action === "updated") summary.workoutsUpdated += 1;
      logger.info({ hevyWorkoutId, action: result.action }, "workout sync complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown workout sync error";
      summary.errors.push({ hevyWorkoutId, message });
      logger.error({ hevyWorkoutId, err: error }, "workout sync failed");
    }
  }
}
