import "server-only";
import Stripe from "stripe";
import { requireEnv } from "@/lib/env";

let stripeClient: Stripe | undefined;

/** Lazily constructed so builds and pages without Stripe keys still work. */
export function stripe(): Stripe {
  stripeClient ??= new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    appInfo: { name: "MilToPMP Enterprise" },
    maxNetworkRetries: 2,
  });
  return stripeClient;
}

export const CHECKOUT_METADATA_KEYS = {
  userId: "user_id",
  productIds: "product_ids",
  source: "source",
} as const;

export function encodeProductIds(ids: readonly string[]): string {
  return ids.join(",");
}

export function decodeProductIds(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}
