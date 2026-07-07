export type SortValue = "newest" | "oldest" | "title";

export function WorkoutSortControl({ value, onChange }: { value: SortValue; onChange: (value: SortValue) => void }) {
  return (
    <select
      className="focus-ring rounded-md border border-line bg-white px-3 py-2"
      onChange={(event) => onChange(event.target.value as SortValue)}
      value={value}
    >
      <option value="newest">Newest</option>
      <option value="oldest">Oldest</option>
      <option value="title">Title</option>
    </select>
  );
}
