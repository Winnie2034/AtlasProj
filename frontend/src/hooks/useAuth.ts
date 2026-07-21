import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../api/auth.api";

export const useCurrentUser = () =>
  useQuery({ queryKey: ["auth", "me"], queryFn: getCurrentUser, retry: false, staleTime: 5 * 60_000 });
