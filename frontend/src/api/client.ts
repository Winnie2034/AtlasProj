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

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<{ data: T; meta?: ApiMeta }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const body = (await res.json()) as Envelope<T>;
  if (!body.success) {
    throw new ApiError(body.error.code, body.error.message);
  }
  return { data: body.data, meta: body.meta };
}
