import type { ApiErrorBody } from "./translation-schema";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string; fieldErrors?: Record<string, string[]> };

/** fetch() wrapper that always resolves to a typed success or a typed error. */
export async function apiFetch<T>(input: string, init?: RequestInit): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    return {
      ok: false,
      status: 0,
      code: "network_error",
      message: "Network error. Check your connection and try again.",
    };
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON body; handled below.
  }

  if (response.ok) {
    return { ok: true, data: body as T };
  }
  const error = (body as ApiErrorBody | null)?.error;
  return {
    ok: false,
    status: response.status,
    code: error?.code ?? "unknown_error",
    message: error?.message ?? `Request failed (${response.status}).`,
    fieldErrors: error?.fieldErrors,
  };
}

export function loginHref(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`;
}
