import { connection, NextResponse } from "next/server";
import type { ProductId } from "@/lib/catalog";
import { getEntitlements } from "@/lib/entitlements";
import { toErrorResponse } from "@/lib/http";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";
import { supabasePublicConfig } from "@/lib/supabase/config";

export interface EntitlementsResponse {
  signedIn: boolean;
  email: string | null;
  entitlements: ProductId[];
}

export async function GET() {
  // Per-user data: never prerender, even when Supabase is unconfigured at build time.
  await connection();
  try {
    if (!supabasePublicConfig()) {
      return NextResponse.json<EntitlementsResponse>({ signedIn: false, email: null, entitlements: [] });
    }
    const supabase = await createSupabaseServerClient();
    const user = await getSessionUser(supabase);
    if (!user) {
      return NextResponse.json<EntitlementsResponse>({ signedIn: false, email: null, entitlements: [] });
    }
    const entitlements = await getEntitlements(supabase, user.id);
    return NextResponse.json<EntitlementsResponse>(
      { signedIn: true, email: user.email, entitlements },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return toErrorResponse(error, "api/entitlements");
  }
}
