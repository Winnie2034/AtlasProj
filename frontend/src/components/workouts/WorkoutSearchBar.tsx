import { Search } from "lucide-react";

export function WorkoutSearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative block min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input
        className="focus-ring w-full rounded-md border border-line bg-white py-2 pl-10 pr-3"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search workouts"
        type="search"
        value={value}
      />
    </label>
  );
}
