import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { WeeklyMuscleGroupVolume } from "../../types/api";

const RADAR_GROUPS = ["Back", "Chest", "Shoulders", "Arms", "Legs"] as const;
const CENTER = 180;
const RADIUS = 118;
const RINGS = [20, 40, 60, 80, 100];

type RadarGroup = (typeof RADAR_GROUPS)[number];

const GROUP_STYLES: Record<RadarGroup, string> = {
  Back: "bg-indigo-600",
  Chest: "bg-teal-600",
  Shoulders: "bg-amber-500",
  Arms: "bg-rose-500",
  Legs: "bg-emerald-600",
};

const polarPoint = (index: number, value: number) => {
  const angle = (-90 + index * (360 / RADAR_GROUPS.length)) * (Math.PI / 180);
  const distance = (Math.max(0, Math.min(value, 100)) / 100) * RADIUS;
  return {
    x: CENTER + Math.cos(angle) * distance,
    y: CENTER + Math.sin(angle) * distance,
  };
};

const pointsForValue = (value: number) =>
  RADAR_GROUPS.map((_, index) => {
    const point = polarPoint(index, value);
    return `${point.x},${point.y}`;
  }).join(" ");

const axisEnd = (index: number) => polarPoint(index, 100);

const labelPoint = (index: number) => {
  const angle = (-90 + index * (360 / RADAR_GROUPS.length)) * (Math.PI / 180);
  return {
    x: CENTER + Math.cos(angle) * (RADIUS + 46),
    y: CENTER + Math.sin(angle) * (RADIUS + 38),
  };
};

const percentage = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

export function WeeklyMuscleRadarChart({ weeks }: { weeks: WeeklyMuscleGroupVolume[] }) {
  const [selectedIndex, setSelectedIndex] = useState(Math.max(weeks.length - 1, 0));
  const selectedWeek = weeks[selectedIndex] ?? weeks[weeks.length - 1];

  const distribution = useMemo(() => {
    const counts = new Map(selectedWeek?.muscleGroups.map((group) => [group.muscleGroup, group.setCount]) ?? []);
    const trackedSets = RADAR_GROUPS.reduce((total, group) => total + (counts.get(group) ?? 0), 0);
    return RADAR_GROUPS.map((group) => {
      const setCount = counts.get(group) ?? 0;
      return {
        group,
        setCount,
        percentage: percentage(setCount, trackedSets),
      };
    });
  }, [selectedWeek]);

  const polygonPoints = distribution
    .map((item, index) => {
      const point = polarPoint(index, item.percentage);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  const trackedSets = distribution.reduce((total, item) => total + item.setCount, 0);
  const topGroup =
    trackedSets > 0
      ? distribution.reduce((best, item) => (item.percentage > best.percentage ? item : best), distribution[0])
      : null;
  const canMoveBack = selectedIndex > 0;
  const canMoveForward = selectedIndex < weeks.length - 1;

  if (!weeks.length) {
    return null;
  }

  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Weekly Muscle Distribution</h3>
          <p className="text-sm text-slate-500">Percentage split of sets for the selected week</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Previous week"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-slate-600 transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canMoveBack}
            onClick={() => setSelectedIndex((index) => Math.max(index - 1, 0))}
            type="button"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-28 text-center">
            <p className="text-sm font-semibold text-ink">{selectedWeek.label}</p>
            <p className="text-xs text-slate-500">{trackedSets} tracked sets</p>
          </div>
          <button
            aria-label="Next week"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-slate-600 transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canMoveForward}
            onClick={() => setSelectedIndex((index) => Math.min(index + 1, weeks.length - 1))}
            type="button"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex justify-center overflow-x-auto">
          <svg
            aria-label={`${selectedWeek.label} muscle distribution radar chart`}
            className="h-auto w-full max-w-[560px]"
            role="img"
            viewBox="0 0 360 360"
          >
            <g fill="none" stroke="#d8ded6" strokeWidth="1.5">
              {RINGS.map((ring) => (
                <polygon key={ring} points={pointsForValue(ring)} />
              ))}
              {RADAR_GROUPS.map((group, index) => {
                const end = axisEnd(index);
                return <line key={group} x1={CENTER} x2={end.x} y1={CENTER} y2={end.y} />;
              })}
            </g>

            <polygon fill="#256d85" opacity="0.22" points={polygonPoints} />
            <polyline
              fill="none"
              points={`${polygonPoints} ${polygonPoints.split(" ")[0]}`}
              stroke="#256d85"
              strokeLinejoin="round"
              strokeWidth="4"
            />

            {distribution.map((item, index) => {
              const point = polarPoint(index, item.percentage);
              const label = labelPoint(index);
              return (
                <g key={item.group}>
                  <circle cx={point.x} cy={point.y} fill="#256d85" r="4.5" />
                  <text
                    fill="#475569"
                    fontSize="13"
                    fontWeight="600"
                    textAnchor="middle"
                    x={label.x}
                    y={label.y}
                  >
                    {item.group}
                  </text>
                  <text fill="#94a3b8" fontSize="11" textAnchor="middle" x={label.x} y={label.y + 15}>
                    {item.percentage}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex flex-col justify-center gap-4">
          <div>
            <p className="text-sm text-slate-500">Most trained</p>
            <p className="text-2xl font-semibold text-ink">{topGroup?.group ?? "No tracked sets"}</p>
            <p className="text-sm text-slate-500">
              {topGroup ? `${topGroup.percentage}% of tracked sets during ${selectedWeek.label}` : selectedWeek.label}
            </p>
          </div>

          <div className="space-y-2">
            {distribution.map((item) => (
              <div className="grid grid-cols-[86px_minmax(0,1fr)_44px] items-center gap-2" key={item.group}>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-sm ${GROUP_STYLES[item.group]}`} />
                  {item.group}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-paper">
                  <div className="h-full rounded-full bg-river" style={{ width: `${item.percentage}%` }} />
                </div>
                <span className="text-right text-sm font-semibold text-ink">{item.percentage}%</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {weeks.map((week, index) => (
              <button
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                  index === selectedIndex
                    ? "border-river bg-river text-white"
                    : "border-line text-slate-600 hover:bg-paper"
                }`}
                key={week.weekStart}
                onClick={() => setSelectedIndex(index)}
                type="button"
              >
                {week.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
