import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";

const ALLOWED_TYPES: readonly EmailOtpType[] = ["magiclink", "email", "signup", "recovery", "invite", "email_change"];

/**
 * Verifies a one-time token from an emailed link. Only reachable by POST from
 * the /auth/confirm page, so link-scanning mail gateways (common on .mil
 * networks) cannot burn the token by prefetching it.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const tokenHash = String(form.get("token_hash") ?? "");
  const type = String(form.get("type") ?? "") as EmailOtpType;
  const next = safeRedirectPath(String(form.get("next") ?? ""));
  const origin = request.nextUrl.origin;

  if (tokenHash && ALLOWED_TYPES.includes(type)) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (!error) return NextResponse.redirect(new URL(next, origin), { status: 303 });
      console.warn("[auth/confirm] verification failed", error.message);
    } catch (error) {
      console.error("[auth/confirm] unexpected error", error);
    }
  }
  return NextResponse.redirect(new URL("/login?error=link_expired", origin), { status: 303 });
}
