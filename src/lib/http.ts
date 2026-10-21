import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ConfigError } from "./env";
import type { ApiErrorBody } from "./translation-schema";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fieldErrors?: Record<string, string[]>,
    public readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
  headers?: Record<string, string>,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message, fieldErrors } }, { status, headers });
}

/** Parse and validate a JSON body, throwing a 400 HttpError with field errors on failure. */
export async function parseJsonBody<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "invalid_json", "Request body must be valid JSON.");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    throw new HttpError(400, "validation_failed", "Some fields need attention.", fieldErrors);
  }
  return parsed.data;
}

/** Map any thrown value to a safe JSON response. Unknown errors are logged, never echoed. */
export function toErrorResponse(error: unknown, context: string): NextResponse<ApiErrorBody> {
  if (error instanceof HttpError) {
    return jsonError(error.status, error.code, error.message, error.fieldErrors, error.headers);
  }
  if (error instanceof ConfigError) {
    console.error(`[${context}] ${error.message}`);
    return jsonError(503, "not_configured", "This feature is not configured on the server yet.");
  }
  console.error(`[${context}] unexpected error`, error);
  return jsonError(500, "internal_error", "Something went wrong on our side. Please try again.");
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
