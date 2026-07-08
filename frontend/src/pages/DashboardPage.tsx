import { CalendarCheck, Dumbbell, Flame, RefreshCw } from "lucide-react";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { CurrentWeekHeatmap } from "../components/dashboard/CurrentWeekHeatmap";
import { StatCard } from "../components/dashboard/StatCard";
import { TodayWorkoutCard } from "../components/dashboard/TodayWorkoutCard";
import { WeeklyMuscleRadarChart } from "../components/dashboard/WeeklyMuscleRadarChart";
import { SyncButton } from "../components/settings/SyncButton";
import { useDashboard } from "../hooks/useDashboard";
import { relativeTime } from "../utils/format";

const todayInputValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
          <p className="text-sm text-slate-500">Training history</p>
          <h2 className="text-2xl font-semibold">Dashboard</h2>
        </div>
        <SyncButton />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Dumbbell} label="Total Workouts" tone="river" value={data.workoutCount} />
        <StatCard icon={CalendarCheck} label="This Month" tone="moss" value={data.workoutsThisMonth} />
        <StatCard
          detail={data.currentStreakDays === 1 ? "active day" : "active days"}
          icon={Flame}
          label="Current Streak"
          tone="amber"
          value={data.currentStreakDays}
        />
        <StatCard
          detail={data.lastSync?.status ?? "not run"}
          icon={RefreshCw}
          label="Last Sync"
          tone="berry"
          value={data.lastSync ? relativeTime(data.lastSync.finishedAt) : "No sync"}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <WeeklyMuscleRadarChart weeks={data.muscleDistributionPerWeek} />
        <CurrentWeekHeatmap days={data.trainingDays} />
      </div>
      <TodayWorkoutCard
        currentStreakDays={data.currentStreakDays}
        initialSelectedDate={data.selectedDate}
        initialWorkout={data.selectedWorkout}
        lastWorkout={data.recentWorkouts[0]}
        maxDate={todayInputValue()}
      />
    </div>
  );
}

function EmptyDashboard() {
  return <ErrorState message="Dashboard data is not available yet." />;
}
