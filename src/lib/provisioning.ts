import "server-only";
import type Stripe from "stripe";
import { isProductId, type ProductId } from "@/lib/catalog";
import { sendEmail } from "@/lib/email";
import { renderAccessEmail } from "@/lib/emails/access-email";
import { siteUrl } from "@/lib/env";
import { CHECKOUT_METADATA_KEYS, decodeProductIds } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { reportCheckoutPurchase } from "@/lib/tracking/purchase";

/**
 * Zero-touch account provisioning for buyers who check out without signing in,
 * plus the post-purchase side effects (access email, ad conversions). Every
 * step is idempotent so the webhook and the success page can both call it.
 */

const MAX_USER_SCAN_PAGES = 10;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Find the Supabase user for an email, creating a confirmed account if none exists. */
export async function findOrCreateUserByEmail(rawEmail: string): Promise<string> {
  const email = normalizeEmail(rawEmail);
  const db = supabaseAdmin();

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (profileError) throw new Error(`profile lookup: ${profileError.message}`);
  if (profile) return profile.id;

  // The buyer proved control of a payment method with this email at Stripe;
  // the account is only reachable through sign-in links sent to it.
  const { data: created, error: createError } = await db.auth.admin.createUser({ email, email_confirm: true });
  if (created.user) return created.user.id;

  if (createError?.code !== "email_exists") {
    throw new Error(`create user: ${createError?.message ?? "unknown error"}`);
  }
  // Exists in auth but not in profiles (created before the trigger, or a race).
  for (let page = 1; page <= MAX_USER_SCAN_PAGES; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`list users: ${error.message}`);
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 1000) break;
  }
  throw new Error("user reported as existing but could not be found");
}

/**
 * One-time sign-in link. It points at our own /auth/confirm page (not
 * Supabase's verify URL) so email link scanners cannot consume the token.
 */
export async function createSignInLink(email: string, nextPath = "/dashboard"): Promise<string> {
  const { data, error } = await supabaseAdmin().auth.admin.generateLink({
    type: "magiclink",
    email: normalizeEmail(email),
  });
  if (error || !data.properties?.hashed_token) {
    throw new Error(`generate link: ${error?.message ?? "no token returned"}`);
  }
  const url = new URL("/auth/confirm", siteUrl());
  url.searchParams.set("token_hash", data.properties.hashed_token);
  url.searchParams.set("type", "magiclink");
  url.searchParams.set("next", nextPath);
  return url.toString();
}

async function claimEmail(dedupeKey: string, to: string, kind: string): Promise<boolean> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("email_deliveries")
    .upsert(
      { dedupe_key: dedupeKey, kind, to_email: to, status: "pending" },
      { onConflict: "dedupe_key", ignoreDuplicates: true },
    )
    .select("id");
  if (error) throw new Error(`email ledger: ${error.message}`);
  if (data.length > 0) return true;
  const { data: retried, error: retryError } = await db
    .from("email_deliveries")
    .update({ status: "pending", updated_at: new Date().toISOString() })
    .eq("dedupe_key", dedupeKey)
    .eq("status", "failed")
    .select("id");
  if (retryError) throw new Error(`email ledger: ${retryError.message}`);
  return retried.length > 0;
}

export type AccessEmailResult = "sent" | "duplicate" | "failed";

export async function sendAccessEmail(
  dedupeKey: string,
  email: string,
  products: readonly ProductId[],
): Promise<AccessEmailResult> {
  const to = normalizeEmail(email);
  if (!(await claimEmail(dedupeKey, to, "purchase_access"))) return "duplicate";
  const db = supabaseAdmin();
  try {
    const loginUrl = await createSignInLink(to, `/dashboard?welcome=${products[0] ?? ""}`);
    const message = renderAccessEmail({ loginUrl, products, siteUrl: siteUrl() });
    const { id } = await sendEmail({ to, ...message, tags: [{ name: "kind", value: "purchase_access" }] }, dedupeKey);
    await db
      .from("email_deliveries")
      .update({ status: "sent", provider_message_id: id, last_error: null, updated_at: new Date().toISOString() })
      .eq("dedupe_key", dedupeKey);
    return "sent";
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(`[provisioning] access email ${dedupeKey} failed: ${message}`);
    await db
      .from("email_deliveries")
      .update({ status: "failed", last_error: message.slice(0, 500), updated_at: new Date().toISOString() })
      .eq("dedupe_key", dedupeKey);
    return "failed";
  }
}

export function productsOf(session: Stripe.Checkout.Session): ProductId[] {
  return decodeProductIds(session.metadata?.[CHECKOUT_METADATA_KEYS.productIds]).filter(isProductId);
}

/**
 * Everything that happens after access is granted. Runs inside after(), so it
 * never delays or fails the Stripe webhook response.
 */
export async function runPostPurchase(session: Stripe.Checkout.Session, userId: string, occurredAt?: number) {
  const email = session.customer_details?.email;
  const [emailResult, conversions] = await Promise.allSettled([
    email ? sendAccessEmail(`access:${session.id}`, email, productsOf(session)) : Promise.resolve("failed" as const),
    reportCheckoutPurchase(session, userId, occurredAt),
  ]);
  if (emailResult.status === "rejected") console.error("[provisioning] access email crashed", emailResult.reason);
  if (conversions.status === "rejected")
    console.error("[provisioning] conversion reporting crashed", conversions.reason);
}
