/**
 * Tracking primitives shared by the browser and the server: cookie names,
 * consent rules, and click-id formatting. No secrets here.
 */

export const TRACKING_COOKIES = {
  /** Set by the Meta Pixel. */
  fbp: "_fbp",
  /** Meta click id, formatted fb.1.<ms>.<fbclid>. */
  fbc: "_fbc",
  /** Set by the TikTok Pixel. */
  ttp: "_ttp",
  /** TikTok click id captured from the landing URL. */
  ttclid: "mtp_ttclid",
  /** granted | denied */
  consent: "mtp_consent",
} as const;

export type ConsentMode = "opt-out" | "opt-in";
export type ConsentState = "granted" | "denied" | "unknown";

export function parseConsent(value: string | null | undefined): ConsentState {
  return value === "granted" || value === "denied" ? value : "unknown";
}

/**
 * Whether ad data may be shared with Meta and TikTok.
 * - Global Privacy Control is honored as an opt-out in every mode.
 * - opt-out mode (US default): share unless the visitor declined.
 * - opt-in mode: share only after an explicit yes.
 */
export function maySendAdData(consent: ConsentState, mode: ConsentMode, globalPrivacyControl: boolean): boolean {
  if (globalPrivacyControl || consent === "denied") return false;
  return mode === "opt-out" ? true : consent === "granted";
}

/** Meta's documented fbc format. */
export function formatFbc(fbclid: string, clickTimeMs: number): string {
  return `fb.1.${clickTimeMs}.${fbclid}`;
}

/** Event names accepted from the browser. Purchase is server-only (Stripe webhook). */
export const PUBLIC_FUNNEL_EVENTS = ["ViewContent", "InitiateCheckout"] as const;
export type PublicFunnelEvent = (typeof PUBLIC_FUNNEL_EVENTS)[number];
export type ConversionEventName = PublicFunnelEvent | "Purchase";
