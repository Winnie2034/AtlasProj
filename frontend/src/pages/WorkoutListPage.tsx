import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { Pagination } from "../components/common/Pagination";
import { WorkoutSearchBar } from "../components/workouts/WorkoutSearchBar";
import { WorkoutSortControl, type SortValue } from "../components/workouts/WorkoutSortControl";
import { WorkoutTable } from "../components/workouts/WorkoutTable";
import { useWorkouts } from "../hooks/useWorkouts";

export function WorkoutListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const sort = (searchParams.get("sort") as SortValue) ?? "newest";
  const page = Number(searchParams.get("page") ?? 1);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (search) next.set("search", search);
      else next.delete("search");
      next.set("page", "1");
      setSearchParams(next, { replace: true });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const params = useMemo(
    () => ({
      search: searchParams.get("search") ?? undefined,
      sortBy: sort === "title" ? ("title" as const) : ("startTime" as const),
      sortDir: sort === "oldest" || sort === "title" ? ("asc" as const) : ("desc" as const),
      page,
      pageSize: 20,
    }),
    [page, searchParams, sort],
  );
  const workouts = useWorkouts(params);

  function updateSort(value: SortValue) {
    const next = new URLSearchParams(searchParams);
    next.set("sort", value);
    next.set("page", "1");
    setSearchParams(next);
  }

  function updatePage(value: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(value));
    setSearchParams(next);
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-3">
        <WorkoutSearchBar onChange={setSearch} value={search} />
        <WorkoutSortControl onChange={updateSort} value={sort} />
      </div>
      {workouts.isLoading ? <LoadingState label="Loading workouts" /> : null}
      {workouts.isError ? <ErrorState message={workouts.error.message} onRetry={() => workouts.refetch()} /> : null}
      {workouts.data && workouts.data.data.length === 0 ? (
        <EmptyState title="No workouts found" detail={params.search ? "Try a different search." : "Run a sync to import workouts."} />
      ) : null}
      {workouts.data && workouts.data.data.length > 0 ? (
        <div className="grid gap-4 overflow-x-auto">
          <WorkoutTable workouts={workouts.data.data} />
          <Pagination meta={workouts.data.meta} onPageChange={updatePage} />
        </div>
      ) : null}
    </div>
  );
}
