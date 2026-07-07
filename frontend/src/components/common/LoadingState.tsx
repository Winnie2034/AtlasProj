export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid gap-3" aria-label={label}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-md bg-line/70" />
      ))}
    </div>
  );
}
