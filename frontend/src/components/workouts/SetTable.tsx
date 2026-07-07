import type { SetDetail } from "../../types/api";
import { formatDuration } from "../../utils/format";

export function SetTable({ sets }: { sets: SetDetail[] }) {
  const hasStrength = sets.some((set) => set.weightKg != null || set.reps != null);
  const hasCardio = sets.some((set) => set.distanceMeters != null || set.durationSeconds != null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="py-2 pr-3 font-semibold">Set</th>
            <th className="py-2 pr-3 font-semibold">Type</th>
            {hasStrength ? <th className="py-2 pr-3 font-semibold">Weight</th> : null}
            {hasStrength ? <th className="py-2 pr-3 font-semibold">Reps</th> : null}
            {hasCardio ? <th className="py-2 pr-3 font-semibold">Distance</th> : null}
            {hasCardio ? <th className="py-2 pr-3 font-semibold">Duration</th> : null}
            <th className="py-2 pr-3 font-semibold">RPE</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sets.map((set) => (
            <tr key={set.id}>
              <td className="py-2 pr-3">{set.index + 1}</td>
              <td className="py-2 pr-3">
                <span className="rounded bg-river/10 px-2 py-1 text-xs font-semibold text-river">{set.type}</span>
              </td>
              {hasStrength ? <td className="py-2 pr-3">{set.weightKg == null ? "-" : `${set.weightKg} kg`}</td> : null}
              {hasStrength ? <td className="py-2 pr-3">{set.reps ?? "-"}</td> : null}
              {hasCardio ? <td className="py-2 pr-3">{set.distanceMeters == null ? "-" : `${set.distanceMeters} m`}</td> : null}
              {hasCardio ? <td className="py-2 pr-3">{formatDuration(set.durationSeconds)}</td> : null}
              <td className="py-2 pr-3">{set.rpe ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
