import { useMutation, useQueryClient } from "@tanstack/react-query";
import { triggerSync } from "../api/sync.api";

export function useSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: triggerSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });
}
