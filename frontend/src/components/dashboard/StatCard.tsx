import type { LucideIcon } from "lucide-react";

export function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <section className="rounded-md border border-line bg-white p-5 shadow-panel">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-river text-white">
        <Icon size={20} />
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-ink">{value}</p>
    </section>
  );
}
