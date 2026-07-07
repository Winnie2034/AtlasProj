import { SyncHistoryRepository } from "../repositories/syncHistory.repository.js";
import { WorkoutRepository } from "../repositories/workout.repository.js";

const summarizeWorkout = (workout: Awaited<ReturnType<WorkoutRepository["findRecent"]>>[number]) => ({
  id: workout.id,
  title: workout.title,
  startTime: workout.startTime.toISOString(),
  exerciseCount: workout.exercises.length,
  setCount: workout.exercises.reduce((count, exercise) => count + exercise.sets.length, 0),
});

export class DashboardService {
  constructor(
    private workouts = new WorkoutRepository(),
    private syncHistory = new SyncHistoryRepository(),
  ) {}

  async getDashboard() {
    const [workoutCount, lastSync, recentWorkouts] = await Promise.all([
      this.workouts.countAll(),
      this.syncHistory.latestFinished(),
      this.workouts.findRecent(5),
    ]);

    return {
      workoutCount,
      lastSync: lastSync
        ? {
            startedAt: lastSync.startedAt.toISOString(),
            finishedAt: lastSync.finishedAt?.toISOString() ?? null,
            status: lastSync.status,
          }
        : null,
      recentWorkouts: recentWorkouts.map(summarizeWorkout),
    };
  }
}
