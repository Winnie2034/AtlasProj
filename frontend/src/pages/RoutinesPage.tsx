import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { RoutineCard } from "../components/routines/RoutineCard";
import { useRoutines } from "../hooks/useRoutines";

export function RoutinesPage() {
  const routines = useRoutines();

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm text-slate-500">Hevy routines</p>
        <h2 className="text-2xl font-semibold">Created routines</h2>
      </div>

      {routines.isLoading ? <LoadingState label="Loading routines" /> : null}
      {routines.isError ? <ErrorState message={routines.error.message} onRetry={() => routines.refetch()} /> : null}
      {routines.data && routines.data.data.length === 0 ? (
        <EmptyState title="No routines found" detail="Create routines in Hevy to view them here." />
      ) : null}
      {routines.data && routines.data.data.length > 0 ? (
        <div className="grid gap-4">
          {routines.data.data.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
