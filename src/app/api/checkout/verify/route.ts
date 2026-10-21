import { after, connection, NextResponse, type NextRequest } from "next/server";
import type { ProductId } from "@/lib/catalog";
import { maskEmail } from "@/lib/email";
import { fulfillCheckoutSession, getEntitlements } from "@/lib/entitlements";
import { HttpError, toErrorResponse } from "@/lib/http";
import { productsOf, runPostPurchase } from "@/lib/provisioning";
import { stripe } from "@/lib/stripe";
import { supabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";

export interface CheckoutVerifyResponse {
  status: "fulfilled" | "pending";
  /** True when the buyer is not signed in here and must use the emailed link. */
  guest: boolean;
  emailHint: string | null;
  productIds: ProductId[];
  entitlements: ProductId[];
  amountTotal: number;
  currency: string;
  redirectTo: string;
}

/**
 * Called by the success page. Fulfills straight from Stripe's record so access
 * is instant even if the webhook is late. Fulfillment, the access email, and
 * ad conversions are all idempotent, so the webhook can run the same steps.
 */
export async function GET(request: NextRequest) {
  await connection();
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
      throw new HttpError(400, "invalid_session", "Missing or malformed checkout session.");
    }

    const supabase = supabasePublicConfig() ? await createSupabaseServerClient() : null;
    const user = supabase ? await getSessionUser(supabase) : null;
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    if (session.client_reference_id && user && session.client_reference_id !== user.id) {
      throw new HttpError(403, "forbidden", "This checkout belongs to a different account.");
    }

    const outcome = await fulfillCheckoutSession(session);
    if (outcome.status === "fulfilled") {
      after(() => runPostPurchase(session, outcome.userId));
    }

    const signedInBuyer = Boolean(user && outcome.status === "fulfilled" && outcome.userId === user.id);
    const entitlements = signedInBuyer && supabase && user ? await getEntitlements(supabase, user.id) : [];
    const productIds = productsOf(session);
    const email = session.customer_details?.email ?? null;
    return NextResponse.json<CheckoutVerifyResponse>(
      {
        status: outcome.status === "fulfilled" ? "fulfilled" : "pending",
        guest: !signedInBuyer,
        emailHint: email ? maskEmail(email) : null,
        productIds,
        entitlements,
        amountTotal: (session.amount_total ?? 0) / 100,
        currency: (session.currency ?? "usd").toUpperCase(),
        redirectTo: productIds[0] ? `/dashboard?welcome=${productIds[0]}` : "/dashboard",
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return toErrorResponse(error, "api/checkout/verify");
  }
}
