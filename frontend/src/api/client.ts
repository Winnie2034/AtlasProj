import type { ApiMeta } from "../types/api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

type Envelope<T> =
  | { success: true; data: T; meta?: ApiMeta }
  | { success: false; error: { code: string; message: string } };

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

function isJsonResponse(res: Response) {
  return res.headers.get("content-type")?.includes("application/json") ?? false;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<{ data: T; meta?: ApiMeta }> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Atlas could not reach the local API.");
  }

  if (!isJsonResponse(res)) {
    throw new ApiError("NETWORK_ERROR", `Atlas API returned status ${res.status}.`);
  }

  let body: Envelope<T>;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiError("NETWORK_ERROR", "Atlas API returned an unreadable response.");
  }

  if (!body.success) {
    throw new ApiError(body.error.code, body.error.message);
  }
  return { data: body.data, meta: body.meta };
}
