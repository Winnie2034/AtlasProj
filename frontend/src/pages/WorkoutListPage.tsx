import {
  ArrowRight,
  CalendarDays,
  Clock,
  Dumbbell,
  Filter,
  Layers3,
  ListChecks,
  Search,
  SlidersHorizontal,
  Target,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  const [coachCardHeight, setCoachCardHeight] = useState<number | null>(null);

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
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
          <WorkoutExplorerList
            activeWorkoutId={activeWorkoutId}
            onSelect={setSelectedWorkoutId}
            panelHeight={coachCardHeight}
            workouts={workoutItems}
          />
          <WorkoutPreview onHeightChange={setCoachCardHeight} query={selectedWorkout} />
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
  panelHeight,
  onSelect,
}: {
  workouts: WorkoutSummary[];
  activeWorkoutId: string;
  panelHeight: number | null;
  onSelect: (id: string) => void;
}) {
  const groups = workouts.reduce<Record<string, WorkoutSummary[]>>((items, workout) => {
    const key = dateGroupLabel(workout.startTime);
    items[key] = [...(items[key] ?? []), workout];
    return items;
  }, {});

  return (
    <section
      className="self-start rounded-md border border-line bg-white shadow-panel lg:flex lg:h-[var(--history-panel-height)] lg:flex-col"
      style={panelHeight ? ({ "--history-panel-height": `${panelHeight}px` } as React.CSSProperties) : undefined}
    >
      <div className="border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">Workout history</h3>
        <p className="mt-1 text-xs text-slate-500">Select a session to preview it.</p>
      </div>
      <div className="max-h-[720px] overflow-y-auto p-3 lg:max-h-none lg:flex-1">
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

function WorkoutPreview({
  query,
  onHeightChange,
}: {
  query: ReturnType<typeof useWorkoutDetail>;
  onHeightChange: (height: number | null) => void;
}) {
  const previewRef = useRef<HTMLElement | null>(null);
  const measuredWorkoutId = query.data?.data?.id;

  useLayoutEffect(() => {
    const element = previewRef.current;
    if (!element) {
      onHeightChange(null);
      return;
    }

    const updateHeight = () => {
      onHeightChange(Math.ceil(element.getBoundingClientRect().height));
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
      onHeightChange(null);
    };
  }, [measuredWorkoutId, onHeightChange]);

  if (query.isLoading) return <LoadingState label="Loading workout preview" />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  if (!query.data?.data) return <EmptyState title="Select a workout" detail="Choose a session from the list to preview it." />;

  const workout = query.data.data;
  const focus = toMuscleFocusPercentages(workout.muscleFocus ?? [])
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);
  const lifts = workout.topLifts;

  return (
    <section className="self-start overflow-hidden rounded-md border border-line bg-white shadow-panel" ref={previewRef}>
      <div className="border-b border-line bg-paper px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-river">Coach card</p>
            <h3 className="mt-1 text-2xl font-semibold leading-tight text-ink">{workout.title}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {dateGroupLabel(workout.startTime)} - {workout.durationMinutes} min
            </p>
          </div>
          <Link
            className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-paper"
            to={`/workouts/${workout.id}`}
          >
            Details
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <CoachMetric icon={Clock} label="Duration" value={`${workout.durationMinutes} min`} />
          <CoachMetric icon={Layers3} label="Training volume" value={`${workout.setCount} sets`} />
          <CoachMetric icon={ListChecks} label="Movements" value={workout.exerciseCount} />
        </div>
      </div>

      <div className="grid gap-4 p-5">
        <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)]">
          <MuscleFocusCoach focus={focus} />
          <TopLiftsCoach lifts={lifts} />
        </div>

        <section className="rounded-md border border-line">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <PanelHeading icon={ListChecks} label="Exercise Preview" />
            <span className="text-xs font-medium text-slate-400">{workout.exercises.length} exercises</span>
          </div>
          <div className="grid gap-2 p-3">
            {workout.exercises.slice(0, 6).map((exercise, index) => (
              <ExercisePreviewRow exercise={exercise} index={index} key={exercise.id} />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function CoachMetric({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-river/10 text-river">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs uppercase text-slate-400">{label}</span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-ink">{value}</span>
      </span>
    </div>
  );
}

function MuscleFocusCoach({ focus }: { focus: { muscleGroup: string; percent: number }[] }) {
  return (
    <section className="flex h-full flex-col rounded-md border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <PanelHeading icon={Target} label="Muscle Focus" />
      </div>

      {focus.length ? (
        <div className="mt-4 flex flex-1 flex-col gap-2">
          <div className="flex flex-1 flex-col gap-2">
            {focus.map((group) => (
              <div
                className={`flex flex-1 items-center justify-between gap-3 rounded-full px-4 py-3 ${MUSCLE_COLORS[group.muscleGroup] ?? "bg-slate-100 text-slate-600"}`}
                key={group.muscleGroup}
              >
                <span className="truncate text-sm font-semibold">{group.muscleGroup}</span>
                <span className="text-xl font-semibold text-ink">{group.percent}%</span>
              </div>
            ))}
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-paper">
            {focus.map((group) => (
              <div
                className={muscleBarColor(group.muscleGroup)}
                key={group.muscleGroup}
                style={{ width: `${Math.max(group.percent, 6)}%` }}
                title={`${group.muscleGroup}: ${group.percent}%`}
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 flex flex-1 items-center rounded-md bg-paper px-3 py-2 text-sm text-slate-500">No muscle focus available yet.</p>
      )}
    </section>
  );
}

function TopLiftsCoach({ lifts }: { lifts: { exerciseTitle: string; highlight: string }[] }) {
  return (
    <section className="rounded-md border border-line p-4">
      <PanelHeading icon={Trophy} label="Top Lifts" />
      <div className="mt-3 grid gap-2">
        {lifts.length ? (
          lifts.map((lift, index) => <TopLiftRow index={index} lift={lift} key={lift.exerciseTitle} />)
        ) : (
          <p className="rounded-md bg-paper px-3 py-2.5 text-sm text-slate-500">No top lifts available yet.</p>
        )}
      </div>
    </section>
  );
}

function TopLiftRow({
  index,
  lift,
}: {
  index: number;
  lift: { exerciseTitle: string; highlight: string };
}) {
  const rankStyles = [
    "border-amber-200 bg-amber-50 text-amber-700",
    "border-slate-200 bg-slate-50 text-slate-600",
    "border-orange-200 bg-orange-50 text-orange-700",
  ];

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md bg-paper px-3 py-2.5">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs font-bold ${rankStyles[index] ?? "border-line bg-white text-slate-600"}`}
      >
        {index + 1}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-ink">{lift.exerciseTitle}</span>
        <span className="mt-0.5 block text-sm font-medium text-river">{lift.highlight}</span>
      </span>
    </div>
  );
}

function muscleBarColor(group: string) {
  if (group === "Back") return "bg-indigo-500";
  if (group === "Chest") return "bg-teal-500";
  if (group === "Legs") return "bg-emerald-500";
  if (group === "Shoulders") return "bg-amber-500";
  if (group === "Arms") return "bg-rose-500";
  return "bg-slate-400";
}

function PanelHeading({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <h4 className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-paper text-river">
        <Icon size={15} />
      </span>
      {label}
    </h4>
  );
}

function bestSetForExercise(exercise: ExerciseDetail) {
  return exercise.sets.reduce<SetDetail | null>((best, set) => {
    if (!best) return set;
    return setScore(set) > setScore(best) ? set : best;
  }, null);
}

function ExercisePreviewRow({ exercise, index }: { exercise: ExerciseDetail; index: number }) {
  const totalVolume = exercise.sets.reduce((total, set) => total + (set.weightKg ?? 0) * (set.reps ?? 0), 0);
  const bestSet = bestSetForExercise(exercise);
  const primaryMuscle = exercise.muscleGroups[0];
  const hiddenMuscleCount = Math.max(exercise.muscleGroups.length - 1, 0);

  return (
    <div className="rounded-md border border-line bg-white px-3 py-2.5">
      <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_minmax(220px,0.65fr)] md:items-center">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-paper text-xs font-bold text-slate-500">{index + 1}</span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 text-sm font-semibold leading-snug text-ink">{exercise.title}</p>
            {primaryMuscle ? (
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${MUSCLE_COLORS[primaryMuscle] ?? "bg-paper text-slate-600"}`}>
                {primaryMuscle}
                {hiddenMuscleCount ? ` +${hiddenMuscleCount}` : ""}
              </span>
            ) : null}
          </div>
          {exercise.notes ? <p className="mt-1 line-clamp-1 text-xs text-slate-500">{exercise.notes}</p> : null}
        </div>
        <div className="grid grid-cols-3 gap-2 text-right">
          <GlanceMetric label="Sets" value={exercise.sets.length} />
          <GlanceMetric label="Best" value={bestSet ? setHighlight(bestSet) : "-"} strong />
          <GlanceMetric label="Volume" value={totalVolume ? `${Math.round(totalVolume)} kg` : "-"} />
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1">
        {exercise.sets.map((set) => (
          <span className="inline-flex items-center rounded bg-paper px-2 py-1 text-xs text-slate-600" key={set.id}>
            <span className="mr-1.5 font-semibold text-slate-400">S{set.index + 1}</span>
            {setHighlight(set)}
          </span>
        ))}
      </div>
    </div>
  );
}

function GlanceMetric({ label, value, strong = false }: { label: string; value: string | number; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase text-slate-400">{label}</p>
      <p className={`mt-0.5 truncate text-xs ${strong ? "font-semibold text-ink" : "font-medium text-slate-600"}`}>{value}</p>
    </div>
  );
}
