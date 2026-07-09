import type { ExerciseDetail, SetDetail } from "../types/api";
import { formatDuration } from "./format";

export const formatWorkoutSetLabel = (set: SetDetail, fallback = "set") => {
  const parts: string[] = [];

  if (set.weightKg != null && set.reps != null) parts.push(`${set.weightKg} kg x ${set.reps}`);
  else if (set.reps != null) parts.push(`${set.reps} reps`);
  else if (set.distanceMeters != null) parts.push(`${set.distanceMeters} m`);
  else if (set.durationSeconds != null) parts.push(formatDuration(set.durationSeconds));
  else if (set.rpe != null) parts.push(`RPE ${set.rpe}`);
  else parts.push(set.type ? `${set.type} ${fallback}` : fallback);

  if (set.type && set.type !== "normal") parts.push(set.type);
  if (set.rpe != null && !parts.includes(`RPE ${set.rpe}`)) parts.push(`RPE ${set.rpe}`);

  return parts.join(" / ");
};

export const workoutSetScore = (set: SetDetail) => {
  const weight = set.weightKg ?? 0;
  const reps = set.reps ?? 1;
  const distance = set.distanceMeters ? set.distanceMeters / 100 : 0;
  const duration = set.durationSeconds ? set.durationSeconds / 60 : 0;

  return weight * reps || reps || distance || duration;
};

export const bestSetForExercise = (exercise: ExerciseDetail) =>
  exercise.sets.reduce<SetDetail | null>((best, set) => {
    if (!best) return set;
    return workoutSetScore(set) > workoutSetScore(best) ? set : best;
  }, null);

export const exerciseVolumeKg = (exercise: ExerciseDetail) =>
  exercise.sets.reduce((total, set) => total + (set.weightKg ?? 0) * (set.reps ?? 0), 0);
