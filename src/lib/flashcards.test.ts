import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  CATEGORY_GROUPS,
  cardsForAccess,
  FLASHCARD_IDS,
  FLASHCARDS,
  PMP_DOMAIN_WEIGHT,
} from "./flashcards";

describe("flashcard deck", () => {
  it("has unique ids", () => {
    expect(FLASHCARD_IDS.size).toBe(FLASHCARDS.length);
  });

  it("covers every category with a free sample of two cards each", () => {
    for (const category of CATEGORIES) {
      const inCategory = FLASHCARDS.filter((card) => card.category === category);
      expect(inCategory.length).toBeGreaterThanOrEqual(6);
      expect(inCategory.filter((card) => card.free)).toHaveLength(2);
    }
  });

  it("gives the full deck only to vault owners", () => {
    expect(cardsForAccess(true)).toHaveLength(FLASHCARDS.length);
    expect(cardsForAccess(false)).toHaveLength(CATEGORIES.length * 2);
  });

  it("uses the July 2026 PMP domain weights", () => {
    expect(PMP_DOMAIN_WEIGHT).toEqual({ people: 33, process: 41, business_environment: 26 });
    expect(Object.values(PMP_DOMAIN_WEIGHT).reduce((sum, weight) => sum + weight, 0)).toBe(100);
  });

  it("places every category in exactly one group", () => {
    const grouped = CATEGORY_GROUPS.flatMap((group) => group.categories);
    expect([...grouped].sort()).toEqual([...CATEGORIES].sort());
  });

  it("covers the 2026 Business Environment topics", () => {
    for (const category of ["strategy_governance", "value_realization", "ai_delivery", "sustainability"] as const) {
      expect(FLASHCARDS.filter((card) => card.category === category).length).toBeGreaterThanOrEqual(6);
    }
  });
});
