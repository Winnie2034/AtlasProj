import { useQuery } from "@tanstack/react-query";
import { fetchExercises } from "../api/exercises.api";

export function useExercises(search?: string) {
  return useQuery({
    queryKey: ["exercises", search],
    queryFn: () => fetchExercises(search),
  });
}
