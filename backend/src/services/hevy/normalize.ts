import type { NormalizedWorkout } from "../../repositories/workout.repository.js";
import type { HevyWorkout } from "./hevy.types.js";

export function normalizeWorkout(workout: HevyWorkout): NormalizedWorkout {
  return {
    hevyId: workout.id,
    title: workout.title,
    description: workout.description ?? null,
    startTime: new Date(workout.start_time),
    endTime: new Date(workout.end_time),
    hevyCreatedAt: new Date(workout.created_at),
    hevyUpdatedAt: new Date(workout.updated_at),
    exercises: workout.exercises.map((exercise) => ({
      hevyExerciseTemplateId: exercise.exercise_template_id,
      title: exercise.title,
      notes: exercise.notes ?? null,
      exerciseIndex: exercise.index,
      supersetId: exercise.superset_id ?? null,
      sets: exercise.sets.map((set) => ({
        setIndex: set.index,
        setType: set.type,
        weightKg: set.weight_kg ?? null,
        reps: set.reps ?? null,
        distanceMeters: set.distance_meters ?? null,
        durationSeconds: set.duration_seconds ?? null,
        rpe: set.rpe ?? null,
      })),
    })),
  };
}
