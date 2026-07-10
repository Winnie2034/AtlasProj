import type { z } from "zod";
import { env } from "../../config/env.js";
import { HevyApiError } from "../../utils/AppError.js";
import {
  hevyExerciseTemplatesPageSchema,
  hevyExerciseTemplateResponseSchema,
  hevyWorkoutCountSchema,
  hevyWorkoutEventsPageSchema,
  hevyWorkoutPageSchema,
  hevyWorkoutResponseSchema,
  hevyRoutinePageSchema,
  hevyRoutineFolderPageSchema,
} from "./hevy.types.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const requestTimeoutMs = 30_000;
const maxAttempts = 4;

const isRetryableStatus = (status: number) => status === 429 || (status >= 500 && status < 600);

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

  getExerciseTemplateById(id: string) {
    return this.request(`/v1/exercise_templates/${encodeURIComponent(id)}`, hevyExerciseTemplateResponseSchema);
  }

  getRoutinesPage(page: number, pageSize: number) {
    return this.request(`/v1/routines?page=${page}&pageSize=${pageSize}`, hevyRoutinePageSchema);
  }

  getRoutineFoldersPage(page: number, pageSize: number) {
    return this.request(`/v1/routine_folders?page=${page}&pageSize=${pageSize}`, hevyRoutineFolderPageSchema);
  }

  private async fetchWithTimeout(path: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      return await fetch(`${this.baseUrl}${path}`, {
        headers: { "api-key": this.apiKey },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async request<T extends z.ZodTypeAny>(path: string, schema: T, attempt = 1): Promise<z.infer<T>> {
    let response: Response;
    try {
      response = await this.fetchWithTimeout(path);
    } catch (error) {
      if (attempt < maxAttempts) {
        await sleep(1000 * 2 ** (attempt - 1));
        return this.request(path, schema, attempt + 1);
      }

      const message =
        error instanceof Error && error.name === "AbortError"
          ? "Hevy API request timed out"
          : "Atlas could not reach the Hevy API";
      throw new HevyApiError(message, "HEVY_NETWORK_ERROR", 502);
    }

    if (response.status === 401) {
      throw new HevyApiError("Hevy rejected the configured API key", "HEVY_AUTH_ERROR", 502);
    }

    if (isRetryableStatus(response.status) && attempt < maxAttempts) {
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
