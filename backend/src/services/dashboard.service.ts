import { SyncHistoryRepository } from "../repositories/syncHistory.repository.js";
import { WorkoutRepository } from "../repositories/workout.repository.js";

const MUSCLE_GROUPS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Other"] as const;
type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

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
  Object.fromEntries(MUSCLE_GROUPS.map((group) => [group, 0])) as Record<MuscleGroup, number>;

const buildWeeklyMuscleGroupSeries = (
  workouts: Awaited<ReturnType<WorkoutRepository["findSince"]>>,
  firstWeekStart: Date,
  weekCount: number,
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
      const group = classifyMuscleGroup(exercise.title);
      weeks[weekIndex].counts[group] += exercise.sets.length;
    }
  }

  return weeks.map((week) => ({
    weekStart: dateKey(week.weekStart),
    label: weekLabel(week.weekStart),
    totalSets: MUSCLE_GROUPS.reduce((total, group) => total + week.counts[group], 0),
    muscleGroups: MUSCLE_GROUPS.map((group) => ({
      muscleGroup: group,
      setCount: week.counts[group],
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
  ) {}

  async getDashboard() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weeklyStart = startOfWeek(addDays(now, -49));
    const activityStart = startOfWeek(addDays(now, -28));

    const [workoutCount, workoutsThisMonth, lastSync, recentWorkouts, analyticsWorkouts, activityWorkouts] =
      await Promise.all([
        this.workouts.countAll(),
        this.workouts.countSince(monthStart),
        this.syncHistory.latestFinished(),
        this.workouts.findRecent(4),
        this.workouts.findSince(weeklyStart),
        this.workouts.findSince(activityStart),
      ]);

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
      setsByMuscleGroupPerWeek: buildWeeklyMuscleGroupSeries(analyticsWorkouts, weeklyStart, 8),
      trainingDays: buildTrainingDays(activityWorkouts, activityStart, 35),
    };
  }
}
