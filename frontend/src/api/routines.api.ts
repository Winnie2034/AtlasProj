import { apiRequest } from "./client";
import type { Routine } from "../types/api";

export function fetchRoutines() {
  return apiRequest<Routine[]>("/routines");
}
