import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession } from "@/lib/billing";
import { PRODUCT_IDS, validateCart } from "@/lib/catalog";
import { getEntitlements } from "@/lib/entitlements";
import { HttpError, parseJsonBody, toErrorResponse } from "@/lib/http";
import { checkoutLimiter } from "@/lib/rate-limit";
import { requireUser } from "@/lib/supabase/server";

const checkoutRequestSchema = z.object({
  productIds: z.array(z.enum(PRODUCT_IDS)).min(1).max(PRODUCT_IDS.length),
});

export interface CheckoutResponse {
  url: string;
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const limit = checkoutLimiter.check(`checkout:${user.id}`);
    if (!limit.allowed) {
      throw new HttpError(429, "rate_limited", "Too many checkout attempts. Try again shortly.", undefined, {
        "Retry-After": String(limit.retryAfterSeconds),
      });
    }

    const { productIds } = await parseJsonBody(request, checkoutRequestSchema);
    const owned = await getEntitlements(supabase, user.id);
    const cart = validateCart(productIds, owned);
    if (!cart.ok) throw new HttpError(409, "invalid_cart", cart.reason);

    const url = await createCheckoutSession(user, cart.products);
    return NextResponse.json<CheckoutResponse>({ url });
  } catch (error) {
    return toErrorResponse(error, "api/checkout");
  }
}
