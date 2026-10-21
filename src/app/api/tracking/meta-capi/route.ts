import { funnelEventHandler } from "@/lib/tracking/funnel-endpoint";

/** Meta Conversions API relay for browser funnel events (ViewContent, InitiateCheckout). */
export const POST = funnelEventHandler("meta");
