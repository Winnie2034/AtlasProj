type WorkoutSet = {
  setType: string;
  weightKg: unknown;
  reps: number | null;
  distanceMeters: unknown;
  durationSeconds: number | null;
  rpe: unknown;
};

type WorkoutExerciseWithSets = {
  title: string;
  sets: WorkoutSet[];
};

const formatNumber = (value: number) => Number(value.toFixed(2)).toString();

export const formatSetHighlight = (set: WorkoutSet) => {
  const weight = set.weightKg != null ? Number(set.weightKg) : null;
  const distance = set.distanceMeters != null ? Number(set.distanceMeters) : null;
  const rpe = set.rpe != null ? Number(set.rpe) : null;

  if (weight != null && set.reps != null) return `${formatNumber(weight)} kg x ${set.reps}`;
  if (set.reps != null) return `${set.reps} reps`;
  if (distance != null) return `${formatNumber(distance)} m`;
  if (set.durationSeconds != null) return `${Math.round(set.durationSeconds / 60)} min`;
  if (rpe != null) return `RPE ${formatNumber(rpe)}`;
  return `${set.setType} set`;
};

export const setScore = (set: WorkoutSet) => {
  const weight = set.weightKg != null ? Number(set.weightKg) : 0;
  const reps = set.reps ?? 1;
  const distance = set.distanceMeters != null ? Number(set.distanceMeters) / 100 : 0;
  const duration = set.durationSeconds != null ? set.durationSeconds / 60 : 0;
  return weight * reps || reps || distance || duration;
};

export const buildTopLifts = (exercises: WorkoutExerciseWithSets[], limit = 3) =>
  exercises
    .map((exercise) => {
      const bestSet = exercise.sets.reduce<WorkoutSet | undefined>(
        (best, set) => (!best || setScore(set) > setScore(best) ? set : best),
        undefined,
      );
      return bestSet
        ? {
            exerciseTitle: exercise.title,
            highlight: formatSetHighlight(bestSet),
            score: setScore(bestSet),
          }
        : null;
    })
    .filter((lift): lift is { exerciseTitle: string; highlight: string; score: number } => lift != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ exerciseTitle, highlight }) => ({ exerciseTitle, highlight }));
