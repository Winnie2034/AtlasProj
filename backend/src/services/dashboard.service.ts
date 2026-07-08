import type { ExerciseTemplateMetadata } from "@prisma/client";
import { ExerciseTemplateMetadataRepository } from "../repositories/exerciseTemplateMetadata.repository.js";
import { SyncHistoryRepository } from "../repositories/syncHistory.repository.js";
import { WorkoutRepository } from "../repositories/workout.repository.js";

const MUSCLE_GROUPS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Other"] as const;
type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
type MuscleCounts = Record<MuscleGroup, number>;
type DashboardWorkout = Awaited<ReturnType<WorkoutRepository["findSince"]>>[number];

const summarizeWorkout = (workout: Awaited<ReturnType<WorkoutRepository["findRecent"]>>[number]) => ({
  id: workout.id,
  title: workout.title,
  startTime: workout.startTime.toISOString(),
  exerciseCount: workout.exercises.length,
  setCount: workout.exercises.reduce((count, exercise) => count + exercise.sets.length, 0),
});

const formatNumber = (value: number) => Number(value.toFixed(2)).toString();

const formatSetHighlight = (set: DashboardWorkout["exercises"][number]["sets"][number]) => {
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

const setScore = (set: DashboardWorkout["exercises"][number]["sets"][number]) => {
  const weight = set.weightKg != null ? Number(set.weightKg) : 0;
  const reps = set.reps ?? 1;
  const distance = set.distanceMeters != null ? Number(set.distanceMeters) / 100 : 0;
  const duration = set.durationSeconds != null ? set.durationSeconds / 60 : 0;
  return weight * reps || reps || distance || duration;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfWeek = (date: Date) => {
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return startOfDay(addDays(date, mondayOffset));
};

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const weekLabel = (weekStart: Date) => {
  const end = addDays(weekStart, 6);
  const month = new Intl.DateTimeFormat("en", { month: "short" });
  if (weekStart.getMonth() === end.getMonth()) {
    return `${month.format(weekStart)} ${weekStart.getDate()}-${end.getDate()}`;
  }
  return `${month.format(weekStart)} ${weekStart.getDate()}-${month.format(end)} ${end.getDate()}`;
};

const classifyMuscleGroup = (title: string): MuscleGroup => {
  const name = title.toLowerCase();

  if (/(bench|chest|pec|push[- ]?up|dip|fly|crossover)/.test(name)) return "Chest";
  if (/(row|pull[- ]?up|chin[- ]?up|lat|pulldown|deadlift|back extension|shrug|trap)/.test(name)) return "Back";
  if (/(squat|leg press|leg curl|leg extension|lunge|calf|quad|hamstring|glute|hip thrust|rdl|romanian)/.test(name)) {
    return "Legs";
  }
  if (/(shoulder|overhead|military|lateral raise|front raise|rear delt|arnold|face pull)/.test(name)) {
    return "Shoulders";
  }
  if (/(bicep|tricep|curl|extension|skullcrusher|hammer|preacher|pushdown)/.test(name)) return "Arms";
  if (/(abs|abdominal|core|plank|crunch|sit[- ]?up|russian twist|leg raise|hanging knee)/.test(name)) return "Core";

  return "Other";
};

const emptyMuscleCounts = () =>
  Object.fromEntries(MUSCLE_GROUPS.map((group) => [group, 0])) as MuscleCounts;

const hevyMuscleToAtlasGroup = (muscle: string): MuscleGroup => {
  const normalized = muscle.toLowerCase();
  if (normalized === "chest") return "Chest";
  if (normalized === "shoulders") return "Shoulders";
  if (["biceps", "triceps", "forearms"].includes(normalized)) return "Arms";
  if (["lats", "upper_back", "lower_back", "traps", "neck"].includes(normalized)) return "Back";
  if (["quadriceps", "hamstrings", "glutes", "calves", "adductors", "abductors"].includes(normalized)) return "Legs";
  if (["abdominals"].includes(normalized)) return "Core";
  return "Other";
};

const weightedMuscleCounts = (metadata: ExerciseTemplateMetadata | undefined, fallbackTitle: string, setCount: number) => {
  const counts = emptyMuscleCounts();
  if (!metadata?.primaryMuscleGroup) {
    counts[classifyMuscleGroup(fallbackTitle)] = setCount;
    return counts;
  }

  const primaryGroup = hevyMuscleToAtlasGroup(metadata.primaryMuscleGroup);
  if (metadata.secondaryMuscleGroups.length === 0) {
    counts[primaryGroup] += setCount;
    return counts;
  }

  counts[primaryGroup] += setCount * 0.7;
  const secondaryWeight = 0.3 / metadata.secondaryMuscleGroups.length;
  for (const secondaryMuscle of metadata.secondaryMuscleGroups) {
    counts[hevyMuscleToAtlasGroup(secondaryMuscle)] += setCount * secondaryWeight;
  }

  return counts;
};

const serializeTodayWorkout = (
  workout: DashboardWorkout | undefined,
  metadataByTemplateId: Map<string, ExerciseTemplateMetadata>,
) => {
  if (!workout) return null;

  const counts = emptyMuscleCounts();
  for (const exercise of workout.exercises) {
    addMuscleCounts(
      counts,
      weightedMuscleCounts(
        metadataByTemplateId.get(exercise.hevyExerciseTemplateId),
        exercise.title,
        exercise.sets.length,
      ),
    );
  }

  const totalSets = workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  const durationMinutes = Math.max(1, Math.round((workout.endTime.getTime() - workout.startTime.getTime()) / 60000));
  const topLifts = workout.exercises
    .map((exercise) => {
      const bestSet = exercise.sets.reduce(
        (best, set) => (setScore(set) > setScore(best) ? set : best),
        exercise.sets[0],
      );
      return bestSet
        ? {
            exerciseTitle: exercise.title,
            highlight: formatSetHighlight(bestSet),
            score: setScore(bestSet),
          }
        : null;
    })
    .filter((lift): lift is NonNullable<typeof lift> => lift != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ exerciseTitle, highlight }) => ({ exerciseTitle, highlight }));

  return {
    id: workout.id,
    title: workout.title,
    startTime: workout.startTime.toISOString(),
    durationMinutes,
    setCount: totalSets,
    exerciseCount: workout.exercises.length,
    muscleFocus: MUSCLE_GROUPS.map((group) => ({
      muscleGroup: group,
      setCount: Number(counts[group].toFixed(1)),
    }))
      .filter((group) => group.setCount > 0 && group.muscleGroup !== "Other")
      .sort((a, b) => b.setCount - a.setCount)
      .slice(0, 4),
    topLifts,
  };
};

const addMuscleCounts = (target: MuscleCounts, source: MuscleCounts) => {
  for (const group of MUSCLE_GROUPS) {
    target[group] += source[group];
  }
};

const buildWeeklyMuscleDistributionSeries = (
  workouts: Awaited<ReturnType<WorkoutRepository["findSince"]>>,
  firstWeekStart: Date,
  weekCount: number,
  metadataByTemplateId: Map<string, ExerciseTemplateMetadata>,
) => {
  const weeks = Array.from({ length: weekCount }, (_, index) => {
    const weekStart = addDays(firstWeekStart, index * 7);
    return {
      weekStart,
      counts: emptyMuscleCounts(),
    };
  });

  for (const workout of workouts) {
    const weekIndex = Math.floor((startOfWeek(workout.startTime).getTime() - firstWeekStart.getTime()) / 604800000);
    if (weekIndex < 0 || weekIndex >= weeks.length) continue;

    for (const exercise of workout.exercises) {
      addMuscleCounts(
        weeks[weekIndex].counts,
        weightedMuscleCounts(
          metadataByTemplateId.get(exercise.hevyExerciseTemplateId),
          exercise.title,
          exercise.sets.length,
        ),
      );
    }
  }

  return weeks.map((week) => ({
    weekStart: dateKey(week.weekStart),
    label: weekLabel(week.weekStart),
    totalSets: MUSCLE_GROUPS.reduce((total, group) => total + week.counts[group], 0),
    muscleGroups: MUSCLE_GROUPS.map((group) => ({
      muscleGroup: group,
      setCount: Number(week.counts[group].toFixed(2)),
    })),
  }));
};

const buildTrainingDays = (
  workouts: Awaited<ReturnType<WorkoutRepository["findSince"]>>,
  firstDay: Date,
  dayCount: number,
) => {
  const days = new Map<string, { date: string; workoutCount: number; setCount: number }>();
  for (let index = 0; index < dayCount; index += 1) {
    const key = dateKey(addDays(firstDay, index));
    days.set(key, { date: key, workoutCount: 0, setCount: 0 });
  }

  for (const workout of workouts) {
    const key = dateKey(workout.startTime);
    const day = days.get(key);
    if (!day) continue;

    day.workoutCount += 1;
    day.setCount += workout.exercises.reduce((count, exercise) => count + exercise.sets.length, 0);
  }

  return Array.from(days.values());
};

const calculateCurrentStreak = (workouts: Awaited<ReturnType<WorkoutRepository["findSince"]>>, today: Date) => {
  const workoutDays = new Set(workouts.map((workout) => dateKey(workout.startTime)));
  let cursor = startOfDay(today);
  let streak = 0;

  if (!workoutDays.has(dateKey(cursor))) {
    cursor = addDays(cursor, -1);
  }

  while (workoutDays.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
};

export class DashboardService {
  constructor(
    private workouts = new WorkoutRepository(),
    private syncHistory = new SyncHistoryRepository(),
    private templateMetadata = new ExerciseTemplateMetadataRepository(),
  ) {}

  async getDashboard() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weeklyStart = startOfWeek(addDays(now, -49));
    const activityStart = startOfWeek(addDays(now, -28));
    const todayStart = startOfDay(now);
    const tomorrowStart = addDays(todayStart, 1);

    const [workoutCount, workoutsThisMonth, lastSync, recentWorkouts, analyticsWorkouts, activityWorkouts] =
      await Promise.all([
        this.workouts.countAll(),
        this.workouts.countSince(monthStart),
        this.syncHistory.latestFinished(),
        this.workouts.findRecent(4),
        this.workouts.findSince(weeklyStart),
        this.workouts.findSince(activityStart),
      ]);

    const metadata = await this.templateMetadata.findByTemplateIds(
      Array.from(
        new Set(
          analyticsWorkouts.flatMap((workout) =>
            workout.exercises.map((exercise) => exercise.hevyExerciseTemplateId).filter((id) => id !== "unknown"),
          ),
        ),
      ),
    );
    const metadataByTemplateId = new Map(metadata.map((row) => [row.hevyExerciseTemplateId, row]));
    const todayWorkout = activityWorkouts
      .filter((workout) => workout.startTime >= todayStart && workout.startTime < tomorrowStart)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];

    return {
      workoutCount,
      workoutsThisMonth,
      currentStreakDays: calculateCurrentStreak(activityWorkouts, now),
      lastSync: lastSync
        ? {
            startedAt: lastSync.startedAt.toISOString(),
            finishedAt: lastSync.finishedAt?.toISOString() ?? null,
            status: lastSync.status,
          }
        : null,
      recentWorkouts: recentWorkouts.map(summarizeWorkout),
      todayWorkout: serializeTodayWorkout(todayWorkout, metadataByTemplateId),
      muscleDistributionPerWeek: buildWeeklyMuscleDistributionSeries(
        analyticsWorkouts,
        weeklyStart,
        8,
        metadataByTemplateId,
      ),
      trainingDays: buildTrainingDays(activityWorkouts, activityStart, 35),
    };
  }
}
