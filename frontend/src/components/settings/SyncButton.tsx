import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useSync } from "../../hooks/useSync";
import type { SyncResult } from "../../types/api";

type SyncToast =
  | {
      type: "success";
      result: SyncResult;
    }
  | {
      type: "error";
      message: string;
    };

export function SyncButton() {
  const sync = useSync();
  const result = sync.data?.data;
  const [toast, setToast] = useState<SyncToast | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);

  useEffect(() => {
    const nextToast: SyncToast | null = result
      ? { type: "success", result }
      : sync.isError
        ? { type: "error", message: sync.error.message }
        : null;
    if (!nextToast) return;

    setToast(nextToast);
    setIsToastVisible(true);

    const fadeTimer = window.setTimeout(() => setIsToastVisible(false), 4200);
    const removeTimer = window.setTimeout(() => setToast(null), 4700);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [result, sync.error?.message, sync.isError]);

  return (
    <>
      <button
        className="focus-ring inline-flex w-fit items-center gap-2 rounded-md bg-moss px-4 py-2 font-medium text-white disabled:opacity-60"
        disabled={sync.isPending}
        onClick={() => {
          setIsToastVisible(false);
          setToast(null);
          sync.mutate();
        }}
        type="button"
      >
        <RefreshCw className={sync.isPending ? "animate-spin" : ""} size={18} />
        {sync.isPending ? "Syncing" : "Sync"}
      </button>
      {toast ? <SyncToast toast={toast} visible={isToastVisible} /> : null}
    </>
  );
}

function SyncToast({ toast, visible }: { toast: SyncToast; visible: boolean }) {
  const isSuccess = toast.type === "success";

  return (
    <div
      aria-live="polite"
      className={`fixed left-1/2 top-5 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
      role="status"
    >
      <div className="rounded-md border border-line bg-white p-4 text-sm shadow-lg">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white ${
              isSuccess ? "bg-moss" : "bg-status-error"
            }`}
          >
            <RefreshCw size={16} />
          </div>
          <div>
            {toast.type === "success" ? (
              <>
                <p className="font-semibold text-ink">Sync {toast.result.status}</p>
                <p className="mt-1 text-slate-600">
                  {toast.result.workoutsFetched} fetched, {toast.result.workoutsCreated} created,{" "}
                  {toast.result.workoutsUpdated} updated, {toast.result.workoutsDeleted} deleted
                </p>
                {toast.result.errors.length > 0 ? (
                  <p className="mt-2 text-status-warning">{toast.result.errors.length} workout errors</p>
                ) : null}
              </>
            ) : (
              <>
                <p className="font-semibold text-ink">Sync failed</p>
                <p className="mt-1 text-status-error">{toast.message}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
