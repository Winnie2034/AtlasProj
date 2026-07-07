import { NotFoundError, ValidationError } from "../utils/AppError.js";
import { WorkoutRepository } from "../repositories/workout.repository.js";

const serializeSummary = (workout: Awaited<ReturnType<WorkoutRepository["findRecent"]>>[number]) => ({
  id: workout.id,
  title: workout.title,
  startTime: workout.startTime.toISOString(),
  exerciseCount: workout.exercises.length,
  setCount: workout.exercises.reduce((count, exercise) => count + exercise.sets.length, 0),
});

export class WorkoutsService {
  constructor(private workouts = new WorkoutRepository()) {}

  async list(query: Record<string, unknown>) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize ?? 20), 1), 100);
    const sortBy = query.sortBy === "title" ? "title" : "startTime";
    const sortDir = query.sortDir === "asc" ? "asc" : "desc";
    const search = typeof query.search === "string" ? query.search : undefined;

    const result = await this.workouts.list({ search, sortBy, sortDir, page, pageSize });
    return {
      data: result.items.map(serializeSummary),
      meta: { page, pageSize, total: result.total },
    };
  }

  async getById(id: string) {
    if (!id) {
      throw new ValidationError("Workout id is required");
    }
    const workout = await this.workouts.findById(id);
    if (!workout) {
      throw new NotFoundError(`No workout found with id ${id}`, "WORKOUT_NOT_FOUND");
    }

    return {
      ...serializeSummary(workout),
      description: workout.description,
      endTime: workout.endTime.toISOString(),
      exercises: workout.exercises.map((exercise) => ({
        id: exercise.id,
        title: exercise.title,
        notes: exercise.notes,
        index: exercise.exerciseIndex,
        supersetId: exercise.supersetId,
        sets: exercise.sets.map((set) => ({
          id: set.id,
          index: set.setIndex,
          type: set.setType,
          weightKg: set.weightKg ? Number(set.weightKg) : null,
          reps: set.reps,
          distanceMeters: set.distanceMeters ? Number(set.distanceMeters) : null,
          durationSeconds: set.durationSeconds,
          rpe: set.rpe ? Number(set.rpe) : null,
        })),
      })),
    };
  }
}
