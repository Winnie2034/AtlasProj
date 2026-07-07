export function SystemInfoPanel() {
  return (
    <section className="rounded-md border border-line bg-white p-5 shadow-panel">
      <h3 className="font-semibold">System</h3>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Frontend</dt>
          <dd className="font-medium">Atlas 0.1.0</dd>
        </div>
        <div>
          <dt className="text-slate-500">API base</dt>
          <dd className="font-medium">{import.meta.env.VITE_API_BASE_URL ?? "/api"}</dd>
        </div>
      </dl>
    </section>
  );
}
