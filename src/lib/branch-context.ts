"use client";

import { useSyncExternalStore } from "react";
import type { RankBand } from "./eligibility";
import { BRANCHES, type Branch } from "./translation-schema";
import { RANK_BANDS } from "./eligibility";

/**
 * Which branch (and pay grade band) the visitor identified with, from a
 * /start/[branch] landing page or the eligibility quiz. Stored on this device
 * only. It pre-selects the quiz and funding guide and, when the visitor allows
 * ad measurement, is attached to checkout as coarse context.
 */
export interface BranchContext {
  branch: Branch;
  paygradeGroup: RankBand | null;
  /** Path of the landing page that set it, e.g. "/start/navy". */
  landingPath: string | null;
  updatedAt: string;
}

const KEY = "miltopmp:branch-context:v1";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedValue: BranchContext | null = null;

function parse(raw: string | null): BranchContext | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<BranchContext>;
    if (!value.branch || !(BRANCHES as readonly string[]).includes(value.branch)) return null;
    return {
      branch: value.branch,
      paygradeGroup:
        value.paygradeGroup && (RANK_BANDS as readonly string[]).includes(value.paygradeGroup)
          ? value.paygradeGroup
          : null,
      landingPath: typeof value.landingPath === "string" ? value.landingPath.slice(0, 200) : null,
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

function read(): BranchContext | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return null;
  }
  // useSyncExternalStore needs a stable snapshot between changes.
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parse(raw);
  }
  return cachedValue;
}

export const branchContextStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  get: read,
  getServer(): BranchContext | null {
    return null;
  },
  /** Merge a change; switching branch clears a pay grade chosen for the old one only if none is given. */
  set(patch: Partial<Omit<BranchContext, "updatedAt">> & { branch: Branch }): void {
    const current = read();
    const next: BranchContext = {
      branch: patch.branch,
      paygradeGroup: patch.paygradeGroup !== undefined ? patch.paygradeGroup : (current?.paygradeGroup ?? null),
      landingPath: patch.landingPath !== undefined ? patch.landingPath : (current?.landingPath ?? null),
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: the context lasts for this page view only.
      cachedRaw = JSON.stringify(next);
      cachedValue = next;
    }
    for (const listener of listeners) listener();
  },
  clear(): void {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // Nothing stored.
    }
    cachedRaw = undefined;
    cachedValue = null;
    for (const listener of listeners) listener();
  },
};

export function useBranchContext(): BranchContext | null {
  return useSyncExternalStore(branchContextStore.subscribe, branchContextStore.get, branchContextStore.getServer);
}
