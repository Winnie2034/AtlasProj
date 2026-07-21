import { useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { logout } from "../../api/auth.api";
import { useCurrentUser } from "../../hooks/useAuth";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/workouts": "Workouts",
  "/routines": "Routines",
  "/settings": "Settings",
};

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      navigate("/login");
    },
  });
  const title = titles[location.pathname] ?? "Workout detail";
  return (
    <header className="flex min-h-16 items-center justify-between border-b border-line bg-paper px-5">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-slate-600 sm:inline">{user.data?.data.displayName ?? user.data?.data.email}</span>
        <button className="focus-ring rounded-md border border-line bg-white px-3 py-1.5 text-sm font-semibold" disabled={logoutMutation.isPending} onClick={() => logoutMutation.mutate()} type="button">Log out</button>
      </div>
    </header>
  );
}
