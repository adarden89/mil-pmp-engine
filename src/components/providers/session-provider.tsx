"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { EntitlementsResponse } from "@/app/api/entitlements/route";
import { apiFetch } from "@/lib/api-client";
import type { ProductId } from "@/lib/catalog";

interface SessionState {
  status: "loading" | "ready";
  signedIn: boolean;
  email: string | null;
  entitlements: ProductId[];
  owns: (productId: ProductId) => boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

async function loadSession(): Promise<EntitlementsResponse | null> {
  const result = await apiFetch<EntitlementsResponse>("/api/entitlements", { cache: "no-store" });
  return result.ok ? result.data : null;
}

/**
 * Loads the signed-in user and their products on the client so every page
 * can stay a static shell. Server routes still enforce access on every call.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionState["status"]>("loading");
  const [data, setData] = useState<EntitlementsResponse>({ signedIn: false, email: null, entitlements: [] });

  const refresh = useCallback(async () => {
    const next = await loadSession();
    if (next) setData(next);
    setStatus("ready");
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadSession().then((next) => {
      if (cancelled) return;
      if (next) setData(next);
      setStatus("ready");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      status,
      ...data,
      owns: (productId) => data.entitlements.includes(productId),
      refresh,
    }),
    [status, data, refresh],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
