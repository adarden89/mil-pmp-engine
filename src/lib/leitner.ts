/**
 * Leitner-box spaced repetition. A correct answer promotes a card one box and
 * pushes its next review further out; a miss sends it back to box 1.
 */

export const MAX_BOX = 5;

/** Days until a card in each box is due again. Index 0 is unused. */
export const BOX_INTERVAL_DAYS = [0, 0, 1, 3, 7, 14] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface CardProgress {
  cardId: string;
  box: number;
  correct: number;
  incorrect: number;
  lastReviewedAt: string;
  dueAt: string;
}

export type ProgressMap = Record<string, CardProgress>;

export function reviewCard(
  previous: CardProgress | undefined,
  cardId: string,
  wasCorrect: boolean,
  now: Date = new Date(),
): CardProgress {
  const currentBox = previous?.box ?? 1;
  const box = wasCorrect ? Math.min(currentBox + 1, MAX_BOX) : 1;
  return {
    cardId,
    box,
    correct: (previous?.correct ?? 0) + (wasCorrect ? 1 : 0),
    incorrect: (previous?.incorrect ?? 0) + (wasCorrect ? 0 : 1),
    lastReviewedAt: now.toISOString(),
    dueAt: new Date(now.getTime() + BOX_INTERVAL_DAYS[box] * DAY_MS).toISOString(),
  };
}

export function isDue(progress: CardProgress | undefined, now: Date = new Date()): boolean {
  return !progress || new Date(progress.dueAt).getTime() <= now.getTime();
}

/** Overdue cards first (oldest due date first), then cards never seen, in deck order. */
export function buildStudyQueue<T extends { id: string }>(
  cards: readonly T[],
  progress: ProgressMap,
  now: Date = new Date(),
): T[] {
  const due = cards
    .filter((card) => progress[card.id] && isDue(progress[card.id], now))
    .sort((a, b) => progress[a.id].dueAt.localeCompare(progress[b.id].dueAt));
  const unseen = cards.filter((card) => !progress[card.id]);
  return [...due, ...unseen];
}

export interface RetentionSummary {
  total: number;
  seen: number;
  mastered: number;
  /** 0-100. Average box position across the whole set, so unseen cards count as zero. */
  retention: number;
}

export function summarizeRetention<T extends { id: string }>(
  cards: readonly T[],
  progress: ProgressMap,
): RetentionSummary {
  const total = cards.length;
  if (total === 0) return { total: 0, seen: 0, mastered: 0, retention: 0 };
  let seen = 0;
  let mastered = 0;
  let boxPoints = 0;
  for (const card of cards) {
    const entry = progress[card.id];
    if (!entry) continue;
    seen += 1;
    if (entry.box >= 4) mastered += 1;
    boxPoints += entry.box / MAX_BOX;
  }
  return { total, seen, mastered, retention: Math.round((boxPoints / total) * 100) };
}

/** Last-write-wins merge used when local progress meets server progress. */
export function mergeProgress(a: ProgressMap, b: ProgressMap): ProgressMap {
  const merged: ProgressMap = { ...a };
  for (const [id, entry] of Object.entries(b)) {
    const existing = merged[id];
    if (!existing || entry.lastReviewedAt > existing.lastReviewedAt) {
      merged[id] = entry;
    }
  }
  return merged;
}
