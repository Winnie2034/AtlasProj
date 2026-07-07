import { Activity, CalendarDays, Dumbbell, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", icon: Activity },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/routines", label: "Routines", icon: CalendarDays },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="border-r border-line bg-white px-4 py-5">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-ink">Atlas</h1>
        <p className="text-sm text-slate-500">Workout data</p>
      </div>
      <nav className="grid gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `focus-ring flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? "bg-moss text-white" : "text-slate-700 hover:bg-paper"
                }`
              }
              to={item.to}
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
