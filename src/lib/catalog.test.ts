import { describe, expect, it } from "vitest";
import { cartTotalCents, isProductId, PRODUCTS, validateCart } from "./catalog";

describe("catalog", () => {
  it("prices the three tiers and the review service as specified", () => {
    expect(PRODUCTS.base_tool.priceCents).toBe(2499);
    expect(PRODUCTS.cool_fast_track.priceCents).toBe(999);
    expect(PRODUCTS.exam_vault.priceCents).toBe(1999);
    expect(PRODUCTS.expert_review.priceCents).toBe(29900);
  });

  it("produces the three advertised order totals", () => {
    expect(cartTotalCents(["base_tool"])).toBe(2499);
    expect(cartTotalCents(["base_tool", "cool_fast_track"])).toBe(3498);
    expect(cartTotalCents(["base_tool", "cool_fast_track", "exam_vault"])).toBe(5497);
  });

  it("totals a cart without double counting duplicates", () => {
    expect(cartTotalCents(["base_tool", "exam_vault", "exam_vault"])).toBe(4498);
    expect(cartTotalCents(["base_tool", "cool_fast_track", "exam_vault"])).toBe(5497);
  });

  it("recognizes only known product ids", () => {
    expect(isProductId("exam_vault")).toBe(true);
    expect(isProductId("free_pmp")).toBe(false);
  });
});

describe("validateCart", () => {
  it("rejects an add-on bought without the base tool", () => {
    expect(validateCart(["exam_vault"], [])).toEqual({
      ok: false,
      reason: "Add-ons require the MilToPMP Core Translator.",
    });
  });

  it("accepts an add-on for an existing base-tool owner", () => {
    expect(validateCart(["exam_vault"], ["base_tool"])).toEqual({ ok: true, products: ["exam_vault"] });
  });

  it("rejects products the buyer already owns", () => {
    const result = validateCart(["base_tool"], ["base_tool"]);
    expect(result.ok).toBe(false);
  });

  it("sells the expert review only when services are enabled, and only to base owners", () => {
    expect(validateCart(["expert_review"], ["base_tool"]).ok).toBe(false);
    expect(validateCart(["expert_review"], ["base_tool"], { servicesEnabled: true }).ok).toBe(true);
    expect(validateCart(["expert_review"], [], { servicesEnabled: true }).ok).toBe(false);
  });

  it("accepts base plus add-ons in one cart", () => {
    expect(validateCart(["base_tool", "cool_fast_track"], [])).toEqual({
      ok: true,
      products: ["base_tool", "cool_fast_track"],
    });
  });
});
