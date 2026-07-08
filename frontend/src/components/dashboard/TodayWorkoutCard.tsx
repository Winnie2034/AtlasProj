import { ArrowRight, Dumbbell } from "lucide-react";
import { Link } from "react-router-dom";
import type { TodayWorkout, WorkoutSummary } from "../../types/api";
import { formatDateTime, relativeTime } from "../../utils/format";

const FOCUS_COLORS: Record<string, string> = {
  Chest: "bg-teal-600",
  Back: "bg-indigo-600",
  Legs: "bg-emerald-600",
  Shoulders: "bg-amber-500",
  Arms: "bg-rose-500",
  Core: "bg-slate-500",
};

export function TodayWorkoutCard({
  workout,
  lastWorkout,
  currentStreakDays,
}: {
  workout: TodayWorkout | null;
  lastWorkout: WorkoutSummary | undefined;
  currentStreakDays: number;
}) {
  if (!workout) {
    return <TodayWorkoutEmpty lastWorkout={lastWorkout} currentStreakDays={currentStreakDays} />;
  }

  const maxFocus = Math.max(...workout.muscleFocus.map((group) => group.setCount), 1);

  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Today's Workout</p>
          <h3 className="text-xl font-semibold text-ink">{workout.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{formatDateTime(workout.startTime)}</p>
        </div>
        <Link
          className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium text-slate-700 hover:bg-paper"
          to={`/workouts/${workout.id}`}
        >
          Details
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Duration" value={`${workout.durationMinutes} min`} />
        <Metric label="Volume" value={`${workout.setCount} sets`} />
        <Metric label="Exercises" value={workout.exerciseCount} />
      </div>

      <div className="mt-4 rounded-md border border-line p-4">
        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.82fr)]">
          <div className="flex min-h-[150px] flex-col">
            <h4 className="text-sm font-semibold text-ink">Muscle Focus</h4>
            <div className="mt-3 grid flex-1 auto-rows-fr gap-2">
              {workout.muscleFocus.length > 0 ? (
                workout.muscleFocus.map((group) => (
                  <div
                    className="grid grid-cols-[92px_minmax(0,1fr)_54px] items-center gap-3 rounded-md bg-paper px-3"
                    key={group.muscleGroup}
                  >
                    <span className="truncate text-sm text-slate-600">{group.muscleGroup}</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white">
                      <div
                        className={`h-full rounded-full ${FOCUS_COLORS[group.muscleGroup] ?? "bg-slate-400"}`}
                        style={{ width: `${Math.max((group.setCount / maxFocus) * 100, 8)}%` }}
                      />
                    </div>
                    <span className="text-right text-sm font-semibold text-ink">{group.setCount}</span>
                  </div>
                ))
              ) : (
                <p className="flex items-center rounded-md bg-paper px-3 text-sm text-slate-500">
                  No muscle focus available yet.
                </p>
              )}
            </div>
          </div>

          <div className="flex min-h-[150px] flex-col">
            <h4 className="text-sm font-semibold text-ink">Top Lifts</h4>
            <div className="mt-3 flex-1 divide-y divide-line rounded-md border border-line">
              {workout.topLifts.length > 0 ? (
                workout.topLifts.map((lift) => (
                  <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-2.5" key={lift.exerciseTitle}>
                    <span className="min-w-0 truncate text-sm font-medium text-slate-700">{lift.exerciseTitle}</span>
                    <span className="shrink-0 text-sm font-semibold text-ink">{lift.highlight}</span>
                  </div>
                ))
              ) : (
                <p className="px-3 py-2.5 text-sm text-slate-500">No top lifts available yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-right text-xs text-slate-400">Synced from Hevy</p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-line bg-paper px-3 py-2">
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function TodayWorkoutEmpty({
  lastWorkout,
  currentStreakDays,
}: {
  lastWorkout: WorkoutSummary | undefined;
  currentStreakDays: number;
}) {
  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Today's Workout</p>
          <h3 className="text-xl font-semibold text-ink">No workout logged today</h3>
          <p className="mt-1 text-sm text-slate-500">Sync after training and this panel will update automatically.</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-paper text-slate-500">
          <Dumbbell size={18} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Metric label="Current streak" value={`${currentStreakDays} active days`} />
        <Metric label="Status" value="Rest or pending sync" />
        <div className="rounded-md border border-line bg-paper px-3 py-2">
          <p className="text-xs uppercase text-slate-400">Last session</p>
          {lastWorkout ? (
            <Link className="mt-1 block text-sm font-semibold text-river hover:underline" to={`/workouts/${lastWorkout.id}`}>
              {lastWorkout.title}, {relativeTime(lastWorkout.startTime)}
            </Link>
          ) : (
            <p className="mt-1 text-sm font-semibold text-ink">No synced workouts</p>
          )}
        </div>
      </div>
    </section>
  );
}
