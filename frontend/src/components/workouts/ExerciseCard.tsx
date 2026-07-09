import type { ExerciseDetail } from "../../types/api";
import { exerciseVolumeKg, formatWorkoutSetLabel } from "../../utils/workoutDisplay";

const MUSCLE_COLORS: Record<string, string> = {
  Back: "bg-indigo-50 text-indigo-700",
  Chest: "bg-teal-50 text-teal-700",
  Legs: "bg-emerald-50 text-emerald-700",
  Shoulders: "bg-amber-50 text-amber-700",
  Arms: "bg-rose-50 text-rose-700",
  Core: "bg-slate-100 text-slate-700",
};

export function ExerciseCard({ exercise }: { exercise: ExerciseDetail }) {
  const volume = exerciseVolumeKg(exercise);

  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-ink">{exercise.title}</h3>
            {exercise.supersetId ? (
              <span className="rounded bg-berry/10 px-2 py-1 text-xs font-semibold text-berry">Superset {exercise.supersetId}</span>
            ) : null}
          </div>
          {exercise.notes ? <p className="mt-1 text-sm text-slate-600">{exercise.notes}</p> : null}
          {exercise.muscleGroups.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {exercise.muscleGroups.map((group) => (
                <span className={`rounded px-2 py-1 text-xs font-semibold ${MUSCLE_COLORS[group] ?? "bg-slate-100 text-slate-600"}`} key={group}>
                  {group}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2 text-right">
          <div className="rounded-md bg-paper px-3 py-2">
            <p className="text-xs uppercase text-slate-400">Sets</p>
            <p className="mt-1 text-sm font-semibold text-ink">{exercise.sets.length}</p>
          </div>
          <div className="rounded-md bg-paper px-3 py-2">
            <p className="text-xs uppercase text-slate-400">Volume</p>
            <p className="mt-1 text-sm font-semibold text-ink">{volume ? `${Math.round(volume)} kg` : "-"}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {exercise.sets.map((set) => (
          <span
            className="inline-flex min-h-9 items-center rounded-md border border-line bg-paper px-3 py-2 text-sm font-medium text-slate-700"
            key={set.id}
          >
            <span className="mr-2 text-xs font-semibold uppercase text-slate-400">Set {set.index + 1}</span>
            {formatWorkoutSetLabel(set)}
          </span>
        ))}
      </div>
    </section>
  );
}
