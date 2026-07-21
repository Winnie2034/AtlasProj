import { SyncButton } from "../components/settings/SyncButton";
import { HevyConnectionCard } from "../components/settings/HevyConnectionCard";

export function SettingsPage() {
  return (
    <div className="grid gap-5">
      <HevyConnectionCard />
      <section className="rounded-md border border-line bg-white p-5 shadow-panel">
        <h2 className="text-xl font-semibold">Sync</h2>
        <p className="mt-1 text-sm text-slate-600">Manual sync runs in the request for this MVP.</p>
        <div className="mt-4">
          <SyncButton />
        </div>
      </section>
    </div>
  );
}
