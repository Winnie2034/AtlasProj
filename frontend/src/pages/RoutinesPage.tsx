import { Dumbbell, Folder, Layers3 } from "lucide-react";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { RoutineCard } from "../components/routines/RoutineCard";
import { useRoutines } from "../hooks/useRoutines";

export function RoutinesPage() {
  const routines = useRoutines();
  const routineItems = routines.data?.data ?? [];
  const folderCount = new Set(routineItems.map((routine) => routine.folderTitle).filter(Boolean)).size;
  const totalSets = routineItems.reduce((total, routine) => total + routine.setCount, 0);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Hevy routines</p>
          <h2 className="text-2xl font-semibold text-ink">Training templates</h2>
        </div>
        {routineItems.length > 0 ? (
          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-3">
            <RoutineStat icon={<Dumbbell size={15} />} label="Routines" value={routineItems.length} />
            <RoutineStat icon={<Layers3 size={15} />} label="Planned sets" value={totalSets} />
            <RoutineStat icon={<Folder size={15} />} label="Folders" value={folderCount || "None"} />
          </div>
        ) : null}
      </div>

      {routines.isLoading ? <LoadingState label="Loading routines" /> : null}
      {routines.isError ? <ErrorState message={routines.error.message} onRetry={() => routines.refetch()} /> : null}
      {routines.data && routineItems.length === 0 ? (
        <EmptyState title="No routines found" detail="Create routines in Hevy to view them here." />
      ) : null}
      {routines.data && routineItems.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {routineItems.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RoutineStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex min-w-[140px] items-center gap-2 rounded-md border border-line bg-white px-3 py-2 shadow-panel">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-paper text-river">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs uppercase text-slate-400">{label}</span>
        <span className="block truncate text-sm font-semibold text-ink">{value}</span>
      </span>
    </div>
  );
}
