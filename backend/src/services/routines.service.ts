import { HevyClient } from "./hevy/hevy.client.js";
import type { HevyRoutine } from "./hevy/hevy.types.js";

const sumSets = (routine: HevyRoutine) =>
  routine.exercises.reduce((count, exercise) => count + exercise.sets.length, 0);

const serializeRoutine = (routine: HevyRoutine) => ({
  id: routine.id,
  title: routine.title,
  folderId: routine.folder_id ?? null,
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
  constructor(private hevy = new HevyClient()) {}

  async list() {
    const pageSize = 10;
    const routines: HevyRoutine[] = [];

    for (let page = 1; ; page += 1) {
      const payload = await this.hevy.getRoutinesPage(page, pageSize);
      routines.push(...payload.routines);

      if (payload.page_count != null ? page >= payload.page_count : payload.routines.length < pageSize) {
        break;
      }
    }

    return routines.map(serializeRoutine);
  }
}
