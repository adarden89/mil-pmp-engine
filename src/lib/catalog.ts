/**
 * Product catalog: the single source of truth for prices. Checkout sessions and
 * 1-click upsell PaymentIntents both read amounts from here, so the Stripe
 * dashboard never needs a matching Price object.
 *
 * There is deliberately no "compare at" price. Showing a crossed-out former
 * price the product never sold at is a fictitious reference price, which the
 * FTC Guides Against Deceptive Pricing (16 CFR 233.1) and state laws treat as
 * deceptive. The pricing page anchors on real exam fees instead (pmi-facts.ts).
 */

export const PRODUCT_IDS = ["base_tool", "cool_fast_track", "exam_vault", "expert_review"] as const;
export type ProductId = (typeof PRODUCT_IDS)[number];

export interface Product {
  id: ProductId;
  name: string;
  shortName: string;
  priceCents: number;
  /**
   * base: the entry product. addon: software extras sold in checkout and in 1
   * click. service: human-delivered work, sold only when the server enables it.
   */
  kind: "base" | "addon" | "service";
  headline: string;
  features: readonly string[];
  /** Route the buyer lands on first after this product unlocks. */
  unlocksPath: string;
}

export const PRODUCTS: Record<ProductId, Product> = {
  base_tool: {
    id: "base_tool",
    name: "MilToPMP Core Translator",
    shortName: "Core Translator",
    priceCents: 2499,
    kind: "base",
    headline: "Build a PMI application written to hold up in an audit.",
    features: [
      "AI Military-to-PMI Translation Studio (40 translations / 30 days)",
      "Audit-density scoring on every project write-up",
      "PDF export of your application-ready experience",
      "Personal dashboard with CAPM / PMP readiness plan",
      "Copy-ready text for every PMI experience field",
    ],
    unlocksPath: "/dashboard/translator",
  },
  cool_fast_track: {
    id: "cool_fast_track",
    name: "Navy COOL Fast-Track Guide",
    shortName: "COOL Fast-Track",
    priceCents: 999,
    kind: "addon",
    headline: "Walk into your command with every OPNAV 1500/57 field ready and the timing checked.",
    features: [
      "OPNAV 1500/57 prep packet: every field, pre-filled from your answers",
      "Navy COOL timing check (EAOS and 60-day separation rules)",
      "Routing memo for your approving official",
      "Pre-filled JST audit checklist and funding worksheet (all branches)",
      "Versions for Navy, Army, Air Force, Marine Corps, and Coast Guard programs",
    ],
    unlocksPath: "/funding#opnav-1500-57",
  },
  exam_vault: {
    id: "exam_vault",
    name: "Zero-Knowledge Study Vault",
    shortName: "Study Vault",
    priceCents: 1999,
    kind: "addon",
    headline: "Spaced-repetition flashcards that start from zero and end exam-ready.",
    features: [
      "Full deck across PM Fundamentals, Agile / Scrum, Predictive, Hybrid, and Business Analysis",
      "2026 PMP Business Environment modules: strategy, governance, value, AI, and sustainability",
      "Mapped to the CAPM domains and to the 2026 PMP domain weights (People 33%, Process 41%, Business Environment 26%)",
      "Leitner-box retention tracking synced to your account",
      "Top trainer and tool breakdown: Study Hall, Pocket Prep, Ramdayal, Phillips, O2O",
    ],
    unlocksPath: "/vault",
  },
  expert_review: {
    id: "expert_review",
    name: "Human Expert Application Review",
    shortName: "Expert Review",
    priceCents: 29900,
    kind: "service",
    headline: "A human reviewer checks your project descriptions and verification packet before you submit to PMI.",
    features: [
      "Line-by-line review of your translated project descriptions against your own evaluations",
      "A check of your supervisor verification packet before you send it",
      "Written fixes for every audit flag",
      "We never add experience you did not do, and no one can guarantee the outcome of a PMI audit",
    ],
    unlocksPath: "/dashboard/verification",
  },
};

export const ADDON_IDS: readonly ProductId[] = PRODUCT_IDS.filter((id) => PRODUCTS[id].kind === "addon");
export const SERVICE_IDS: readonly ProductId[] = PRODUCT_IDS.filter((id) => PRODUCTS[id].kind === "service");

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
 * nobody pays twice. Services are rejected unless the server has enabled them.
 */
export function validateCart(
  requested: readonly ProductId[],
  owned: readonly ProductId[],
  { servicesEnabled = false }: { servicesEnabled?: boolean } = {},
): CartValidation {
  const products = [...new Set(requested)];
  if (products.length === 0) {
    return { ok: false, reason: "Select at least one product." };
  }
  const service = products.find((id) => SERVICE_IDS.includes(id));
  if (service && !servicesEnabled) {
    return { ok: false, reason: `${PRODUCTS[service].name} is not available yet.` };
  }
  const duplicate = products.find((id) => owned.includes(id));
  if (duplicate) {
    return { ok: false, reason: `You already own ${PRODUCTS[duplicate].name}.` };
  }
  const hasBase = products.includes("base_tool") || owned.includes("base_tool");
  if (!hasBase) {
    return { ok: false, reason: "Add-ons require the MilToPMP Core Translator." };
  }
  return { ok: true, products };
}
