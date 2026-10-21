import { after, NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession } from "@/lib/billing";
import { cartTotalCents, PRODUCT_IDS, PRODUCTS, validateCart, type ProductId } from "@/lib/catalog";
import { getEntitlements } from "@/lib/entitlements";
import { serverEnv, siteUrl } from "@/lib/env";
import { clientIp, HttpError, parseJsonBody, toErrorResponse } from "@/lib/http";
import { checkoutLimiter } from "@/lib/rate-limit";
import { supabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";
import { attributionFromRequest, mayShare, saveCheckoutAttribution } from "@/lib/tracking/attribution";
import { dispatchConversion } from "@/lib/tracking/dispatch";

const checkoutRequestSchema = z.object({
  productIds: z.array(z.enum(PRODUCT_IDS)).min(1).max(PRODUCT_IDS.length),
});

export interface CheckoutResponse {
  url: string;
}

/**
 * Starts Stripe Checkout. Signed-in members buy against their account; guests
 * (straight from an ad) check out with just an email and are provisioned by
 * the webhook.
 */
export async function POST(request: Request) {
  try {
    const supabase = supabasePublicConfig() ? await createSupabaseServerClient() : null;
    const user = supabase ? await getSessionUser(supabase) : null;

    const limit = checkoutLimiter.check(`checkout:${user?.id ?? clientIp(request)}`);
    if (!limit.allowed) {
      throw new HttpError(429, "rate_limited", "Too many checkout attempts. Try again shortly.", undefined, {
        "Retry-After": String(limit.retryAfterSeconds),
      });
    }

    const { productIds } = await parseJsonBody(request, checkoutRequestSchema);
    const owned: ProductId[] = user && supabase ? await getEntitlements(supabase, user.id) : [];
    const cart = validateCart(productIds, owned, { servicesEnabled: serverEnv().EXPERT_REVIEW_ENABLED });
    if (!cart.ok) throw new HttpError(409, "invalid_cart", cart.reason);

    const checkout = await createCheckoutSession(user, cart.products);

    const attribution = attributionFromRequest(request);
    after(async () => {
      await saveCheckoutAttribution(checkout.id, user?.id ?? null, attribution);
      if (!mayShare(attribution)) return;
      await dispatchConversion(
        {
          name: "InitiateCheckout",
          eventId: `${checkout.id}:ic`,
          eventTime: Math.floor(Date.now() / 1000),
          eventSourceUrl: attribution.sourceUrl ?? `${siteUrl()}/`,
          value: cartTotalCents(cart.products) / 100,
          currency: "usd",
          contents: cart.products.map((id) => ({
            id,
            name: PRODUCTS[id].name,
            price: PRODUCTS[id].priceCents / 100,
            quantity: 1,
          })),
          user: {
            email: user?.email ?? null,
            externalId: user?.id ?? null,
            ip: attribution.ip,
            userAgent: attribution.userAgent,
            fbp: attribution.fbp,
            fbc: attribution.fbc,
            ttclid: attribution.ttclid,
            ttp: attribution.ttp,
          },
        },
        ["meta", "tiktok"],
        { ledger: false },
      );
    });

    return NextResponse.json<CheckoutResponse>({ url: checkout.url });
  } catch (error) {
    return toErrorResponse(error, "api/checkout");
  }
}
