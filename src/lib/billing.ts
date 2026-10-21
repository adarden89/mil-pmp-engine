import "server-only";
import Stripe from "stripe";
import { PRODUCTS, type ProductId } from "@/lib/catalog";
import { siteUrl } from "@/lib/env";
import { fulfillUpsellPaymentIntent } from "@/lib/entitlements";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { SessionUser } from "@/lib/supabase/server";
import { CHECKOUT_METADATA_KEYS, encodeProductIds, stripe } from "@/lib/stripe";

interface CustomerRecord {
  customerId: string;
  defaultPaymentMethodId: string | null;
}

export async function getOrCreateStripeCustomer(user: SessionUser): Promise<CustomerRecord> {
  const db = supabaseAdmin();
  const { data: existing, error } = await db
    .from("stripe_customers")
    .select("stripe_customer_id, default_payment_method_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load Stripe customer: ${error.message}`);
  if (existing) {
    return {
      customerId: existing.stripe_customer_id,
      defaultPaymentMethodId: existing.default_payment_method_id,
    };
  }

  const customer = await stripe().customers.create(
    { email: user.email ?? undefined, metadata: { [CHECKOUT_METADATA_KEYS.userId]: user.id } },
    // Two concurrent first purchases must not create two Stripe customers.
    { idempotencyKey: `customer-create-${user.id}` },
  );
  const { error: insertError } = await db
    .from("stripe_customers")
    .upsert({ user_id: user.id, stripe_customer_id: customer.id }, { onConflict: "user_id", ignoreDuplicates: true });
  if (insertError) throw new Error(`Failed to save Stripe customer: ${insertError.message}`);
  return { customerId: customer.id, defaultPaymentMethodId: null };
}

function paymentMetadata(userId: string, productIds: readonly ProductId[], source: "checkout" | "upsell") {
  return {
    [CHECKOUT_METADATA_KEYS.userId]: userId,
    [CHECKOUT_METADATA_KEYS.productIds]: encodeProductIds(productIds),
    [CHECKOUT_METADATA_KEYS.source]: source,
  };
}

/** Hosted Checkout for one or more products. Saves the card for later 1-click add-ons. */
export async function createCheckoutSession(user: SessionUser, productIds: readonly ProductId[]): Promise<string> {
  const { customerId } = await getOrCreateStripeCustomer(user);
  const metadata = paymentMetadata(user.id, productIds, "checkout");
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    client_reference_id: user.id,
    line_items: productIds.map((id) => ({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: PRODUCTS[id].priceCents,
        product_data: {
          name: PRODUCTS[id].name,
          description: PRODUCTS[id].headline,
          metadata: { product_id: id },
        },
      },
    })),
    metadata,
    payment_intent_data: { setup_future_usage: "off_session", metadata },
    custom_text: {
      submit: {
        message:
          "Your card is saved securely by Stripe so you can add MilToPMP add-ons in one click later. You can ask us to remove it at any time.",
      },
    },
    allow_promotion_codes: true,
    success_url: `${siteUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/?checkout=cancelled#pricing`,
  });
  if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
  return session.url;
}

export type UpsellResult =
  | { status: "unlocked"; productId: ProductId; redirectTo: string }
  | { status: "processing"; productId: ProductId }
  | { status: "redirect"; url: string; reason: string };

/**
 * True 1-click purchase: charge the card saved at the first checkout,
 * off-session. Falls back to hosted Checkout when there is no saved card or
 * the bank requires the cardholder to authenticate.
 */
export async function chargeUpsell(user: SessionUser, productId: ProductId): Promise<UpsellResult> {
  const { customerId, defaultPaymentMethodId } = await getOrCreateStripeCustomer(user);
  if (!defaultPaymentMethodId) {
    return {
      status: "redirect",
      url: await createCheckoutSession(user, [productId]),
      reason: "no_saved_card",
    };
  }

  const product = PRODUCTS[productId];
  try {
    const paymentIntent = await stripe().paymentIntents.create(
      {
        amount: product.priceCents,
        currency: "usd",
        customer: customerId,
        payment_method: defaultPaymentMethodId,
        off_session: true,
        confirm: true,
        description: `${product.name} (1-click add-on)`,
        metadata: paymentMetadata(user.id, [productId], "upsell"),
      },
      // Collapses double-clicks inside the same minute into one charge.
      { idempotencyKey: `upsell-${user.id}-${productId}-${Math.floor(Date.now() / 60_000)}` },
    );

    if (paymentIntent.status === "succeeded") {
      await fulfillUpsellPaymentIntent(paymentIntent);
      return { status: "unlocked", productId, redirectTo: product.unlocksPath };
    }
    if (paymentIntent.status === "processing") {
      return { status: "processing", productId };
    }
    return {
      status: "redirect",
      url: await createCheckoutSession(user, [productId]),
      reason: "authentication_required",
    };
  } catch (error) {
    if (error instanceof Stripe.errors.StripeCardError) {
      return {
        status: "redirect",
        url: await createCheckoutSession(user, [productId]),
        reason: error.code === "authentication_required" ? "authentication_required" : "card_declined",
      };
    }
    throw error;
  }
}
