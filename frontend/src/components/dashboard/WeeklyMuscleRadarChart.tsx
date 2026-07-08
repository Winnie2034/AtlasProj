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

const GROUP_HEX: Record<RadarGroup, string> = {
  Back: "#4f46e5",
  Chest: "#0d9488",
  Shoulders: "#f59e0b",
  Arms: "#f43f5e",
  Legs: "#059669",
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

const radarScaleMax = (percentages: number[]) => {
  const strongestGroup = Math.max(...percentages, 0);
  if (strongestGroup === 0) return 100;
  return Math.min(Math.max(Math.ceil(strongestGroup / 10) * 10, 20), 100);
};

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

  const trackedSets = distribution.reduce((total, item) => total + item.setCount, 0);
  const chartMax = radarScaleMax(distribution.map((item) => item.percentage));
  const polygonPoints = distribution
    .map((item, index) => {
      const point = polarPoint(index, (item.percentage / chartMax) * 100);
      return `${point.x},${point.y}`;
    })
    .join(" ");
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
          <p className="text-sm text-slate-500">Weighted training stimulus for the selected week</p>
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
            <p className="text-xs text-slate-500">{trackedSets.toFixed(1)} stimulus units</p>
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

      <div className="mt-5 grid items-center gap-5 xl:grid-cols-[230px_minmax(300px,420px)_minmax(260px,1fr)]">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500">Most trained</p>
            <p className="text-2xl font-semibold text-ink">{topGroup?.group ?? "No tracked sets"}</p>
            <p className="text-sm text-slate-500">
              {topGroup ? `${topGroup.percentage}% of stimulus` : selectedWeek.label}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
            <div>
              <p className="text-xs uppercase text-slate-400">Week</p>
              <p className="text-sm font-semibold text-ink">{selectedWeek.label}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Volume</p>
              <p className="text-sm font-semibold text-ink">{trackedSets.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center overflow-x-auto xl:justify-center">
          <svg
            aria-label={`${selectedWeek.label} muscle distribution radar chart`}
            className="h-auto w-full max-w-[410px]"
            role="img"
            viewBox="0 0 360 360"
          >
            <g fill="none" stroke="#cbd5e1" strokeOpacity="0.7" strokeWidth="1">
              {RINGS.map((ring) => (
                <polygon key={ring} points={pointsForValue(ring)} />
              ))}
              {RADAR_GROUPS.map((group, index) => {
                const end = axisEnd(index);
                return <line key={group} x1={CENTER} x2={end.x} y1={CENTER} y2={end.y} />;
              })}
            </g>

            <polygon fill="#256d85" opacity="0.12" points={polygonPoints} />
            <polyline
              fill="none"
              points={`${polygonPoints} ${polygonPoints.split(" ")[0]}`}
              stroke="#256d85"
              strokeOpacity="0.82"
              strokeLinejoin="round"
              strokeWidth="3"
            />

            {distribution.map((item, index) => {
              const point = polarPoint(index, (item.percentage / chartMax) * 100);
              const label = labelPoint(index);
              return (
                <g key={item.group}>
                  <circle cx={point.x} cy={point.y} fill={GROUP_HEX[item.group]} r="4" />
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

        <div className="space-y-4">
          <div className="space-y-2">
            {distribution.map((item) => (
              <div className="grid grid-cols-[86px_minmax(0,1fr)_44px] items-center gap-2" key={item.group}>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-sm ${GROUP_STYLES[item.group]}`} />
                  {item.group}
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full"
                    style={{ backgroundColor: GROUP_HEX[item.group], width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-right text-sm font-semibold text-ink">{item.percentage}%</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
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
