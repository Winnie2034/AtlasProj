import { Link } from "react-router-dom";
import type { WorkoutSummary } from "../../types/api";
import { formatDateTime } from "../../utils/format";
import { EmptyState } from "../common/EmptyState";

export function RecentWorkoutsList({ workouts }: { workouts: WorkoutSummary[] }) {
  if (workouts.length === 0) {
    return <EmptyState title="No workouts yet" detail="Run a sync to import your Hevy history." />;
  }

  return (
    <section className="rounded-md border border-line bg-white shadow-panel">
      <div className="border-b border-line px-4 py-3">
        <h3 className="font-semibold">Recent workouts</h3>
      </div>
      <div className="divide-y divide-line">
        {workouts.map((workout) => (
          <Link className="block px-4 py-3 hover:bg-paper" key={workout.id} to={`/workouts/${workout.id}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{workout.title}</p>
              <p className="text-sm text-slate-500">{formatDateTime(workout.startTime)}</p>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {workout.exerciseCount} exercises, {workout.setCount} sets
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
