import "server-only";
import { serverEnv } from "@/lib/env";
import { clientIp } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { maySendAdData, parseConsent, TRACKING_COOKIES, type ConsentState } from "./shared";

export interface RequestAttribution {
  fbp: string | null;
  fbc: string | null;
  ttclid: string | null;
  ttp: string | null;
  ip: string | null;
  userAgent: string | null;
  consent: ConsentState;
  globalPrivacyControl: boolean;
  sourceUrl: string | null;
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      const value = decodeURIComponent(rest.join("=")).slice(0, 255);
      return value || null;
    }
  }
  return null;
}

export function attributionFromRequest(request: Request): RequestAttribution {
  const cookieHeader = request.headers.get("cookie");
  const ip = clientIp(request);
  return {
    fbp: readCookie(cookieHeader, TRACKING_COOKIES.fbp),
    fbc: readCookie(cookieHeader, TRACKING_COOKIES.fbc),
    ttclid: readCookie(cookieHeader, TRACKING_COOKIES.ttclid),
    ttp: readCookie(cookieHeader, TRACKING_COOKIES.ttp),
    ip: ip === "unknown" ? null : ip,
    userAgent: request.headers.get("user-agent")?.slice(0, 512) ?? null,
    consent: parseConsent(readCookie(cookieHeader, TRACKING_COOKIES.consent)),
    globalPrivacyControl: request.headers.get("sec-gpc") === "1",
    sourceUrl: request.headers.get("referer")?.slice(0, 1024) ?? null,
  };
}

export function mayShare(attribution: Pick<RequestAttribution, "consent" | "globalPrivacyControl">): boolean {
  return maySendAdData(attribution.consent, serverEnv().TRACKING_CONSENT_MODE, attribution.globalPrivacyControl);
}

/**
 * Persist click ids for a checkout so the Stripe webhook can report the
 * purchase later. When the visitor opted out, only the decision is stored.
 */
export async function saveCheckoutAttribution(
  checkoutSessionId: string,
  userId: string | null,
  attribution: RequestAttribution,
): Promise<void> {
  const allowed = mayShare(attribution);
  const consent: ConsentState = allowed ? (attribution.consent === "unknown" ? "unknown" : "granted") : "denied";
  const { error } = await supabaseAdmin()
    .from("checkout_attribution")
    .upsert(
      {
        checkout_session_id: checkoutSessionId,
        user_id: userId,
        consent,
        ...(allowed
          ? {
              fbp: attribution.fbp,
              fbc: attribution.fbc,
              ttclid: attribution.ttclid,
              ttp: attribution.ttp,
              client_ip: attribution.ip,
              user_agent: attribution.userAgent,
              event_source_url: attribution.sourceUrl,
            }
          : {}),
      },
      { onConflict: "checkout_session_id" },
    );
  if (error) console.error(`[tracking] could not save attribution for ${checkoutSessionId}: ${error.message}`);
}

export async function loadCheckoutAttribution(checkoutSessionId: string) {
  const { data, error } = await supabaseAdmin()
    .from("checkout_attribution")
    .select("*")
    .eq("checkout_session_id", checkoutSessionId)
    .maybeSingle();
  if (error) throw new Error(`attribution lookup: ${error.message}`);
  return data;
}
