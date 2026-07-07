import { Clock3, Dumbbell, Folder } from "lucide-react";
import type { Routine, RoutineSet } from "../../types/api";
import { formatDuration } from "../../utils/format";

function formatPlannedSet(set: RoutineSet) {
  const parts = [
    set.reps != null ? `${set.reps} reps` : null,
    set.weightKg != null ? `${set.weightKg} kg` : null,
    set.distanceMeters != null ? `${set.distanceMeters} m` : null,
    set.durationSeconds != null ? formatDuration(set.durationSeconds) : null,
    set.rpe != null ? `RPE ${set.rpe}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" / ") : "No target";
}

export function RoutineCard({ routine }: { routine: Routine }) {
  return (
    <article className="rounded-md border border-line bg-white p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">{routine.title}</h3>
          {routine.notes ? <p className="mt-1 text-sm text-slate-600">{routine.notes}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
          {routine.folderTitle ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1">
              <Folder size={14} />
              {routine.folderTitle}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1">
            <Dumbbell size={14} />
            {routine.exerciseCount} exercises
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1">
            <Clock3 size={14} />
            {routine.setCount} sets
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {routine.exercises.map((exercise) => (
          <section className="rounded-md border border-line bg-paper p-3" key={`${routine.id}-${exercise.index}-${exercise.title}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-ink">{exercise.title}</p>
                {exercise.notes ? <p className="mt-1 text-sm text-slate-600">{exercise.notes}</p> : null}
              </div>
              {exercise.restSeconds != null ? (
                <span className="text-xs font-medium text-slate-500">Rest {formatDuration(exercise.restSeconds)}</span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {exercise.sets.length > 0 ? (
                exercise.sets.map((set) => (
                  <div className="rounded-md bg-white px-3 py-2 text-sm" key={`${exercise.index}-${set.index}`}>
                    <span className="font-medium text-slate-500">Set {set.index + 1}</span>
                    <span className="ml-2 text-ink">{formatPlannedSet(set)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No planned sets.</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
