import type { ExerciseTemplateMetadata } from "@prisma/client";
import { ExerciseTemplateMetadataRepository } from "../repositories/exerciseTemplateMetadata.repository.js";
import { SyncHistoryRepository } from "../repositories/syncHistory.repository.js";
import { WorkoutRepository } from "../repositories/workout.repository.js";
import { ATLAS_MUSCLE_GROUPS, type AtlasMuscleCounts, emptyAtlasMuscleCounts, weightedSetCountsForExercises } from "./muscleGroups.js";
import { buildTopLifts } from "./workoutMetrics.js";

type DashboardWorkout = Awaited<ReturnType<WorkoutRepository["findSince"]>>[number];
type DashboardParams = {
  selectedDate?: Date;
};

const summarizeWorkout = (workout: Awaited<ReturnType<WorkoutRepository["findRecent"]>>[number]) => ({
  id: workout.id,
  title: workout.title,
  startTime: workout.startTime.toISOString(),
  exerciseCount: workout.exercises.length,
  setCount: workout.exercises.reduce((count, exercise) => count + exercise.sets.length, 0),
});

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

const serializeTodayWorkout = (
  workout: DashboardWorkout | undefined,
  metadataByTemplateId: Map<string, ExerciseTemplateMetadata>,
) => {
  if (!workout) return null;

  const counts = weightedSetCountsForExercises(workout.exercises, metadataByTemplateId);

  const totalSets = workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  const durationMinutes = Math.max(1, Math.round((workout.endTime.getTime() - workout.startTime.getTime()) / 60000));
  const topLifts = buildTopLifts(workout.exercises);

  return {
    id: workout.id,
    title: workout.title,
    startTime: workout.startTime.toISOString(),
    durationMinutes,
    setCount: totalSets,
    exerciseCount: workout.exercises.length,
    muscleFocus: ATLAS_MUSCLE_GROUPS.map((group) => ({
      muscleGroup: group,
      setCount: Number(counts[group].toFixed(1)),
    }))
      .filter((group) => group.setCount > 0 && group.muscleGroup !== "Other")
      .sort((a, b) => b.setCount - a.setCount)
      .slice(0, 4),
    topLifts,
  };
};

const addMuscleCounts = (target: AtlasMuscleCounts, source: AtlasMuscleCounts) => {
  for (const group of ATLAS_MUSCLE_GROUPS) {
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
      counts: emptyAtlasMuscleCounts(),
    };
  });

  for (const workout of workouts) {
    const weekIndex = Math.floor((startOfWeek(workout.startTime).getTime() - firstWeekStart.getTime()) / 604800000);
    if (weekIndex < 0 || weekIndex >= weeks.length) continue;

    addMuscleCounts(weeks[weekIndex].counts, weightedSetCountsForExercises(workout.exercises, metadataByTemplateId));
  }

  return weeks.map((week) => ({
    weekStart: dateKey(week.weekStart),
    label: weekLabel(week.weekStart),
    totalSets: ATLAS_MUSCLE_GROUPS.reduce((total, group) => total + week.counts[group], 0),
    muscleGroups: ATLAS_MUSCLE_GROUPS.map((group) => ({
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

  async getDashboard(params: DashboardParams = {}) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weeklyStart = startOfWeek(addDays(now, -49));
    const activityStart = startOfWeek(addDays(now, -28));
    const selectedDate = startOfDay(params.selectedDate ?? now);
    const selectedDateEnd = addDays(selectedDate, 1);

    const [
      workoutCount,
      workoutsThisMonth,
      lastSync,
      recentWorkouts,
      analyticsWorkouts,
      activityWorkouts,
      selectedDateWorkouts,
    ] =
      await Promise.all([
        this.workouts.countAll(),
        this.workouts.countSince(monthStart),
        this.syncHistory.latestFinished(),
        this.workouts.findRecent(4),
        this.workouts.findSince(weeklyStart),
        this.workouts.findSince(activityStart),
        this.workouts.findBetween(selectedDate, selectedDateEnd),
      ]);

    const metadata = await this.templateMetadata.findByTemplateIds(
      Array.from(
        new Set(
          [...analyticsWorkouts, ...selectedDateWorkouts].flatMap((workout) =>
            workout.exercises.map((exercise) => exercise.hevyExerciseTemplateId).filter((id) => id !== "unknown"),
          ),
        ),
      ),
    );
    const metadataByTemplateId = new Map(metadata.map((row) => [row.hevyExerciseTemplateId, row]));
    const selectedWorkout = selectedDateWorkouts[0];

    return {
      selectedDate: dateKey(selectedDate),
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
      selectedWorkout: serializeTodayWorkout(selectedWorkout, metadataByTemplateId),
      muscleDistributionPerWeek: buildWeeklyMuscleDistributionSeries(
        analyticsWorkouts,
        weeklyStart,
        8,
        metadataByTemplateId,
      ),
      trainingDays: buildTrainingDays(activityWorkouts, activityStart, 35),
    };
  }

  async getSelectedWorkout(selectedDate: Date) {
    const dayStart = startOfDay(selectedDate);
    const dayEnd = addDays(dayStart, 1);
    const selectedDateWorkouts = await this.workouts.findBetween(dayStart, dayEnd);
    const selectedWorkout = selectedDateWorkouts[0];
    const metadata = await this.templateMetadata.findByTemplateIds(
      selectedWorkout
        ? selectedWorkout.exercises.map((exercise) => exercise.hevyExerciseTemplateId).filter((id) => id !== "unknown")
        : [],
    );
    const metadataByTemplateId = new Map(metadata.map((row) => [row.hevyExerciseTemplateId, row]));

    return {
      selectedDate: dateKey(dayStart),
      selectedWorkout: serializeTodayWorkout(selectedWorkout, metadataByTemplateId),
    };
  }
}
