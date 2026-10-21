import { describe, expect, it } from "vitest";
import { CATEGORIES, cardsForAccess, FLASHCARD_IDS, FLASHCARDS } from "./flashcards";

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
    expect(cardsForAccess(false)).toHaveLength(10);
  });
});
