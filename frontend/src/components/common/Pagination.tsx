import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ApiMeta } from "../../types/api";

export function Pagination({ meta, onPageChange }: { meta?: ApiMeta; onPageChange: (page: number) => void }) {
  if (!meta) return null;
  const totalPages = Math.max(Math.ceil(meta.total / meta.pageSize), 1);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
      <span>
        Page {meta.page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          aria-label="Previous page"
          className="focus-ring rounded-md border border-line bg-white p-2 disabled:opacity-40"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
          type="button"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          aria-label="Next page"
          className="focus-ring rounded-md border border-line bg-white p-2 disabled:opacity-40"
          disabled={meta.page >= totalPages}
          onClick={() => onPageChange(meta.page + 1)}
          type="button"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
