"use client";

import { Cookie } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  captureClickIds,
  CONSENT_MODE,
  consentStore,
  globalPrivacyControl,
  META_PIXEL_ID,
  TIKTOK_PIXEL_ID,
} from "@/lib/tracking/browser";
import { maySendAdData } from "@/lib/tracking/shared";

const META_ID_OK = /^\d{5,20}$/.test(META_PIXEL_ID);
const TIKTOK_ID_OK = /^[A-Z0-9]{8,32}$/i.test(TIKTOK_PIXEL_ID);
const noopSubscribe = () => () => {};

function metaSnippet(id: string): string {
  return `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`;
}

function tiktokSnippet(id: string): string {
  return `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};n=d.createElement("script");n.type="text/javascript";n.async=!0;n.src=r+"?sdkid="+e+"&lib="+t;e=d.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load('${id}');ttq.page();}(window,document,'ttq');`;
}

/**
 * Loads the Meta and TikTok pixels only when ad tracking is allowed, captures
 * click ids from ad landing URLs, and reports client-side page views.
 */
export function TrackingProvider() {
  const consent = useSyncExternalStore(consentStore.subscribe, consentStore.get, consentStore.getServer);
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const pathname = usePathname();
  const firstPath = useRef(true);
  const allowed = isClient && consent !== "pending" && maySendAdData(consent, CONSENT_MODE, globalPrivacyControl());

  useEffect(() => {
    if (allowed) captureClickIds();
  }, [allowed]);

  useEffect(() => {
    // The snippets send the first PageView; this covers client-side navigation.
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    if (!allowed) return;
    window.fbq?.("track", "PageView");
    window.ttq?.page();
  }, [pathname, allowed]);

  const showBanner = isClient && consent === "unknown" && !globalPrivacyControl() && (META_ID_OK || TIKTOK_ID_OK);

  return (
    <>
      {allowed && META_ID_OK ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {metaSnippet(META_PIXEL_ID)}
        </Script>
      ) : null}
      {allowed && TIKTOK_ID_OK ? (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {tiktokSnippet(TIKTOK_PIXEL_ID)}
        </Script>
      ) : null}
      {showBanner ? <ConsentBanner /> : null}
    </>
  );
}

function ConsentBanner() {
  return (
    <div
      role="region"
      aria-label="Privacy choices"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-border-strong bg-card/95 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center"
    >
      <Cookie className="hidden size-5 shrink-0 text-primary sm:block" aria-hidden />
      <p className="flex-1 text-sm text-muted-foreground">
        We use first-party cookies and share limited purchase data (hashed email, IP, device) with Meta and TikTok to
        measure our ads.{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy policy
        </Link>
      </p>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="secondary" onClick={() => consentStore.set("denied")}>
          {CONSENT_MODE === "opt-in" ? "Decline" : "Opt out"}
        </Button>
        <Button size="sm" onClick={() => consentStore.set("granted")}>
          Accept
        </Button>
      </div>
    </div>
  );
}

/** "Do Not Sell or Share" control for the privacy page. */
export function PrivacyChoices() {
  const consent = useSyncExternalStore(consentStore.subscribe, consentStore.get, consentStore.getServer);
  const gpc = useSyncExternalStore(noopSubscribe, globalPrivacyControl, () => false);
  if (consent === "pending") return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
      <p className="flex-1 text-sm">
        {gpc
          ? "Your browser sends a Global Privacy Control signal, so we do not share your data with ad platforms."
          : consent === "denied"
            ? "You have opted out of sharing with Meta and TikTok."
            : "Ad measurement sharing is on."}
      </p>
      {!gpc ? (
        consent === "denied" ? (
          <Button size="sm" variant="secondary" onClick={() => consentStore.set("granted")}>
            Allow ad measurement
          </Button>
        ) : (
          <Button size="sm" variant="destructive" onClick={() => consentStore.set("denied")}>
            Do not sell or share my personal information
          </Button>
        )
      ) : null}
    </div>
  );
}
