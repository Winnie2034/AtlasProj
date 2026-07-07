import { Link } from "react-router-dom";
import { ChevronRight, ListChecks } from "lucide-react";
import type { WorkoutSummary } from "../../types/api";
import { formatDateTime } from "../../utils/format";
import { EmptyState } from "../common/EmptyState";

export function RecentWorkoutsList({ workouts }: { workouts: WorkoutSummary[] }) {
  if (workouts.length === 0) {
    return <EmptyState title="No workouts yet" detail="Run a sync to import your Hevy history." />;
  }

  return (
    <section className="rounded-md border border-line bg-white shadow-panel">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h3 className="font-semibold">Recent Workouts</h3>
          <p className="text-sm text-slate-500">Latest synced sessions</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-berry text-white">
          <ListChecks size={18} />
        </div>
      </div>
      <div className="divide-y divide-line">
        {workouts.map((workout) => (
          <Link className="group block px-4 py-3 hover:bg-paper" key={workout.id} to={`/workouts/${workout.id}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{workout.title}</p>
                <p className="mt-1 text-sm text-slate-500">{formatDateTime(workout.startTime)}</p>
              </div>
              <ChevronRight className="shrink-0 text-slate-400 group-hover:text-river" size={18} />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {workout.exerciseCount} exercises, {workout.setCount} sets
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
