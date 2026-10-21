"use client";

import type { ProductId } from "@/lib/catalog";
import {
  formatFbc,
  maySendAdData,
  parseConsent,
  TRACKING_COOKIES,
  type ConsentMode,
  type ConsentState,
  type PublicFunnelEvent,
} from "./shared";

/**
 * Browser-side tracking helpers: first-party click-id cookies, consent state,
 * and pixel calls that share event ids with the server so each platform
 * counts a conversion once.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (...args: unknown[]) => void; page: () => void };
  }
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ?? "";
export const CONSENT_MODE: ConsentMode =
  process.env.NEXT_PUBLIC_TRACKING_CONSENT_MODE === "opt-in" ? "opt-in" : "opt-out";

const listeners = new Set<() => void>();

export function readCookie(name: string): string | null {
  for (const part of document.cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function writeCookie(name: string, value: string, maxAgeDays: number): void {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeDays * 86400}; Path=/; SameSite=Lax${secure}`;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; Max-Age=0; Path=/`;
}

export const consentStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get(): ConsentState {
    return parseConsent(readCookie(TRACKING_COOKIES.consent));
  },
  getServer(): ConsentState | "pending" {
    return "pending";
  },
  set(value: Exclude<ConsentState, "unknown">): void {
    writeCookie(TRACKING_COOKIES.consent, value, 365);
    if (value === "denied") {
      // Stop sending stored click ids as soon as the visitor opts out.
      deleteCookie(TRACKING_COOKIES.fbc);
      deleteCookie(TRACKING_COOKIES.ttclid);
    }
    for (const listener of listeners) listener();
  },
};

export function globalPrivacyControl(): boolean {
  return navigator.globalPrivacyControl === true;
}

export function adTrackingAllowed(): boolean {
  return maySendAdData(consentStore.get(), CONSENT_MODE, globalPrivacyControl());
}

/** Store ad click ids from the landing URL as first-party cookies. */
export function captureClickIds(): void {
  if (!adTrackingAllowed()) return;
  const params = new URLSearchParams(location.search);
  const fbclid = params.get("fbclid");
  if (fbclid && /^[A-Za-z0-9_-]{1,500}$/.test(fbclid)) {
    writeCookie(TRACKING_COOKIES.fbc, formatFbc(fbclid, Date.now()), 90);
  }
  const ttclid = params.get("ttclid");
  if (ttclid && /^[A-Za-z0-9_.-]{1,500}$/.test(ttclid)) {
    writeCookie(TRACKING_COOKIES.ttclid, ttclid, 30);
  }
}

const TIKTOK_NAMES: Record<PublicFunnelEvent | "Purchase", string> = {
  Purchase: "CompletePayment",
  InitiateCheckout: "InitiateCheckout",
  ViewContent: "ViewContent",
};

function firePixels(
  name: PublicFunnelEvent | "Purchase",
  params: { value?: number; currency?: string; content_ids?: string[] },
  eventId: string,
): void {
  if (!adTrackingAllowed()) return;
  window.fbq?.(
    "track",
    name,
    { ...params, content_type: params.content_ids ? "product" : undefined },
    { eventID: eventId },
  );
  window.ttq?.track(
    TIKTOK_NAMES[name],
    {
      value: params.value,
      currency: params.currency,
      contents: params.content_ids?.map((id) => ({ content_id: id })),
      content_type: params.content_ids ? "product" : undefined,
    },
    { event_id: eventId },
  );
}

function newEventId(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

/** Browser pixel + server relay for a funnel event, deduplicated by a shared id. */
export function trackFunnelEvent(name: PublicFunnelEvent, contentIds?: ProductId[]): void {
  // Pixel ids are derived from the same env vars as the server credentials, so
  // no ids means no ad platform is configured and there is nothing to send.
  if ((!META_PIXEL_ID && !TIKTOK_PIXEL_ID) || !adTrackingAllowed()) return;
  const eventId = newEventId();
  firePixels(name, { content_ids: contentIds }, eventId);
  const body = JSON.stringify({ eventName: name, eventId, eventSourceUrl: location.href, contentIds });
  for (const endpoint of ["/api/tracking/meta-capi", "/api/tracking/tiktok-events"]) {
    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}

/** Browser half of the Purchase event; the webhook sends the server half with the same id. */
export function trackPurchase(
  checkoutSessionId: string,
  value: number,
  currency: string,
  contentIds: ProductId[],
): void {
  firePixels("Purchase", { value, currency, content_ids: contentIds }, checkoutSessionId);
}
