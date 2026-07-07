import { apiRequest } from "./client";
import type { SyncResult } from "../types/api";

export function triggerSync() {
  return apiRequest<SyncResult>("/sync", { method: "POST" });
}
