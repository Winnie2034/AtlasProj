import { apiRequest } from "./client";
import type { WorkoutDetail, WorkoutListParams, WorkoutSummary } from "../types/api";

export function fetchWorkouts(params: WorkoutListParams) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  });
  return apiRequest<WorkoutSummary[]>(`/workouts?${qs}`);
}

export function fetchWorkoutById(id: string) {
  return apiRequest<WorkoutDetail>(`/workouts/${id}`);
}
