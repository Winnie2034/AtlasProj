export type SortValue = "newest" | "oldest" | "title";

export function WorkoutSortControl({ value, onChange }: { value: SortValue; onChange: (value: SortValue) => void }) {
  return (
    <select
      aria-label="Sort"
      className="focus-ring h-10 w-full rounded-md border border-line bg-paper py-2 pl-9 pr-3 text-sm text-slate-700"
      onChange={(event) => onChange(event.target.value as SortValue)}
      value={value}
    >
      <option value="newest">Newest</option>
      <option value="oldest">Oldest</option>
      <option value="title">Title</option>
    </select>
  );
}
