import { funnelEventHandler } from "@/lib/tracking/funnel-endpoint";

/** TikTok Events API relay for browser funnel events (ViewContent, InitiateCheckout). */
export const POST = funnelEventHandler("tiktok");
