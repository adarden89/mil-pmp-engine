import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { ConfigError } from "@/lib/env";
import { HttpError } from "@/lib/http";
import { supabasePublicConfig } from "./config";
import type { Database } from "./database.types";

export type AppSupabaseClient = SupabaseClient<Database>;

export interface SessionUser {
  id: string;
  email: string | null;
}

/** Request-scoped client that acts as the signed-in user (RLS applies). */
export async function createSupabaseServerClient(): Promise<AppSupabaseClient> {
  const config = supabasePublicConfig();
  if (!config) {
    throw new ConfigError("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }
  const cookieStore = await cookies();
  return createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies. proxy.ts refreshes the
          // session on every request, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Verified identity of the caller, or null when signed out. getClaims()
 * validates the JWT signature rather than trusting the cookie contents.
 */
export async function getSessionUser(supabase?: AppSupabaseClient): Promise<SessionUser | null> {
  if (!supabasePublicConfig()) return null;
  const client = supabase ?? (await createSupabaseServerClient());
  const { data, error } = await client.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  return { id: data.claims.sub, email };
}

/** For route handlers: resolve the user or throw a 401. */
export async function requireUser(): Promise<{ user: SessionUser; supabase: AppSupabaseClient }> {
  const supabase = await createSupabaseServerClient();
  const user = await getSessionUser(supabase);
  if (!user) {
    throw new HttpError(401, "unauthenticated", "Sign in to continue.");
  }
  return { user, supabase };
}
