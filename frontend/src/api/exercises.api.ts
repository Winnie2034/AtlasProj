import { apiRequest } from "./client";
import type { ExerciseSummary } from "../types/api";

export function fetchExercises(search?: string) {
  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  return apiRequest<ExerciseSummary[]>(`/exercises?${qs}`);
}
