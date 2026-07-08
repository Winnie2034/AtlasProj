export type ApiMeta = { page: number; pageSize: number; total: number };

export interface DashboardData {
  workoutCount: number;
  workoutsThisMonth: number;
  currentStreakDays: number;
  lastSync: { startedAt: string; finishedAt: string | null; status: string } | null;
  recentWorkouts: WorkoutSummary[];
  setsByMuscleGroupPerWeek: WeeklyMuscleGroupVolume[];
  muscleDistributionPerWeek: WeeklyMuscleGroupVolume[];
  trainingDays: TrainingDay[];
}

export interface WeeklyMuscleGroupVolume {
  weekStart: string;
  label: string;
  totalSets: number;
  muscleGroups: MuscleGroupSetCount[];
}

export interface MuscleGroupSetCount {
  muscleGroup: "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Core" | "Other" | string;
  setCount: number;
}

export interface TrainingDay {
  date: string;
  workoutCount: number;
  setCount: number;
}

export interface WorkoutSummary {
  id: string;
  title: string;
  startTime: string;
  exerciseCount: number;
  setCount: number;
}

export interface SetDetail {
  id: string;
  index: number;
  type: "normal" | "warmup" | "dropset" | "failure" | string;
  weightKg: number | null;
  reps: number | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
  rpe: number | null;
}

export interface ExerciseDetail {
  id: string;
  title: string;
  notes: string | null;
  index: number;
  supersetId: number | null;
  sets: SetDetail[];
}

export interface WorkoutDetail extends WorkoutSummary {
  description: string | null;
  endTime: string;
  exercises: ExerciseDetail[];
}

export interface WorkoutListParams {
  search?: string;
  sortBy?: "startTime" | "title";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ExerciseSummary {
  hevyExerciseTemplateId: string;
  title: string;
  timesPerformed: number;
}

export interface RoutineSet {
  index: number;
  type: string;
  weightKg: number | null;
  reps: number | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
  rpe: number | null;
}

export interface RoutineExercise {
  title: string;
  notes: string | null;
  index: number;
  exerciseTemplateId: string;
  restSeconds: number | null;
  supersetId: number | null;
  sets: RoutineSet[];
}

export interface Routine {
  id: string;
  title: string;
  folderId: string | null;
  folderTitle: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  exerciseCount: number;
  setCount: number;
  exercises: RoutineExercise[];
}

export interface SyncResult {
  syncId: string;
  status: "success" | "partial_failure" | "failed";
  startedAt: string;
  finishedAt: string;
  workoutsFetched: number;
  workoutsCreated: number;
  workoutsUpdated: number;
  workoutsDeleted: number;
  errors: { hevyWorkoutId: string; message: string }[];
}
