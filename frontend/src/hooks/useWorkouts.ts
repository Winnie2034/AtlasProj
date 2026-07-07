import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchWorkoutById, fetchWorkouts } from "../api/workouts.api";
import type { WorkoutListParams } from "../types/api";

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
    queryFn: () => fetchWorkoutById(id),
    enabled: Boolean(id),
  });
}
