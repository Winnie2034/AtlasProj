import type { ExerciseDetail } from "../../types/api";
import { SetTable } from "./SetTable";

export function ExerciseCard({ exercise }: { exercise: ExerciseDetail }) {
  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-panel">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{exercise.title}</h3>
          {exercise.notes ? <p className="mt-1 text-sm text-slate-600">{exercise.notes}</p> : null}
        </div>
        {exercise.supersetId ? (
          <span className="rounded bg-berry/10 px-2 py-1 text-xs font-semibold text-berry">Superset {exercise.supersetId}</span>
        ) : null}
      </div>
      <SetTable sets={exercise.sets} />
    </section>
  );
}
