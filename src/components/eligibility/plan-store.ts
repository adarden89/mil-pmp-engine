"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { PlanResponse } from "@/app/api/plan/route";
import { useSession } from "@/components/providers/session-provider";
import type { MapperSelection } from "@/lib/accidental-pm";
import { apiFetch } from "@/lib/api-client";
import { eligibilityInputSchema, type EligibilityInput } from "@/lib/eligibility";

/**
 * The member's plan: quiz answers, completed roadmap tasks, and mapper entries.
 * Lives in localStorage for everyone and syncs to Supabase when signed in.
 * Exposed as an external store so server render and hydration never disagree.
 */

export interface PlanState {
  input: EligibilityInput | null;
  completed: string[];
  mapper: MapperSelection[];
  updatedAt: string | null;
}

const STORAGE_KEY = "miltopmp:plan:v1";
const EMPTY: PlanState = Object.freeze({ input: null, completed: [], mapper: [], updatedAt: null }) as PlanState;
const listeners = new Set<() => void>();
let cache: PlanState | null = null;

function sanitize(raw: unknown): PlanState {
  if (!raw || typeof raw !== "object") return EMPTY;
  const value = raw as Partial<PlanState>;
  const input = eligibilityInputSchema.safeParse(value.input);
  return {
    input: input.success ? input.data : null,
    completed: Array.isArray(value.completed) ? value.completed.filter((id) => typeof id === "string") : [],
    mapper: Array.isArray(value.mapper)
      ? value.mapper.filter(
          (entry): entry is MapperSelection =>
            !!entry && typeof entry.dutyId === "string" && typeof entry.months === "number",
        )
      : [],
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
  };
}

function read(): PlanState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? sanitize(JSON.parse(raw)) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: PlanState): void {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the plan still works for this visit.
  }
  for (const listener of listeners) listener();
}

function update(patch: Partial<PlanState>): void {
  write({ ...read(), ...patch, updatedAt: new Date().toISOString() });
}

export const planStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: read,
  getServerSnapshot: (): PlanState => EMPTY,
  setInput(input: EligibilityInput): void {
    update({ input });
  },
  toggleTask(taskId: string): void {
    const completed = read().completed;
    update({
      completed: completed.includes(taskId) ? completed.filter((id) => id !== taskId) : [...completed, taskId],
    });
  },
  setMapper(mapper: MapperSelection[]): void {
    update({ mapper });
  },
  replace(next: PlanState): void {
    write(sanitize(next));
  },
  reset(): void {
    write({ ...EMPTY, updatedAt: new Date().toISOString() });
  },
};

export function usePlan(): PlanState {
  return useSyncExternalStore(planStore.subscribe, planStore.getSnapshot, planStore.getServerSnapshot);
}

/**
 * Two-way sync for signed-in members: pull once (newest copy wins), then push
 * local changes after a short debounce.
 */
export function usePlanSync(): void {
  const session = useSession();
  const plan = usePlan();
  const pulled = useRef(false);
  const signedIn = session.status === "ready" && session.signedIn;

  useEffect(() => {
    if (!signedIn || pulled.current) return;
    pulled.current = true;
    void apiFetch<PlanResponse>("/api/plan").then((result) => {
      if (!result.ok || !result.data.plan) return;
      const local = planStore.getSnapshot();
      const remote = result.data.plan;
      if (!local.updatedAt || (remote.updatedAt && remote.updatedAt > local.updatedAt)) {
        planStore.replace(remote);
      }
    });
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn || !pulled.current || !plan.updatedAt) return;
    const timer = setTimeout(() => {
      void apiFetch("/api/plan", { method: "PUT", body: JSON.stringify(plan) });
    }, 800);
    return () => clearTimeout(timer);
  }, [plan, signedIn]);
}
