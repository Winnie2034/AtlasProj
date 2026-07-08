import { HevyClient } from "./hevy/hevy.client.js";
import type { HevyRoutine, HevyRoutineFolder } from "./hevy/hevy.types.js";
import { HevyApiError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";
import { ExerciseTemplateMetadataService } from "./exerciseTemplateMetadata.service.js";

const sumSets = (routine: HevyRoutine) =>
  routine.exercises.reduce((count, exercise) => count + exercise.sets.length, 0);

const serializeRoutine = (routine: HevyRoutine, foldersById: Map<string, HevyRoutineFolder>) => ({
  id: routine.id,
  title: routine.title,
  folderId: routine.folder_id ?? null,
  folderTitle: routine.folder_id ? (foldersById.get(routine.folder_id)?.title ?? null) : null,
  notes: routine.notes ?? null,
  createdAt: routine.created_at ?? null,
  updatedAt: routine.updated_at ?? null,
  exerciseCount: routine.exercises.length,
  setCount: sumSets(routine),
  exercises: routine.exercises
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((exercise) => ({
      title: exercise.title,
      notes: exercise.notes ?? null,
      index: exercise.index,
      exerciseTemplateId: exercise.exercise_template_id,
      restSeconds: exercise.rest_seconds ?? null,
      supersetId: exercise.superset_id ?? null,
      sets: exercise.sets
        .slice()
        .sort((a, b) => a.index - b.index)
        .map((set) => ({
          index: set.index,
          type: set.type,
          weightKg: set.weight_kg ?? null,
          reps: set.reps ?? null,
          distanceMeters: set.distance_meters ?? null,
          durationSeconds: set.duration_seconds ?? null,
          rpe: set.rpe ?? null,
        })),
    })),
});

export class RoutinesService {
  constructor(
    private hevy = new HevyClient(),
    private templateMetadata = new ExerciseTemplateMetadataService(hevy),
  ) {}

  async list() {
    const pageSize = 10;
    const routines = await this.listRoutines(pageSize);
    await this.templateMetadata.ensureMetadataForTemplateIds(
      routines.flatMap((routine) => routine.exercises.map((exercise) => exercise.exercise_template_id)),
    );
    const folders = await this.listFolders(pageSize);
    const foldersById = new Map(folders.map((folder) => [folder.id, folder]));

    return routines.map((routine) => serializeRoutine(routine, foldersById));
  }

  private async listRoutines(pageSize: number) {
    const routines: HevyRoutine[] = [];
    for (let page = 1; ; page += 1) {
      const payload = await this.hevy.getRoutinesPage(page, pageSize);
      routines.push(...payload.routines);

      if (payload.page_count != null ? page >= payload.page_count : payload.routines.length < pageSize) {
        break;
      }
    }

    return routines;
  }

  private async listFolders(pageSize: number) {
    const folders: HevyRoutineFolder[] = [];
    try {
      for (let page = 1; ; page += 1) {
        const payload = await this.hevy.getRoutineFoldersPage(page, pageSize);
        folders.push(...payload.routine_folders);

        if (payload.page_count != null ? page >= payload.page_count : payload.routine_folders.length < pageSize) {
          break;
        }
      }
    } catch (error) {
      if (error instanceof HevyApiError) {
        logger.warn({ err: error }, "routine folder lookup failed; continuing without folder names");
        return [];
      }

      throw error;
    }

    return folders;
  }
}
