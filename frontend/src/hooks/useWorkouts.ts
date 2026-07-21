import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiRequest } from "../api/client";
import type { WorkoutDetail, WorkoutListParams, WorkoutSummary } from "../types/api";

const fetchWorkouts = (params: WorkoutListParams) => {
  const query = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) => value === undefined || value === "" ? [] : [[key, String(value)]]),
  );
  return apiRequest<WorkoutSummary[]>(`/workouts?${query}`);
};

export function useWorkouts(params: WorkoutListParams) {
  return useQuery({
    queryKey: ["workouts", params],
    queryFn: () => fetchWorkouts(params),
    placeholderData: keepPreviousData,
  });
}

export function useWorkoutDetail(id: string) {
  return useQuery({
    queryKey: ["workout", id],
    queryFn: () => apiRequest<WorkoutDetail>(`/workouts/${id}`),
    enabled: Boolean(id),
  });
}
