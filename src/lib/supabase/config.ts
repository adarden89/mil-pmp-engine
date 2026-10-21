/**
 * Public Supabase config. NEXT_PUBLIC_* values must be referenced literally so
 * Next.js can inline them into the browser bundle.
 */
export interface SupabasePublicConfig {
  url: string;
  publishableKey: string;
}

export function supabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // The legacy anon key works as a publishable key; accept either name.
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}
