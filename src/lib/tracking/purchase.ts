import "server-only";
import type Stripe from "stripe";
import { isProductId, PRODUCTS } from "@/lib/catalog";
import { siteUrl } from "@/lib/env";
import { CHECKOUT_METADATA_KEYS, decodeProductIds } from "@/lib/stripe";
import { loadCheckoutAttribution } from "./attribution";
import { dispatchConversion, type DispatchResult } from "./dispatch";
import type { ConversionEvent } from "./payloads";

/** Meta rejects events older than 7 days; keep a margin for late webhook retries. */
export function clampEventTime(occurredAt: number, nowSeconds: number = Math.floor(Date.now() / 1000)): number {
  const oldestAccepted = nowSeconds - 7 * 24 * 3600 + 3600;
  return Math.min(Math.max(occurredAt, oldestAccepted), nowSeconds);
}

/**
 * Server-side Purchase event for a paid Checkout Session. The event id is the
 * Checkout Session id, which the success page also passes to the browser
 * pixels, so Meta and TikTok each count the purchase once.
 */
export async function reportCheckoutPurchase(
  session: Stripe.Checkout.Session,
  userId: string,
  occurredAt: number = Math.floor(Date.now() / 1000),
): Promise<DispatchResult[]> {
  const attribution = await loadCheckoutAttribution(session.id);
  if (attribution?.consent === "denied") {
    return [
      { platform: "meta", status: "skipped", detail: "consent_denied" },
      { platform: "tiktok", status: "skipped", detail: "consent_denied" },
    ];
  }

  const productIds = decodeProductIds(session.metadata?.[CHECKOUT_METADATA_KEYS.productIds]).filter(isProductId);
  const event: ConversionEvent = {
    name: "Purchase",
    eventId: session.id,
    eventTime: clampEventTime(occurredAt),
    eventSourceUrl: attribution?.event_source_url ?? `${siteUrl()}/`,
    // Actual amount charged, after any promotion code.
    value: (session.amount_total ?? 0) / 100,
    currency: session.currency ?? "usd",
    contents: productIds.map((id) => ({
      id,
      name: PRODUCTS[id].name,
      price: PRODUCTS[id].priceCents / 100,
      quantity: 1,
    })),
    user: {
      email: session.customer_details?.email ?? null,
      externalId: userId,
      ip: attribution?.client_ip ?? null,
      userAgent: attribution?.user_agent ?? null,
      fbp: attribution?.fbp ?? null,
      fbc: attribution?.fbc ?? null,
      ttclid: attribution?.ttclid ?? null,
      ttp: attribution?.ttp ?? null,
    },
  };
  return dispatchConversion(event);
}
