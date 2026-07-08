import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "../api/dashboard.api";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    placeholderData: keepPreviousData,
  });
}
