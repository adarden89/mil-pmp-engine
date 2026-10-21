/**
 * Product catalog: the single source of truth for prices. Checkout sessions and
 * 1-click upsell PaymentIntents both read amounts from here, so the Stripe
 * dashboard never needs a matching Price object.
 */

export const PRODUCT_IDS = ["base_tool", "cool_fast_track", "exam_vault"] as const;
export type ProductId = (typeof PRODUCT_IDS)[number];

export interface Product {
  id: ProductId;
  name: string;
  shortName: string;
  priceCents: number;
  kind: "base" | "addon";
  headline: string;
  features: readonly string[];
  /** Route the buyer lands on first after this product unlocks. */
  unlocksPath: string;
}

export const PRODUCTS: Record<ProductId, Product> = {
  base_tool: {
    id: "base_tool",
    name: "MilToPMP Base Tool",
    shortName: "Base Tool",
    priceCents: 2700,
    kind: "base",
    headline: "Build a PMI application written to hold up in an audit.",
    features: [
      "AI Military-to-PMI Translation Studio (40 translations / 30 days)",
      "Audit-density scoring on every project write-up",
      "PDF export of your application-ready experience",
      "Personal dashboard with CAPM / PMP readiness plan",
      "Copy-ready text for every PMI experience field",
    ],
    unlocksPath: "/translate",
  },
  cool_fast_track: {
    id: "cool_fast_track",
    name: "COOL Voucher Fast-Track",
    shortName: "COOL Fast-Track",
    priceCents: 1200,
    kind: "addon",
    headline: "Show up to your ESO with a complete, pre-filled voucher packet.",
    features: [
      "Pre-filled Joint Services Transcript (JST) audit checklist (PDF)",
      "Pre-filled COOL voucher request prep worksheet (PDF)",
      "Command approval and ESO email templates",
      "Versions for Navy, Army, Air Force, Marine Corps, and Coast Guard programs",
    ],
    unlocksPath: "/funding#downloads",
  },
  exam_vault: {
    id: "exam_vault",
    name: "Master Exam Vault & Flashcard Suite",
    shortName: "Exam Vault",
    priceCents: 1700,
    kind: "addon",
    headline: "Spaced-repetition drills mapped to the current PMP exam outline.",
    features: [
      "Full flashcard deck across People, Process, and Business Environment",
      "Predictive, Agile, and Hybrid approach tagging",
      "Leitner-box retention tracking synced to your account",
      "Weak-domain analytics before you book the exam",
    ],
    unlocksPath: "/vault",
  },
};

export const ADDON_IDS: readonly ProductId[] = PRODUCT_IDS.filter((id) => PRODUCTS[id].kind === "addon");

export function isProductId(value: unknown): value is ProductId {
  return typeof value === "string" && (PRODUCT_IDS as readonly string[]).includes(value);
}

export function cartTotalCents(ids: readonly ProductId[]): number {
  return [...new Set(ids)].reduce((sum, id) => sum + PRODUCTS[id].priceCents, 0);
}

export type CartValidation = { ok: true; products: ProductId[] } | { ok: false; reason: string };

/**
 * Add-ons extend the base tool, so a cart must either contain the base tool or
 * belong to someone who already owns it. Already-owned items are rejected so
 * nobody pays twice.
 */
export function validateCart(requested: readonly ProductId[], owned: readonly ProductId[]): CartValidation {
  const products = [...new Set(requested)];
  if (products.length === 0) {
    return { ok: false, reason: "Select at least one product." };
  }
  const duplicate = products.find((id) => owned.includes(id));
  if (duplicate) {
    return { ok: false, reason: `You already own ${PRODUCTS[duplicate].name}.` };
  }
  const hasBase = products.includes("base_tool") || owned.includes("base_tool");
  if (!hasBase) {
    return { ok: false, reason: "Add-ons require the MilToPMP Base Tool." };
  }
  return { ok: true, products };
}
