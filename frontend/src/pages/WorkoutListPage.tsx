import { ArrowRight, CalendarDays, Clock, Dumbbell, Filter, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { WorkoutSortControl, type SortValue } from "../components/workouts/WorkoutSortControl";
import { useWorkoutDetail, useWorkouts } from "../hooks/useWorkouts";
import type { ExerciseDetail, SetDetail, WorkoutDetail, WorkoutSummary } from "../types/api";
import { formatDateTime } from "../utils/format";
import { toMuscleFocusPercentages } from "../utils/muscleFocus";

type DateRangeValue = "all" | "30" | "month" | "year";
type MuscleFilterValue = "all" | "back" | "chest" | "legs" | "shoulders" | "arms" | "core";

const MUSCLE_COLORS: Record<string, string> = {
  Back: "bg-indigo-50 text-indigo-700",
  Chest: "bg-teal-50 text-teal-700",
  Legs: "bg-emerald-50 text-emerald-700",
  Shoulders: "bg-amber-50 text-amber-700",
  Arms: "bg-rose-50 text-rose-700",
  Core: "bg-slate-100 text-slate-700",
};

const dateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const dateRangeParams = (range: DateRangeValue) => {
  const today = new Date();
  const endDate = dateInputValue(addDays(today, 1));
  if (range === "30") return { startDate: dateInputValue(addDays(today, -29)), endDate };
  if (range === "month") return { startDate: dateInputValue(new Date(today.getFullYear(), today.getMonth(), 1)), endDate };
  if (range === "year") return { startDate: dateInputValue(new Date(today.getFullYear(), 0, 1)), endDate };
  return {};
};

const dateGroupLabel = (value: string) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

const setHighlight = (set: SetDetail) => {
  if (set.weightKg != null && set.reps != null) return `${set.weightKg} kg x ${set.reps}`;
  if (set.reps != null) return `${set.reps} reps`;
  if (set.distanceMeters != null) return `${set.distanceMeters} m`;
  if (set.durationSeconds != null) return `${Math.round(set.durationSeconds / 60)} min`;
  if (set.rpe != null) return `RPE ${set.rpe}`;
  return `${set.type} set`;
};

const setScore = (set: SetDetail) => {
  const weight = set.weightKg ?? 0;
  const reps = set.reps ?? 1;
  const distance = set.distanceMeters ? set.distanceMeters / 100 : 0;
  const duration = set.durationSeconds ? set.durationSeconds / 60 : 0;
  return weight * reps || reps || distance || duration;
};

const muscleFocus = (workout: WorkoutDetail) => {
  const counts = new Map<string, number>();
  for (const exercise of workout.exercises) {
    for (const group of exercise.muscleGroups) {
      counts.set(group, (counts.get(group) ?? 0) + exercise.sets.length);
    }
  }
  const focusCounts = Array.from(counts.entries()).map(([muscleGroup, setCount]) => ({ muscleGroup, setCount }));
  return toMuscleFocusPercentages(focusCounts)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);
};

const topLifts = (workout: WorkoutDetail) =>
  workout.exercises
    .map((exercise) => {
      const bestSet = exercise.sets.reduce((best, set) => (setScore(set) > setScore(best) ? set : best), exercise.sets[0]);
      return bestSet ? { exerciseTitle: exercise.title, highlight: setHighlight(bestSet), score: setScore(bestSet) } : null;
    })
    .filter((lift): lift is { exerciseTitle: string; highlight: string; score: number } => lift != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

export function WorkoutListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const sort = (searchParams.get("sort") as SortValue) ?? "newest";
  const range = (searchParams.get("range") as DateRangeValue) ?? "all";
  const muscle = (searchParams.get("muscle") as MuscleFilterValue) ?? "all";

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (search) next.set("search", search);
          else next.delete("search");
          next.delete("page");
          return next;
        },
        { replace: true },
      );
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search, setSearchParams]);

  const persistedSearch = searchParams.get("search") ?? undefined;
  const params = useMemo(
    () => ({
      search: persistedSearch,
      ...dateRangeParams(range),
      muscleGroup: muscle === "all" ? undefined : muscle,
      sortBy: sort === "title" ? ("title" as const) : ("startTime" as const),
      sortDir: sort === "oldest" || sort === "title" ? ("asc" as const) : ("desc" as const),
      page: 1,
      pageSize: 12,
    }),
    [muscle, persistedSearch, range, sort],
  );
  const workouts = useWorkouts(params);
  const workoutItems = workouts.data?.data ?? [];
  const activeWorkoutId = selectedWorkoutId ?? workoutItems[0]?.id ?? "";
  const selectedWorkout = useWorkoutDetail(activeWorkoutId);

  useEffect(() => {
    if (!workoutItems.length) {
      setSelectedWorkoutId(null);
      return;
    }
    if (!activeWorkoutId || !workoutItems.some((workout) => workout.id === activeWorkoutId)) {
      setSelectedWorkoutId(workoutItems[0].id);
    }
  }, [activeWorkoutId, workoutItems]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if ((key === "range" && value === "all") || (key === "muscle" && value === "all") || (key === "sort" && value === "newest")) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.delete("page");
    setSearchParams(next);
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Training log</p>
          <h2 className="text-2xl font-semibold text-ink">Workouts</h2>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm text-slate-600 shadow-panel">
          <Dumbbell size={16} />
          {workouts.data?.meta?.total ?? 0} synced sessions
        </div>
      </div>

      <section className="rounded-md border border-line bg-white p-3 shadow-panel">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_170px_160px]">
          <label className="relative block min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="focus-ring h-10 w-full rounded-md border border-line bg-paper py-2 pl-10 pr-3"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search workouts"
              type="search"
              value={search}
            />
          </label>
          <FilterSelect
            icon={<CalendarDays size={16} />}
            label="Date range"
            onChange={(value) => updateParam("range", value)}
            value={range}
            values={[
              ["all", "All time"],
              ["30", "Last 30 days"],
              ["month", "This month"],
              ["year", "This year"],
            ]}
          />
          <FilterSelect
            icon={<Filter size={16} />}
            label="Muscle"
            onChange={(value) => updateParam("muscle", value)}
            value={muscle}
            values={[
              ["all", "All muscles"],
              ["back", "Back"],
              ["chest", "Chest"],
              ["legs", "Legs"],
              ["shoulders", "Shoulders"],
              ["arms", "Arms"],
              ["core", "Core"],
            ]}
          />
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <WorkoutSortControl onChange={(value) => updateParam("sort", value)} value={sort} />
          </div>
        </div>
      </section>

      {workouts.isLoading ? <LoadingState label="Loading workouts" /> : null}
      {workouts.isError ? <ErrorState message={workouts.error.message} onRetry={() => workouts.refetch()} /> : null}
      {workouts.data && workoutItems.length === 0 ? (
        <EmptyState title="No workouts found" detail={params.search ? "Try a different search or filter." : "Run a sync to import workouts."} />
      ) : null}
      {workouts.data && workoutItems.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
          <WorkoutExplorerList activeWorkoutId={activeWorkoutId} onSelect={setSelectedWorkoutId} workouts={workoutItems} />
          <WorkoutPreview query={selectedWorkout} />
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({
  icon,
  label,
  value,
  values,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  values: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      <select
        aria-label={label}
        className="focus-ring h-10 w-full rounded-md border border-line bg-paper py-2 pl-9 pr-3 text-sm text-slate-700"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {values.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function WorkoutExplorerList({
  workouts,
  activeWorkoutId,
  onSelect,
}: {
  workouts: WorkoutSummary[];
  activeWorkoutId: string;
  onSelect: (id: string) => void;
}) {
  const groups = workouts.reduce<Record<string, WorkoutSummary[]>>((items, workout) => {
    const key = dateGroupLabel(workout.startTime);
    items[key] = [...(items[key] ?? []), workout];
    return items;
  }, {});

  return (
    <section className="rounded-md border border-line bg-white shadow-panel">
      <div className="border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">Workout history</h3>
        <p className="mt-1 text-xs text-slate-500">Select a session to preview it.</p>
      </div>
      <div className="max-h-[720px] overflow-y-auto p-3">
        {Object.entries(groups).map(([label, group]) => (
          <div className="mb-4 last:mb-0" key={label}>
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
              <p className="text-xs text-slate-400">{group.reduce((count, workout) => count + workout.setCount, 0)} sets</p>
            </div>
            <div className="grid gap-2">
              {group.map((workout) => (
                <button
                  className={`focus-ring grid w-full gap-3 rounded-md border p-3 text-left transition ${
                    workout.id === activeWorkoutId
                      ? "border-river bg-river/5 shadow-panel"
                      : "border-line bg-white hover:border-river/40 hover:bg-paper"
                  }`}
                  key={workout.id}
                  onClick={() => onSelect(workout.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{workout.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(workout.startTime)}</p>
                    </div>
                    <ArrowRight className={workout.id === activeWorkoutId ? "text-river" : "text-slate-300"} size={16} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <MiniMetric icon={<Clock size={13} />} value={`${workout.durationMinutes} min`} />
                    <MiniMetric icon={<Dumbbell size={13} />} value={`${workout.setCount} sets`} />
                    <MiniMetric icon={<Filter size={13} />} value={`${workout.exerciseCount} exercises`} />
                  </div>
                  <MuscleChips groups={workout.muscleGroups} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniMetric({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1 rounded bg-paper px-2 py-1 text-slate-600">
      {icon}
      <span className="truncate">{value}</span>
    </span>
  );
}

function MuscleChips({ groups }: { groups: string[] }) {
  if (!groups.length) return <span className="text-xs text-slate-400">No muscle tags</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {groups.map((group) => (
        <span className={`rounded px-2 py-1 text-xs font-semibold ${MUSCLE_COLORS[group] ?? "bg-slate-100 text-slate-600"}`} key={group}>
          {group}
        </span>
      ))}
    </div>
  );
}

function WorkoutPreview({ query }: { query: ReturnType<typeof useWorkoutDetail> }) {
  if (query.isLoading) return <LoadingState label="Loading workout preview" />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  if (!query.data?.data) return <EmptyState title="Select a workout" detail="Choose a session from the list to preview it." />;

  const workout = query.data.data;
  const focus = muscleFocus(workout);
  const lifts = topLifts(workout);

  return (
    <section className="rounded-md border border-line bg-white shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="text-sm text-slate-500">Selected workout</p>
          <h3 className="text-2xl font-semibold text-ink">{workout.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {dateGroupLabel(workout.startTime)} - {workout.durationMinutes} min
          </p>
        </div>
        <Link
          className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium text-slate-700 hover:bg-paper"
          to={`/workouts/${workout.id}`}
        >
          Details
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-4 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <PreviewMetric label="Duration" value={`${workout.durationMinutes} min`} />
          <PreviewMetric label="Volume" value={`${workout.setCount} sets`} />
          <PreviewMetric label="Exercises" value={workout.exerciseCount} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(240px,0.9fr)_minmax(320px,1.1fr)]">
          <section className="rounded-md border border-line p-4">
            <h4 className="text-sm font-semibold text-ink">Muscle Focus</h4>
            <div className="mt-3 grid gap-2">
              {focus.length ? (
                focus.map((group) => (
                  <div className="grid grid-cols-[88px_minmax(0,1fr)_44px] items-center gap-3 rounded-md bg-paper px-3 py-2" key={group.muscleGroup}>
                    <span className="truncate text-sm text-slate-600">{group.muscleGroup}</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white">
                      <div
                        className={`h-full rounded-full ${group.muscleGroup === "Legs" ? "bg-emerald-600" : group.muscleGroup === "Back" ? "bg-indigo-600" : "bg-teal-600"}`}
                        style={{ width: `${Math.max(group.percent, 8)}%` }}
                      />
                    </div>
                    <span className="text-right text-sm font-semibold text-ink">{group.percent}%</span>
                  </div>
                ))
              ) : (
                <p className="rounded-md bg-paper px-3 py-2 text-sm text-slate-500">No muscle focus available yet.</p>
              )}
            </div>
          </section>

          <section className="rounded-md border border-line p-4">
            <h4 className="text-sm font-semibold text-ink">Top Lifts</h4>
            <div className="mt-3 divide-y divide-line rounded-md border border-line">
              {lifts.length ? (
                <>
                  <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3 px-3 py-2 text-xs uppercase text-slate-400">
                    <span>Exercise</span>
                    <span className="text-right">Best set</span>
                  </div>
                  {lifts.map((lift) => (
                    <div className="grid min-h-12 grid-cols-[minmax(0,1fr)_120px] items-center gap-3 px-3 py-2.5" key={lift.exerciseTitle}>
                      <span className="min-w-0 text-sm font-medium leading-snug text-slate-700">{lift.exerciseTitle}</span>
                      <span className="text-right text-sm font-semibold text-ink">{lift.highlight}</span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="px-3 py-2.5 text-sm text-slate-500">No top lifts available yet.</p>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-md border border-line">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h4 className="text-sm font-semibold text-ink">Exercise preview</h4>
            <span className="text-xs text-slate-400">{workout.exercises.length} exercises</span>
          </div>
          <div className="hidden grid-cols-[minmax(0,1fr)_56px_minmax(96px,0.8fr)_minmax(140px,1fr)_92px] gap-3 border-b border-line px-4 py-2 text-xs uppercase text-slate-400 md:grid">
            <span>Exercise</span>
            <span className="text-right">Sets</span>
            <span className="text-right">Reps</span>
            <span className="text-right">Weights</span>
            <span className="text-right">Volume</span>
          </div>
          <div className="divide-y divide-line">
            {workout.exercises.slice(0, 6).map((exercise) => (
              <ExercisePreviewRow exercise={exercise} key={exercise.id} />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-line bg-paper px-3 py-2">
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function ExercisePreviewRow({ exercise }: { exercise: ExerciseDetail }) {
  const repsBySet = exercise.sets.map((set) => set.reps ?? "-").join(", ");
  const weightsBySet = exercise.sets.map((set) => (set.weightKg == null ? "-" : String(set.weightKg))).join(", ");
  const totalVolume = exercise.sets.reduce((total, set) => total + (set.weightKg ?? 0) * (set.reps ?? 0), 0);
  return (
    <div className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_56px_minmax(96px,0.8fr)_minmax(140px,1fr)_92px] md:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{exercise.title}</p>
        {exercise.notes ? <p className="mt-1 truncate text-xs text-slate-500">{exercise.notes}</p> : null}
      </div>
      <MetricCell label="Sets" value={exercise.sets.length} />
      <MetricCell label="Reps" value={repsBySet || "-"} />
      <MetricCell label="Weights" value={weightsBySet || "-"} />
      <MetricCell label="Volume" value={totalVolume ? `${Math.round(totalVolume)} kg` : "-"} strong />
    </div>
  );
}

function MetricCell({ label, value, strong = false }: { label: string; value: string | number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 md:block md:text-right">
      <span className="text-xs uppercase text-slate-400 md:hidden">{label}</span>
      <span className={`text-sm ${strong ? "font-semibold text-ink" : "text-slate-600"}`}>{value}</span>
    </div>
  );
}
