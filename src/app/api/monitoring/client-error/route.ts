import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, HttpError, parseJsonBody, toErrorResponse } from "@/lib/http";
import { reportError } from "@/lib/monitoring";
import { RateLimiter } from "@/lib/rate-limit";

/** Browsers report at most a handful of errors a minute; anything more is noise or abuse. */
const limiter = new RateLimiter(10, 60_000);

const clientErrorSchema = z.object({
  name: z.string().max(120).optional(),
  message: z.string().max(1000),
  stack: z.string().max(6000).optional(),
  digest: z.string().max(120).optional(),
  path: z.string().max(300).startsWith("/"),
});

/**
 * POST /api/monitoring/client-error
 * Error boundaries send what crashed in the browser; it is redacted and
 * reported like a server error. Same-origin only.
 */
export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      throw new HttpError(403, "forbidden_origin", "Cross-origin reports are not accepted.");
    }
    const limit = limiter.check(`client-error:${clientIp(request)}`);
    if (!limit.allowed) return new NextResponse(null, { status: 202 });

    const body = await parseJsonBody(request, clientErrorSchema);
    const error = Object.assign(new Error(body.message), { name: body.name ?? "ClientError", stack: body.stack });
    await reportError(error, { source: "client", route: body.path, digest: body.digest });
    return new NextResponse(null, { status: 202 });
  } catch (error) {
    return toErrorResponse(error, "api/monitoring/client-error");
  }
}
