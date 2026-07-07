import { Dumbbell } from "lucide-react";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { LastSyncCard } from "../components/dashboard/LastSyncCard";
import { RecentWorkoutsList } from "../components/dashboard/RecentWorkoutsList";
import { StatCard } from "../components/dashboard/StatCard";
import { SyncButton } from "../components/settings/SyncButton";
import { useDashboard } from "../hooks/useDashboard";

export function DashboardPage() {
  const dashboard = useDashboard();

  if (dashboard.isLoading) return <LoadingState label="Loading dashboard" />;
  if (dashboard.isError) return <ErrorState message={dashboard.error.message} onRetry={() => dashboard.refetch()} />;
  if (!dashboard.data) return <EmptyDashboard />;

  const data = dashboard.data.data;
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Hevy sync overview</p>
          <h2 className="text-2xl font-semibold">Training history</h2>
        </div>
        <SyncButton />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard icon={Dumbbell} label="Workouts" value={data.workoutCount} />
        <LastSyncCard lastSync={data.lastSync} />
      </div>
      <RecentWorkoutsList workouts={data.recentWorkouts} />
    </div>
  );
}

function EmptyDashboard() {
  return <ErrorState message="Dashboard data is not available yet." />;
}
