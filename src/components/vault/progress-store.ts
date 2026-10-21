"use client";

import type { CardProgress, ProgressMap } from "@/lib/leitner";

/**
 * Flashcard progress in localStorage, exposed as an external store for
 * useSyncExternalStore. The server renders with an empty snapshot and the
 * client switches to stored progress after hydration, with no mismatch.
 */

const STORAGE_KEY = "miltopmp:flashcards:v1";
const EMPTY: ProgressMap = Object.freeze({}) as ProgressMap;
const listeners = new Set<() => void>();
let cache: ProgressMap | null = null;

function read(): ProgressMap {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: ProgressMap): void {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: progress still lives in memory for this visit.
  }
  for (const listener of listeners) listener();
}

export const progressStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: read,
  getServerSnapshot: (): ProgressMap => EMPTY,
  replace: write,
  upsert(entry: CardProgress): void {
    write({ ...read(), [entry.cardId]: entry });
  },
  reset(): void {
    write({});
  },
};
