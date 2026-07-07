import type { z } from "zod";
import { env } from "../../config/env.js";
import { HevyApiError } from "../../utils/AppError.js";
import {
  hevyExerciseTemplatesPageSchema,
  hevyWorkoutCountSchema,
  hevyWorkoutEventsPageSchema,
  hevyWorkoutPageSchema,
  hevyWorkoutResponseSchema,
  hevyRoutinePageSchema,
  hevyRoutineFolderPageSchema,
} from "./hevy.types.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class HevyClient {
  constructor(
    private apiKey = env.HEVY_API_KEY,
    private baseUrl = env.HEVY_API_BASE_URL,
  ) {}

  getWorkoutsPage(page: number, pageSize: number) {
    return this.request(`/v1/workouts?page=${page}&pageSize=${pageSize}`, hevyWorkoutPageSchema);
  }

  getWorkoutById(id: string) {
    return this.request(`/v1/workouts/${id}`, hevyWorkoutResponseSchema);
  }

  getWorkoutCount() {
    return this.request("/v1/workouts/count", hevyWorkoutCountSchema);
  }

  getWorkoutEventsSince(cursor: string, page: number, pageSize: number) {
    const qs = new URLSearchParams({ since: cursor, page: String(page), pageSize: String(pageSize) });
    return this.request(`/v1/workouts/events?${qs}`, hevyWorkoutEventsPageSchema);
  }

  getExerciseTemplates(page: number, pageSize: number) {
    return this.request(`/v1/exercise_templates?page=${page}&pageSize=${pageSize}`, hevyExerciseTemplatesPageSchema);
  }

  getRoutinesPage(page: number, pageSize: number) {
    return this.request(`/v1/routines?page=${page}&pageSize=${pageSize}`, hevyRoutinePageSchema);
  }

  getRoutineFoldersPage(page: number, pageSize: number) {
    return this.request(`/v1/routine_folders?page=${page}&pageSize=${pageSize}`, hevyRoutineFolderPageSchema);
  }

  private async request<T extends z.ZodTypeAny>(path: string, schema: T, attempt = 1): Promise<z.infer<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { "api-key": this.apiKey },
    });

    if (response.status === 401) {
      throw new HevyApiError("Hevy rejected the configured API key", "HEVY_AUTH_ERROR", 502);
    }

    if (response.status === 429 && attempt < 4) {
      await sleep(1000 * 2 ** (attempt - 1));
      return this.request(path, schema, attempt + 1);
    }

    if (!response.ok) {
      throw new HevyApiError(`Hevy API returned ${response.status}`, "HEVY_API_ERROR", 502);
    }

    const json = await response.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const path = issue?.path.length ? issue.path.join(".") : "response";
      throw new HevyApiError(
        `Hevy API response did not match the expected schema at ${path}: ${issue?.message ?? "unknown mismatch"}`,
        "HEVY_SCHEMA_ERROR",
        502,
      );
    }
    return parsed.data;
  }
}
