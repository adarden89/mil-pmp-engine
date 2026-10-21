import "server-only";
import type Stripe from "stripe";
import { isProductId, PRODUCTS, type ProductId } from "@/lib/catalog";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import { CHECKOUT_METADATA_KEYS, decodeProductIds, idOf, stripe } from "@/lib/stripe";

/** Active (non-revoked) products for a user, read with the user's own RLS-scoped client. */
export async function getEntitlements(supabase: AppSupabaseClient, userId: string): Promise<ProductId[]> {
  const { data, error } = await supabase
    .from("entitlements")
    .select("product_id")
    .eq("user_id", userId)
    .is("revoked_at", null);
  if (error) throw new Error(`Failed to load entitlements: ${error.message}`);
  return data.map((row) => row.product_id).filter(isProductId);
}

interface FulfillmentInput {
  userId: string;
  productIds: ProductId[];
  source: "checkout" | "upsell";
  checkoutSessionId: string | null;
  paymentIntentId: string | null;
  currency: string;
}

/**
 * Record purchases and grant entitlements. Safe to call any number of times
 * for the same payment: unique constraints on (payment, product) turn replays
 * into no-ops, and the entitlement upsert re-activates a previously revoked
 * product if it is bought again.
 */
async function grantProducts(input: FulfillmentInput): Promise<ProductId[]> {
  const db = supabaseAdmin();
  const conflictTarget = input.paymentIntentId
    ? "stripe_payment_intent_id,product_id"
    : "stripe_checkout_session_id,product_id";

  const { data: purchases, error: purchaseError } = await db
    .from("purchases")
    .upsert(
      input.productIds.map((productId) => ({
        user_id: input.userId,
        product_id: productId,
        amount_cents: PRODUCTS[productId].priceCents,
        currency: input.currency,
        source: input.source,
        stripe_checkout_session_id: input.checkoutSessionId,
        stripe_payment_intent_id: input.paymentIntentId,
      })),
      { onConflict: conflictTarget, ignoreDuplicates: false },
    )
    .select("id, product_id, status");
  if (purchaseError) throw new Error(`Failed to record purchase: ${purchaseError.message}`);

  // A webhook retry that arrives after a refund must not re-grant access.
  const paid = purchases.filter((row) => row.status === "paid");
  if (paid.length === 0) return [];
  const { error: entitlementError } = await db.from("entitlements").upsert(
    paid.map((row) => ({
      user_id: input.userId,
      product_id: row.product_id,
      purchase_id: row.id,
      revoked_at: null,
    })),
    { onConflict: "user_id,product_id" },
  );
  if (entitlementError) throw new Error(`Failed to grant entitlements: ${entitlementError.message}`);
  return paid.map((row) => row.product_id);
}

function productIdsFromMetadata(metadata: Stripe.Metadata | null | undefined): ProductId[] {
  return decodeProductIds(metadata?.[CHECKOUT_METADATA_KEYS.productIds]).filter(isProductId);
}

export async function saveCustomerPaymentMethod(
  userId: string,
  customerId: string,
  paymentMethodId: string | null,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("stripe_customers")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        ...(paymentMethodId ? { default_payment_method_id: paymentMethodId } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  if (error) throw new Error(`Failed to save Stripe customer: ${error.message}`);
}

export type FulfillmentOutcome =
  | { status: "fulfilled"; userId: string; productIds: ProductId[] }
  | { status: "pending"; reason: string }
  | { status: "ignored"; reason: string };

/** Fulfill a Checkout Session once Stripe reports it paid. */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<FulfillmentOutcome> {
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return { status: "pending", reason: `payment_status=${session.payment_status}` };
  }
  const userId = session.client_reference_id ?? session.metadata?.[CHECKOUT_METADATA_KEYS.userId];
  const productIds = productIdsFromMetadata(session.metadata);
  if (!userId || productIds.length === 0) {
    return { status: "ignored", reason: "session is missing user or product metadata" };
  }

  const paymentIntentId = idOf(session.payment_intent);
  const granted = await grantProducts({
    userId,
    productIds,
    source: "checkout",
    checkoutSessionId: session.id,
    paymentIntentId,
    currency: session.currency ?? "usd",
  });

  // Remember the card the buyer agreed to save so add-ons are one click.
  const customerId = idOf(session.customer);
  if (customerId && paymentIntentId) {
    const paymentIntent = await stripe().paymentIntents.retrieve(paymentIntentId);
    await saveCustomerPaymentMethod(userId, customerId, idOf(paymentIntent.payment_method));
  }
  return { status: "fulfilled", userId, productIds: granted };
}

/** Fulfill a 1-click upsell PaymentIntent. Checkout-created intents are ignored here. */
export async function fulfillUpsellPaymentIntent(paymentIntent: Stripe.PaymentIntent): Promise<FulfillmentOutcome> {
  if (paymentIntent.metadata?.[CHECKOUT_METADATA_KEYS.source] !== "upsell") {
    return { status: "ignored", reason: "not an upsell payment" };
  }
  if (paymentIntent.status !== "succeeded") {
    return { status: "pending", reason: `status=${paymentIntent.status}` };
  }
  const userId = paymentIntent.metadata[CHECKOUT_METADATA_KEYS.userId];
  const productIds = productIdsFromMetadata(paymentIntent.metadata);
  if (!userId || productIds.length === 0) {
    return { status: "ignored", reason: "payment intent is missing user or product metadata" };
  }
  const granted = await grantProducts({
    userId,
    productIds,
    source: "upsell",
    checkoutSessionId: null,
    paymentIntentId: paymentIntent.id,
    currency: paymentIntent.currency,
  });
  return { status: "fulfilled", userId, productIds: granted };
}

/** Revoke access for everything bought with a fully refunded payment. */
export async function revokeForPaymentIntent(paymentIntentId: string): Promise<number> {
  const db = supabaseAdmin();
  const { data: refunded, error } = await db
    .from("purchases")
    .update({ status: "refunded" })
    .eq("stripe_payment_intent_id", paymentIntentId)
    .select("id, user_id, product_id");
  if (error) throw new Error(`Failed to mark purchases refunded: ${error.message}`);

  for (const purchase of refunded) {
    const { error: revokeError } = await db
      .from("entitlements")
      .update({ revoked_at: new Date().toISOString() })
      .eq("user_id", purchase.user_id)
      .eq("product_id", purchase.product_id)
      .eq("purchase_id", purchase.id);
    if (revokeError) throw new Error(`Failed to revoke entitlement: ${revokeError.message}`);
  }
  return refunded.length;
}
