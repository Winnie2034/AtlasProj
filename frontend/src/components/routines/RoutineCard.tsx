import { ChevronDown, ChevronUp, Clock3, Dumbbell, Folder, Layers3, ListChecks, Target } from "lucide-react";
import { useState } from "react";
import type { Routine, RoutineSet } from "../../types/api";
import { formatDuration } from "../../utils/format";

const PREVIEW_EXERCISE_COUNT = 4;

function formatPlannedSet(set: RoutineSet) {
  const parts = [
    set.reps != null ? `${set.reps} reps` : null,
    set.weightKg != null && (set.weightKg !== 0 || set.reps != null) ? `${set.weightKg} kg` : null,
    set.distanceMeters != null ? `${set.distanceMeters} m` : null,
    set.durationSeconds != null ? formatDuration(set.durationSeconds) : null,
    set.rpe != null ? `RPE ${set.rpe}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" / ") : "No target";
}

function routinePurpose(routine: Routine) {
  const label = `${routine.title} ${routine.folderTitle ?? ""}`.toLowerCase();
  if (/(push|chest|press)/.test(label)) return "Push";
  if (/(pull|back|row)/.test(label)) return "Pull";
  if (/(leg|lower|squat|quad|hamstring|glute)/.test(label)) return "Lower";
  if (/(upper)/.test(label)) return "Upper";
  if (/(arm|delt|shoulder)/.test(label)) return "Arms + delts";
  if (/(full|total)/.test(label)) return "Full body";
  return "Template";
}

function targetTypes(routine: Routine) {
  const types = new Set<string>();
  for (const exercise of routine.exercises) {
    for (const set of exercise.sets) {
      if (set.weightKg != null && set.reps != null) types.add("Load + reps");
      else if (set.reps != null) types.add("Reps");
      else if (set.durationSeconds != null) types.add("Timed");
      else if (set.distanceMeters != null) types.add("Distance");
      else types.add("Open");
    }
  }
  return Array.from(types).slice(0, 3);
}

function dominantRest(routine: Routine) {
  const rests = routine.exercises
    .map((exercise) => exercise.restSeconds)
    .filter((seconds): seconds is number => seconds != null && seconds > 0);
  if (rests.length === 0) return "No rest targets";

  const average = Math.round(rests.reduce((total, seconds) => total + seconds, 0) / rests.length);
  return `Avg rest ${formatDuration(average)}`;
}

function formatUpdated(value: string | null) {
  if (!value) return "No update date";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function RoutineCard({ routine }: { routine: Routine }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hiddenExerciseCount = Math.max(routine.exercises.length - PREVIEW_EXERCISE_COUNT, 0);
  const exercises = isExpanded ? routine.exercises : routine.exercises.slice(0, PREVIEW_EXERCISE_COUNT);
  const targetLabels = targetTypes(routine);
  const averageSets = routine.exerciseCount > 0 ? (routine.setCount / routine.exerciseCount).toFixed(1) : "0";
  const purpose = routinePurpose(routine);
  const showPurpose = purpose.toLowerCase() !== routine.title.toLowerCase();

  return (
    <article className="flex h-full flex-col rounded-md border border-line bg-white shadow-panel">
      <div className="border-b border-line bg-paper px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {showPurpose ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-river/10 px-2 py-1 text-xs font-semibold text-river">
                  <Target size={13} />
                  {purpose}
                </span>
              ) : null}
              {routine.folderTitle ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-1 text-xs font-medium text-slate-600">
                  <Folder size={13} />
                  {routine.folderTitle}
                </span>
              ) : null}
            </div>
            <h3 className="mt-2 truncate text-lg font-semibold text-ink">{routine.title}</h3>
            <p className="mt-1 text-xs text-slate-500">Updated {formatUpdated(routine.updatedAt)}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
            <MiniMetric icon={<Dumbbell size={13} />} label="Exercises" value={routine.exerciseCount} />
            <MiniMetric icon={<Layers3 size={13} />} label="Sets" value={routine.setCount} />
          </div>
        </div>

        {routine.notes ? <p className="mt-3 line-clamp-2 text-sm text-slate-600">{routine.notes}</p> : null}

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <CompositionMetric icon={<ListChecks size={14} />} label="Density" value={`${averageSets} sets / move`} />
          <CompositionMetric icon={<Clock3 size={14} />} label="Rest" value={dominantRest(routine)} />
          <CompositionMetric icon={<Target size={14} />} label="Targets" value={targetLabels.join(", ") || "Open"} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="grid gap-2">
          {exercises.map((exercise) => (
            <div className="rounded-md border border-line px-3 py-2.5" key={`${routine.id}-${exercise.index}-${exercise.title}`}>
              <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-paper text-xs font-bold text-slate-500">
                  {exercise.index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{exercise.title}</p>
                  {exercise.notes ? <p className="mt-1 line-clamp-1 text-xs text-slate-500">{exercise.notes}</p> : null}
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {exercise.restSeconds != null && exercise.restSeconds > 0
                    ? `Rest ${formatDuration(exercise.restSeconds)}`
                    : `${exercise.sets.length} sets`}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {exercise.sets.length > 0 ? (
                  exercise.sets.map((set) => (
                    <span className="rounded bg-paper px-2 py-1 text-xs text-slate-600" key={`${exercise.index}-${set.index}`}>
                      <span className="font-semibold text-slate-400">S{set.index + 1}</span> {formatPlannedSet(set)}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">No planned sets.</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {hiddenExerciseCount > 0 ? (
          <button
            className="focus-ring mt-3 inline-flex w-fit items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium text-slate-700 hover:bg-paper"
            onClick={() => setIsExpanded((value) => !value)}
            type="button"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {isExpanded ? "Show less" : `Show ${hiddenExerciseCount} more`}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function MiniMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <span className="inline-flex min-w-[92px] items-center gap-2 rounded-md border border-line bg-white px-2 py-1.5">
      <span className="text-river">{icon}</span>
      <span>
        <span className="block text-[10px] uppercase text-slate-400">{label}</span>
        <span className="block text-sm font-semibold text-ink">{value}</span>
      </span>
    </span>
  );
}

function CompositionMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-white px-3 py-2">
      <p className="flex items-center gap-1.5 text-xs uppercase text-slate-400">
        <span className="text-river">{icon}</span>
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
