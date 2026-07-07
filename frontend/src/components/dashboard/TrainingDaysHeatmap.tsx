import { CalendarDays } from "lucide-react";
import type { TrainingDay } from "../../types/api";

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

const weekRange = (week: TrainingDay[]) => {
  const first = week[0];
  const last = week[week.length - 1];
  if (!first || !last) return "";
  return `${formatDay(first.date)} - ${formatDay(last.date)}`;
};

const chunkWeeks = (days: TrainingDay[]) =>
  Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => days.slice(index * 7, index * 7 + 7));

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function TrainingDaysHeatmap({ days }: { days: TrainingDay[] }) {
  const trainedDays = days.filter((day) => day.workoutCount > 0).length;
  const weeks = chunkWeeks(days);

  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Training Days</h3>
          <p className="text-sm text-slate-500">{trainedDays} active days in the last 5 weeks</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-moss text-white">
          <CalendarDays size={18} />
        </div>
      </div>

      <div className="mt-5 overflow-x-auto pb-1">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[64px_repeat(5,minmax(0,1fr))] gap-2">
            <div />
            {weeks.map((week) => (
              <p className="text-center text-xs font-medium text-slate-500" key={week[0]?.date ?? weekRange(week)}>
                {weekRange(week)}
              </p>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-[64px_repeat(5,minmax(0,1fr))] gap-2">
            <div className="grid grid-rows-7 gap-2">
              {weekdayLabels.map((label) => (
                <div className="flex h-11 items-center text-xs font-medium text-slate-500" key={label}>
                  {label}
                </div>
              ))}
            </div>

            {weeks.map((week) => (
              <div className="grid grid-rows-7 gap-2" key={week[0]?.date ?? weekRange(week)}>
                {week.map((day) => (
                  <div
                    aria-label={`${formatDay(day.date)}: ${day.setCount} sets`}
                    className={`flex h-11 flex-col justify-between rounded border border-line px-2 py-1 ${intensityClass(
                      day.setCount,
                    )} ${textClass(day.setCount)}`}
                    key={day.date}
                    title={`${formatDay(day.date)}: ${day.workoutCount} workout, ${day.setCount} sets`}
                  >
                    <span className="text-xs font-semibold leading-none">{dayNumber(day.date)}</span>
                    <span className="text-[11px] leading-none opacity-80">{day.setCount > 0 ? `${day.setCount} sets` : "-"}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Volume</span>
          <div className="flex gap-1">
            {[0, 4, 12, 20, 28].map((sets) => (
              <span className={`h-3 w-6 rounded-sm border border-line ${intensityClass(sets)}`} key={sets} />
            ))}
          </div>
        </div>
        <span>{days.reduce((total, day) => total + day.setCount, 0)} sets across this period</span>
      </div>
    </section>
  );
}
