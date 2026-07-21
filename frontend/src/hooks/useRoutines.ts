import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../api/client";
import type { Routine } from "../types/api";

export function useRoutines() {
  return useQuery({
    queryKey: ["routines"],
    queryFn: () => apiRequest<Routine[]>("/routines"),
  });
}
