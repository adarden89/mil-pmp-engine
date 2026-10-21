import { describe, expect, it } from "vitest";
import {
  buildStudyQueue,
  isDue,
  MAX_BOX,
  mergeProgress,
  reviewCard,
  summarizeRetention,
  type ProgressMap,
} from "./leitner";

const NOW = new Date("2026-10-01T12:00:00.000Z");

describe("reviewCard", () => {
  it("promotes a correct first answer from box 1 to box 2, due in one day", () => {
    const result = reviewCard(undefined, "c1", true, NOW);
    expect(result.box).toBe(2);
    expect(result.correct).toBe(1);
    expect(result.dueAt).toBe("2026-10-02T12:00:00.000Z");
  });

  it("resets a missed card to box 1 and makes it due immediately", () => {
    const start = { ...reviewCard(undefined, "c1", true, NOW), box: 4 };
    const result = reviewCard(start, "c1", false, NOW);
    expect(result.box).toBe(1);
    expect(result.incorrect).toBe(1);
    expect(isDue(result, NOW)).toBe(true);
  });

  it("never promotes beyond the last box", () => {
    const start = { ...reviewCard(undefined, "c1", true, NOW), box: MAX_BOX };
    expect(reviewCard(start, "c1", true, NOW).box).toBe(MAX_BOX);
  });
});

describe("buildStudyQueue", () => {
  it("puts overdue cards before unseen cards and skips cards not yet due", () => {
    const cards = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    const progress: ProgressMap = {
      a: { ...reviewCard(undefined, "a", true, NOW), dueAt: "2026-10-05T00:00:00.000Z" },
      b: { ...reviewCard(undefined, "b", false, NOW), dueAt: "2026-09-30T00:00:00.000Z" },
      c: { ...reviewCard(undefined, "c", false, NOW), dueAt: "2026-09-29T00:00:00.000Z" },
    };
    expect(buildStudyQueue(cards, progress, NOW).map((card) => card.id)).toEqual(["c", "b", "d"]);
  });
});

describe("summarizeRetention", () => {
  it("counts unseen cards as zero retention", () => {
    const cards = [{ id: "a" }, { id: "b" }];
    const progress: ProgressMap = { a: { ...reviewCard(undefined, "a", true, NOW), box: 5 } };
    expect(summarizeRetention(cards, progress)).toEqual({
      total: 2,
      seen: 1,
      mastered: 1,
      retention: 50,
    });
  });
});

describe("mergeProgress", () => {
  it("keeps the most recently reviewed entry per card", () => {
    const older = reviewCard(undefined, "a", true, new Date("2026-09-01T00:00:00.000Z"));
    const newer = reviewCard(undefined, "a", false, new Date("2026-09-02T00:00:00.000Z"));
    expect(mergeProgress({ a: newer }, { a: older }).a).toBe(newer);
    expect(mergeProgress({ a: older }, { a: newer }).a).toBe(newer);
  });
});
