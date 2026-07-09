import { NotFoundError, ValidationError } from "../utils/AppError.js";
import { ExerciseTemplateMetadataRepository } from "../repositories/exerciseTemplateMetadata.repository.js";
import { WorkoutRepository } from "../repositories/workout.repository.js";
import { metadataMuscleGroups, metadataMuscleWeights } from "./muscleGroups.js";

type WorkoutWithExercises = Awaited<ReturnType<WorkoutRepository["findRecent"]>>[number];
type TemplateMetadata = Awaited<ReturnType<ExerciseTemplateMetadataRepository["findByTemplateIds"]>>[number];

const serializeSummary = (workout: WorkoutWithExercises, metadataByTemplateId: Map<string, TemplateMetadata>) => ({
  id: workout.id,
  title: workout.title,
  startTime: workout.startTime.toISOString(),
  durationMinutes: Math.max(1, Math.round((workout.endTime.getTime() - workout.startTime.getTime()) / 60000)),
  exerciseCount: workout.exercises.length,
  setCount: workout.exercises.reduce((count, exercise) => count + exercise.sets.length, 0),
  muscleGroups: Array.from(
    workout.exercises
      .reduce((counts, exercise) => {
        for (const [group, weight] of metadataMuscleWeights(metadataByTemplateId.get(exercise.hevyExerciseTemplateId), exercise.title)) {
          if (group !== "Other") {
            counts.set(group, (counts.get(group) ?? 0) + exercise.sets.length * weight);
          }
        }
        return counts;
      }, new Map<string, number>())
      .entries(),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([group]) => group)
    .slice(0, 3),
});

const buildMuscleFocus = (workout: WorkoutWithExercises, metadataByTemplateId: Map<string, TemplateMetadata>) =>
  Array.from(
    workout.exercises
      .reduce((counts, exercise) => {
        for (const [group, weight] of metadataMuscleWeights(metadataByTemplateId.get(exercise.hevyExerciseTemplateId), exercise.title)) {
          if (group !== "Other") {
            counts.set(group, (counts.get(group) ?? 0) + exercise.sets.length * weight);
          }
        }
        return counts;
      }, new Map<string, number>())
      .entries(),
  )
    .map(([muscleGroup, setCount]) => ({ muscleGroup, setCount: Number(setCount.toFixed(1)) }))
    .sort((a, b) => b.setCount - a.setCount)
    .slice(0, 4);

const metadataMapForWorkouts = async (workouts: WorkoutWithExercises[], metadata: ExerciseTemplateMetadataRepository) => {
  const templateIds = Array.from(
    new Set(
      workouts.flatMap((workout) =>
        workout.exercises.map((exercise) => exercise.hevyExerciseTemplateId).filter((id) => id !== "unknown"),
      ),
    ),
  );
  const rows = await metadata.findByTemplateIds(templateIds);
  return new Map(rows.map((row) => [row.hevyExerciseTemplateId, row]));
};

const parseDate = (value: unknown, fieldName: string) => {
  if (value == null || value === "") return undefined;
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (typeof rawValue !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    throw new ValidationError(`${fieldName} must use YYYY-MM-DD format`);
  }

  const [year, month, day] = rawValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new ValidationError(`${fieldName} is not a valid calendar date`);
  }

  return date;
};

export class WorkoutsService {
  constructor(
    private workouts = new WorkoutRepository(),
    private metadata = new ExerciseTemplateMetadataRepository(),
  ) {}

  async list(query: Record<string, unknown>) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize ?? 20), 1), 100);
    const sortBy = query.sortBy === "title" ? "title" : "startTime";
    const sortDir = query.sortDir === "asc" ? "asc" : "desc";
    const search = typeof query.search === "string" ? query.search : undefined;
    const startDate = parseDate(query.startDate, "startDate");
    const endDate = parseDate(query.endDate, "endDate");
    const muscleGroup = typeof query.muscleGroup === "string" && query.muscleGroup !== "all" ? query.muscleGroup : undefined;
    const muscleTemplateIds = muscleGroup ? await this.templateIdsForAtlasGroup(muscleGroup) : undefined;

    const result = await this.workouts.list({ search, startDate, endDate, muscleTemplateIds, sortBy, sortDir, page, pageSize });
    const metadataByTemplateId = await metadataMapForWorkouts(result.items, this.metadata);
    return {
      data: result.items.map((workout) => serializeSummary(workout, metadataByTemplateId)),
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
    const metadataByTemplateId = await metadataMapForWorkouts([workout], this.metadata);

    return {
      ...serializeSummary(workout, metadataByTemplateId),
      description: workout.description,
      endTime: workout.endTime.toISOString(),
      muscleFocus: buildMuscleFocus(workout, metadataByTemplateId),
      exercises: workout.exercises.map((exercise) => ({
        id: exercise.id,
        title: exercise.title,
        notes: exercise.notes,
        index: exercise.exerciseIndex,
        supersetId: exercise.supersetId,
        muscleGroups: metadataMuscleGroups(metadataByTemplateId.get(exercise.hevyExerciseTemplateId), exercise.title).filter(
          (group) => group !== "Other",
        ),
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

  private async templateIdsForAtlasGroup(group: string) {
    const normalizedGroup = group.toLowerCase();
    const rows = await this.metadata.findAll();
    return rows
      .filter((row) =>
        metadataMuscleGroups(row, row.title).some((muscleGroup) => muscleGroup.toLowerCase() === normalizedGroup),
      )
      .map((row) => row.hevyExerciseTemplateId);
  }
}
