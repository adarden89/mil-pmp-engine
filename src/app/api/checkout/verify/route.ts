import { connection, NextResponse, type NextRequest } from "next/server";
import type { ProductId } from "@/lib/catalog";
import { fulfillCheckoutSession, getEntitlements } from "@/lib/entitlements";
import { HttpError, toErrorResponse } from "@/lib/http";
import { stripe } from "@/lib/stripe";
import { requireUser } from "@/lib/supabase/server";

export interface CheckoutVerifyResponse {
  status: "fulfilled" | "pending";
  entitlements: ProductId[];
  redirectTo: string;
}

/**
 * Called by the success page. It fulfills the session directly from Stripe's
 * record so the buyer lands in an unlocked dashboard immediately, even if the
 * webhook has not arrived yet. Fulfillment is idempotent, so the webhook and
 * this route can both run safely.
 */
export async function GET(request: NextRequest) {
  await connection();
  try {
    const { user, supabase } = await requireUser();
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId || !sessionId.startsWith("cs_")) {
      throw new HttpError(400, "invalid_session", "Missing or malformed checkout session.");
    }

    const session = await stripe().checkout.sessions.retrieve(sessionId);
    if (session.client_reference_id !== user.id) {
      throw new HttpError(403, "forbidden", "This checkout belongs to a different account.");
    }

    const outcome = await fulfillCheckoutSession(session);
    const entitlements = await getEntitlements(supabase, user.id);
    const firstUnlocked = outcome.status === "fulfilled" ? outcome.productIds[0] : undefined;
    return NextResponse.json<CheckoutVerifyResponse>({
      status: outcome.status === "fulfilled" ? "fulfilled" : "pending",
      entitlements,
      redirectTo: firstUnlocked ? `/dashboard?welcome=${firstUnlocked}` : "/dashboard",
    });
  } catch (error) {
    return toErrorResponse(error, "api/checkout/verify");
  }
}
