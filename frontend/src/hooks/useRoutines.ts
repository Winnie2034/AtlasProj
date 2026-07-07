import { useQuery } from "@tanstack/react-query";
import { fetchRoutines } from "../api/routines.api";

export function useRoutines() {
  return useQuery({
    queryKey: ["routines"],
    queryFn: fetchRoutines,
  });
}
