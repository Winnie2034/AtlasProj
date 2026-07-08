import { CalendarDays } from "lucide-react";
import type { TrainingDay } from "../../types/api";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const intensityClass = (setCount: number) => {
  if (setCount >= 24) return "bg-moss";
  if (setCount >= 16) return "bg-river";
  if (setCount >= 8) return "bg-teal-500";
  if (setCount > 0) return "bg-teal-200";
  return "bg-paper";
};

const textClass = (setCount: number) => (setCount >= 8 ? "text-white" : "text-ink");

const formatDay = (date: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));

const dayNumber = (date: string) => new Date(`${date}T00:00:00`).getDate();

const currentWeek = (days: TrainingDay[]) => days.slice(-7);

const weekRange = (week: TrainingDay[]) => {
  const first = week[0];
  const last = week[week.length - 1];
  if (!first || !last) return "Current week";
  return `${formatDay(first.date)} - ${formatDay(last.date)}`;
};

export function CurrentWeekHeatmap({ days }: { days: TrainingDay[] }) {
  const week = currentWeek(days);
  const activeDays = week.filter((day) => day.workoutCount > 0).length;
  const totalSets = week.reduce((total, day) => total + day.setCount, 0);

  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Current Week</h3>
          <p className="text-sm text-slate-500">{weekRange(week)}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-moss text-white">
          <CalendarDays size={18} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[44px_minmax(0,1fr)] gap-2">
        <div className="grid grid-rows-7 gap-2">
          {weekdayLabels.map((label) => (
            <div className="flex h-11 items-center text-xs font-medium text-slate-500" key={label}>
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-rows-7 gap-2">
          {week.map((day) => (
            <div
              aria-label={`${formatDay(day.date)}: ${day.setCount} sets`}
              className={`flex h-11 items-center justify-between rounded border border-line px-3 py-1 ${intensityClass(
                day.setCount,
              )} ${textClass(day.setCount)}`}
              key={day.date}
              title={`${formatDay(day.date)}: ${day.workoutCount} workout, ${day.setCount} sets`}
            >
              <span className="text-xs font-semibold">{dayNumber(day.date)}</span>
              <span className="text-[11px] opacity-80">{day.setCount > 0 ? `${day.setCount} sets` : "-"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-4 border-t border-line pt-3 text-xs text-slate-500">
        <div className="space-y-2">
          <p>Volume</p>
          <div className="flex gap-1">
            {[0, 4, 12, 20, 28].map((sets) => (
              <span className={`h-3 w-5 rounded-sm border border-line ${intensityClass(sets)}`} key={sets} />
            ))}
          </div>
        </div>
        <div className="space-y-1 text-right">
          <span>{activeDays} active days</span>
          <p>{totalSets} sets this week</p>
        </div>
      </div>
    </section>
  );
}
