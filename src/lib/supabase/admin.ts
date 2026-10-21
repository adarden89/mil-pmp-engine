import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";
import type { Database } from "./database.types";
import type { AppSupabaseClient } from "./server";

let adminClient: AppSupabaseClient | undefined;

/**
 * Service-role client. Bypasses RLS, so it is only used for writes users must
 * never make themselves: purchases, entitlements, Stripe state, usage ledger.
 */
export function supabaseAdmin(): AppSupabaseClient {
  if (!adminClient) {
    adminClient = createClient<Database>(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return adminClient;
}
