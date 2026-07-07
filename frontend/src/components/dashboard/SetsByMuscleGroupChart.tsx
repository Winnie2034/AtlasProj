import type { WeeklyMuscleGroupVolume } from "../../types/api";

const GROUP_COLORS: Record<string, string> = {
  Chest: "bg-teal-600",
  Back: "bg-indigo-600",
  Legs: "bg-emerald-600",
  Shoulders: "bg-amber-500",
  Arms: "bg-rose-500",
  Core: "bg-slate-500",
  Other: "bg-slate-300",
};

const GROUP_LABELS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Other"];

export function SetsByMuscleGroupChart({ weeks }: { weeks: WeeklyMuscleGroupVolume[] }) {
  const maxSets = Math.max(...weeks.map((week) => week.totalSets), 1);

  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Sets per Muscle Group per Week</h3>
          <p className="text-sm text-slate-500">Last 8 weeks of training volume</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {GROUP_LABELS.map((group) => (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-600" key={group}>
              <span className={`h-2.5 w-2.5 rounded-sm ${GROUP_COLORS[group]}`} />
              {group}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid min-h-60 grid-cols-8 items-end gap-3">
        {weeks.map((week) => (
          <div className="flex min-w-0 flex-col items-center gap-2" key={week.weekStart}>
            <div className="flex h-40 w-full max-w-12 items-end rounded bg-paper px-1 py-1">
              <div
                aria-label={`${week.totalSets} sets during ${week.label}`}
                className="flex w-full flex-col-reverse overflow-hidden rounded-sm"
                style={{ height: `${Math.max((week.totalSets / maxSets) * 100, week.totalSets > 0 ? 4 : 0)}%` }}
                title={`${week.label}: ${week.totalSets} sets`}
              >
                {week.muscleGroups
                  .filter((group) => group.setCount > 0)
                  .map((group) => (
                    <div
                      className={GROUP_COLORS[group.muscleGroup] ?? GROUP_COLORS.Other}
                      key={group.muscleGroup}
                      style={{ height: `${(group.setCount / week.totalSets) * 100}%` }}
                      title={`${group.muscleGroup}: ${group.setCount} sets`}
                    />
                  ))}
              </div>
            </div>
            <div className="min-h-10 text-center">
              <p className="text-xs font-semibold text-ink">{week.totalSets}</p>
              <p className="text-[11px] leading-tight text-slate-500">{week.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
