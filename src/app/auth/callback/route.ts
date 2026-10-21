import { connection, NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";

/** Magic-link landing: exchange the PKCE code for a session, then continue. */
export async function GET(request: NextRequest) {
  await connection();
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, origin));
      console.warn("[auth/callback] code exchange failed", error.message);
    } catch (error) {
      console.error("[auth/callback] unexpected error", error);
    }
  }
  return NextResponse.redirect(new URL("/login?error=link_expired", origin));
}
