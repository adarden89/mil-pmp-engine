import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { PRODUCT_IDS, PRODUCTS } from "@/lib/catalog";
import { siteUrl } from "@/lib/env";
import { clientIp, HttpError, parseJsonBody, toErrorResponse } from "@/lib/http";
import { RateLimiter } from "@/lib/rate-limit";
import { attributionFromRequest, mayShare } from "./attribution";
import { dispatchConversion, type Platform } from "./dispatch";
import { PUBLIC_FUNNEL_EVENTS } from "./shared";

/**
 * Public endpoints the browser calls for top-of-funnel events. Purchase is
 * deliberately not accepted here: only the Stripe webhook may report revenue,
 * so nobody can inject fake conversions into the ad accounts.
 */

const funnelEventSchema = z.object({
  eventName: z.enum(PUBLIC_FUNNEL_EVENTS),
  /** Same id the browser pixel used, so the platform deduplicates the pair. */
  eventId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  eventSourceUrl: z.url().max(1024),
  contentIds: z.array(z.enum(PRODUCT_IDS)).max(PRODUCT_IDS.length).optional(),
});

const limiter = new RateLimiter(30, 60_000);

export interface FunnelEventResponse {
  sent: boolean;
  reason?: string;
}

export function funnelEventHandler(platform: Platform) {
  return async function POST(request: Request) {
    try {
      const limit = limiter.check(`${platform}:${clientIp(request)}`);
      if (!limit.allowed) {
        throw new HttpError(429, "rate_limited", "Too many events.", undefined, {
          "Retry-After": String(limit.retryAfterSeconds),
        });
      }
      const body = await parseJsonBody(request, funnelEventSchema);
      const allowedOrigins = new Set([new URL(siteUrl()).origin, new URL(request.url).origin]);
      if (!allowedOrigins.has(new URL(body.eventSourceUrl).origin)) {
        throw new HttpError(400, "foreign_origin", "Events must come from this site.");
      }

      const attribution = attributionFromRequest(request);
      if (!mayShare(attribution)) {
        return NextResponse.json<FunnelEventResponse>({ sent: false, reason: "consent" }, { status: 202 });
      }

      const contents = body.contentIds?.map((id) => ({
        id,
        name: PRODUCTS[id].name,
        price: PRODUCTS[id].priceCents / 100,
        quantity: 1,
      }));
      const [result] = await dispatchConversion(
        {
          name: body.eventName,
          eventId: body.eventId,
          eventTime: Math.floor(Date.now() / 1000),
          eventSourceUrl: body.eventSourceUrl,
          value: contents?.reduce((sum, item) => sum + item.price, 0),
          currency: contents ? "usd" : undefined,
          contents,
          user: {
            ip: attribution.ip,
            userAgent: attribution.userAgent,
            fbp: attribution.fbp,
            fbc: attribution.fbc,
            ttclid: attribution.ttclid,
            ttp: attribution.ttp,
          },
        },
        [platform],
        { ledger: false },
      );
      return NextResponse.json<FunnelEventResponse>(
        { sent: result.status === "sent", reason: result.status === "sent" ? undefined : result.status },
        { status: 202 },
      );
    } catch (error) {
      return toErrorResponse(error, `api/tracking/${platform}`);
    }
  };
}
