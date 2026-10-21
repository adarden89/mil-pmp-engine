"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabasePublicConfig } from "./config";
import type { Database } from "./database.types";

let browserClient: SupabaseClient<Database> | undefined;

/** Browser client, or null when Supabase is not configured for this deployment. */
export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  const config = supabasePublicConfig();
  if (!config) return null;
  browserClient ??= createBrowserClient<Database>(config.url, config.publishableKey);
  return browserClient;
}
