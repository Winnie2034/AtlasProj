import { RefreshCw } from "lucide-react";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-md border border-status-error/30 bg-white p-4 text-status-error shadow-panel">
      <p className="font-medium">{message}</p>
      {onRetry ? (
        <button
          className="focus-ring mt-3 inline-flex items-center gap-2 rounded-md border border-status-error/30 px-3 py-2 text-sm"
          onClick={onRetry}
          type="button"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      ) : null}
    </div>
  );
}
