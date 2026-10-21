import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { ConfigError, requireEnv } from "@/lib/env";
import { fulfillCheckoutSession, fulfillUpsellPaymentIntent, revokeForPaymentIntent } from "@/lib/entitlements";
import { jsonError, toErrorResponse } from "@/lib/http";
import { idOf, stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Stripe webhook. Configure the endpoint in Stripe for:
 *   checkout.session.completed
 *   checkout.session.async_payment_succeeded
 *   payment_intent.succeeded
 *   charge.refunded
 *
 * Events are recorded in stripe_events. An event is only marked processed
 * after its handler succeeds, so a failure returns 500 and Stripe retries.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return jsonError(400, "missing_signature", "Missing Stripe signature.");
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = await stripe().webhooks.constructEventAsync(payload, signature, requireEnv("STRIPE_WEBHOOK_SECRET"));
  } catch (error) {
    if (error instanceof ConfigError) {
      return toErrorResponse(error, "webhooks/stripe");
    }
    console.warn("[webhooks/stripe] signature verification failed");
    return jsonError(400, "invalid_signature", "Webhook signature verification failed.");
  }

  try {
    const db = supabaseAdmin();
    const { data: existing, error: lookupError } = await db
      .from("stripe_events")
      .select("processed_at")
      .eq("id", event.id)
      .maybeSingle();
    if (lookupError) throw new Error(`Failed to read event ledger: ${lookupError.message}`);
    if (existing?.processed_at) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    if (!existing) {
      const { error: insertError } = await db
        .from("stripe_events")
        .upsert({ id: event.id, type: event.type }, { onConflict: "id", ignoreDuplicates: true });
      if (insertError) throw new Error(`Failed to record event: ${insertError.message}`);
    }

    await handleEvent(event);

    const { error: markError } = await db
      .from("stripe_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", event.id);
    if (markError) throw new Error(`Failed to mark event processed: ${markError.message}`);

    return NextResponse.json({ received: true });
  } catch (error) {
    return toErrorResponse(error, `webhooks/stripe ${event.type} ${event.id}`);
  }
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const outcome = await fulfillCheckoutSession(event.data.object);
      if (outcome.status !== "fulfilled") {
        console.info(`[webhooks/stripe] ${event.type} ${outcome.status}: ${outcome.reason}`);
      }
      return;
    }
    case "payment_intent.succeeded": {
      await fulfillUpsellPaymentIntent(event.data.object);
      return;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      const paymentIntentId = idOf(charge.payment_intent);
      // Partial refunds keep access; a full refund revokes it.
      if (charge.refunded && paymentIntentId) {
        await revokeForPaymentIntent(paymentIntentId);
      }
      return;
    }
    default:
      return;
  }
}
