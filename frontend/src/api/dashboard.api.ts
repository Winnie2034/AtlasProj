import { apiRequest } from "./client";
import type { DashboardData } from "../types/api";

export function fetchDashboard() {
  return apiRequest<DashboardData>("/dashboard");
}
