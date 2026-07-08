import { ArrowRight, Dumbbell } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSelectedWorkout } from "../../api/dashboard.api";
import type { TodayWorkout, WorkoutSummary } from "../../types/api";
import { formatDate, formatDateTime, relativeTime } from "../../utils/format";
import { toMuscleFocusPercentages } from "../../utils/muscleFocus";

const FOCUS_COLORS: Record<string, string> = {
  Chest: "bg-teal-600",
  Back: "bg-indigo-600",
  Legs: "bg-emerald-600",
  Shoulders: "bg-amber-500",
  Arms: "bg-rose-500",
  Core: "bg-slate-500",
};

export function TodayWorkoutCard({
  initialWorkout,
  lastWorkout,
  currentStreakDays,
  initialSelectedDate,
  maxDate,
}: {
  initialWorkout: TodayWorkout | null;
  lastWorkout: WorkoutSummary | undefined;
  currentStreakDays: number;
  initialSelectedDate: string;
  maxDate: string;
}) {
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [selectedWorkout, setSelectedWorkout] = useState<TodayWorkout | null>(initialWorkout);
  const [isSelectedDateLoading, setIsSelectedDateLoading] = useState(false);
  const isToday = selectedDate === maxDate;
  const titlePrefix = isToday ? "Today's Workout" : "Selected Workout";

  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      setIsSelectedDateLoading(false);
      return;
    }

    if (selectedDate === initialSelectedDate) {
      setSelectedWorkout(initialWorkout);
      setIsSelectedDateLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsSelectedDateLoading(true);
    fetchSelectedWorkout(selectedDate, controller.signal)
      .then((response) => {
        setSelectedWorkout(response.data.selectedWorkout);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSelectedWorkout(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsSelectedDateLoading(false);
        }
      });

    return () => controller.abort();
  }, [initialSelectedDate, initialWorkout, selectedDate]);

  if (!selectedWorkout) {
    return (
      <TodayWorkoutEmpty
        currentStreakDays={currentStreakDays}
        isToday={isToday}
        isLoading={isSelectedDateLoading}
        lastWorkout={lastWorkout}
        maxDate={maxDate}
        onSelectedDateChange={setSelectedDate}
        selectedDate={selectedDate}
      />
    );
  }

  const muscleFocus = toMuscleFocusPercentages(selectedWorkout.muscleFocus);

  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{titlePrefix}</p>
          <h3 className="text-xl font-semibold text-ink">{selectedWorkout.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{formatDateTime(selectedWorkout.startTime)}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <DatePicker
            isLoading={isSelectedDateLoading}
            maxDate={maxDate}
            onChange={setSelectedDate}
            selectedDate={selectedDate}
          />
          <Link
            className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium text-slate-700 hover:bg-paper"
            to={`/workouts/${selectedWorkout.id}`}
          >
            Details
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Duration" value={`${selectedWorkout.durationMinutes} min`} />
        <Metric label="Volume" value={`${selectedWorkout.setCount} sets`} />
        <Metric label="Exercises" value={selectedWorkout.exerciseCount} />
      </div>

      <div className="mt-4 rounded-md border border-line p-4">
        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.82fr)]">
          <div className="flex min-h-[150px] flex-col">
            <h4 className="text-sm font-semibold text-ink">Muscle Focus</h4>
            <div className="mt-3 grid flex-1 auto-rows-fr gap-2">
              {muscleFocus.length > 0 ? (
                muscleFocus.map((group) => (
                  <div
                    className="grid grid-cols-[92px_minmax(0,1fr)_54px] items-center gap-3 rounded-md bg-paper px-3"
                    key={group.muscleGroup}
                  >
                    <span className="truncate text-sm text-slate-600">{group.muscleGroup}</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white">
                      <div
                        className={`h-full rounded-full ${FOCUS_COLORS[group.muscleGroup] ?? "bg-slate-400"}`}
                        style={{ width: `${Math.max(group.percent, 8)}%` }}
                      />
                    </div>
                    <span className="text-right text-sm font-semibold text-ink">{group.percent}%</span>
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
              {selectedWorkout.topLifts.length > 0 ? (
                selectedWorkout.topLifts.map((lift) => (
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
  selectedDate,
  maxDate,
  isToday,
  isLoading,
  onSelectedDateChange,
}: {
  lastWorkout: WorkoutSummary | undefined;
  currentStreakDays: number;
  selectedDate: string;
  maxDate: string;
  isToday: boolean;
  isLoading: boolean;
  onSelectedDateChange: (date: string) => void;
}) {
  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{isToday ? "Today's Workout" : "Selected Workout"}</p>
          <h3 className="text-xl font-semibold text-ink">
            {isLoading
              ? `Checking ${formatDate(selectedDate)}`
              : isToday
                ? "No workout logged today"
                : `No workout logged on ${formatDate(selectedDate)}`}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {isLoading
              ? "Looking through synced workout history."
              : isToday
              ? "Sync after training and this panel will update automatically."
              : "This looks like a rest day or a workout that has not been synced yet."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <DatePicker
            isLoading={isLoading}
            maxDate={maxDate}
            onChange={onSelectedDateChange}
            selectedDate={selectedDate}
          />
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-paper text-slate-500">
            <Dumbbell size={18} />
          </div>
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

function DatePicker({
  selectedDate,
  maxDate,
  isLoading = false,
  onChange,
}: {
  selectedDate: string;
  maxDate: string;
  isLoading?: boolean;
  onChange: (date: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        aria-label="Workout date"
        className="focus-ring h-10 rounded-md border border-line bg-white px-3 text-sm font-medium text-slate-700"
        max={maxDate}
        onChange={(event) => {
          if (event.target.value) {
            onChange(event.target.value);
          }
        }}
        type="date"
        value={selectedDate}
      />
      {isLoading ? <span className="text-xs font-medium text-slate-400">Loading</span> : null}
    </div>
  );
}
