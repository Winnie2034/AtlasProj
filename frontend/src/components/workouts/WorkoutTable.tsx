import { Link } from "react-router-dom";
import type { WorkoutSummary } from "../../types/api";
import { formatDateTime } from "../../utils/format";

export function WorkoutTable({ workouts }: { workouts: WorkoutSummary[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-white shadow-panel">
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">
        <thead className="bg-paper text-slate-600">
          <tr>
            <th className="px-4 py-3 font-semibold">Workout</th>
            <th className="px-4 py-3 font-semibold">Started</th>
            <th className="px-4 py-3 font-semibold">Exercises</th>
            <th className="px-4 py-3 font-semibold">Sets</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {workouts.map((workout) => (
            <tr className="hover:bg-paper" key={workout.id}>
              <td className="px-4 py-3 font-medium">
                <Link className="text-river hover:underline" to={`/workouts/${workout.id}`}>
                  {workout.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{formatDateTime(workout.startTime)}</td>
              <td className="px-4 py-3">{workout.exerciseCount}</td>
              <td className="px-4 py-3">{workout.setCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
