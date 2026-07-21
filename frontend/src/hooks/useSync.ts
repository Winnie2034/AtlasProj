import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/client";
import type { SyncResult } from "../types/api";

export function useSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<SyncResult>("/sync", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });
}
