import { useLocation } from "react-router-dom";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/workouts": "Workouts",
  "/settings": "Settings",
};

export function TopBar() {
  const location = useLocation();
  const title = titles[location.pathname] ?? "Workout detail";
  return (
    <header className="flex min-h-16 items-center justify-between border-b border-line bg-paper px-5">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
    </header>
  );
}
