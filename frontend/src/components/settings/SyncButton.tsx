import { RefreshCw } from "lucide-react";
import { useSync } from "../../hooks/useSync";

export function SyncButton() {
  const sync = useSync();
  const result = sync.data?.data;

  return (
    <div className="grid gap-3">
      <button
        className="focus-ring inline-flex w-fit items-center gap-2 rounded-md bg-moss px-4 py-2 font-medium text-white disabled:opacity-60"
        disabled={sync.isPending}
        onClick={() => sync.mutate()}
        type="button"
      >
        <RefreshCw className={sync.isPending ? "animate-spin" : ""} size={18} />
        {sync.isPending ? "Syncing" : "Sync"}
      </button>
      {sync.isError ? <p className="text-sm text-status-error">{sync.error.message}</p> : null}
      {result ? (
        <div className="rounded-md border border-line bg-white p-4 text-sm shadow-panel">
          <p className="font-semibold">Sync {result.status}</p>
          <p className="mt-1 text-slate-600">
            {result.workoutsFetched} fetched, {result.workoutsCreated} created, {result.workoutsUpdated} updated,{" "}
            {result.workoutsDeleted} deleted
          </p>
          {result.errors.length > 0 ? <p className="mt-2 text-status-warning">{result.errors.length} workout errors</p> : null}
        </div>
      ) : null}
    </div>
  );
}
