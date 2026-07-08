import { apiRequest } from "./client";
import type { DashboardData, SelectedWorkoutData } from "../types/api";

export function fetchDashboard() {
  return apiRequest<DashboardData>("/dashboard");
}

export function fetchSelectedWorkout(date: string, signal?: AbortSignal) {
  return apiRequest<SelectedWorkoutData>(`/dashboard/selected-workout?date=${encodeURIComponent(date)}`, { signal });
}
