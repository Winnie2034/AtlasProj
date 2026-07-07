import type { LucideIcon } from "lucide-react";

const toneClass = {
  river: "bg-river text-white",
  berry: "bg-berry text-white",
  moss: "bg-moss text-white",
  amber: "bg-amber-600 text-white",
} as const;

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "river",
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  tone?: keyof typeof toneClass;
}) {
  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
          {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${toneClass[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
    </section>
  );
}
