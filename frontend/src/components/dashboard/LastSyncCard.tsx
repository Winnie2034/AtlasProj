import { Clock3 } from "lucide-react";
import { relativeTime } from "../../utils/format";

const statusClass: Record<string, string> = {
  success: "bg-status-success/10 text-status-success",
  partial_failure: "bg-status-warning/10 text-status-warning",
  failed: "bg-status-error/10 text-status-error",
  running: "bg-status-neutral/10 text-status-neutral",
};

export function LastSyncCard({
  lastSync,
}: {
  lastSync: { finishedAt: string | null; status: string } | null;
}) {
  return (
    <section className="rounded-md border border-line bg-white p-5 shadow-panel">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-berry text-white">
        <Clock3 size={20} />
      </div>
      <p className="text-sm text-slate-500">Last sync</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-1 text-xs font-semibold ${statusClass[lastSync?.status ?? ""] ?? statusClass.running}`}>
          {lastSync?.status ?? "not run"}
        </span>
        <span className="text-sm text-slate-600">{lastSync ? relativeTime(lastSync.finishedAt) : "No sync history"}</span>
      </div>
    </section>
  );
}
