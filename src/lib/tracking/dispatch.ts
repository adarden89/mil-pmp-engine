import "server-only";
import { serverEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { toMetaEvent, toTikTokEvent, type ConversionEvent } from "./payloads";

/**
 * Sends conversion events to Meta and TikTok with retries, and records every
 * attempt in the conversion_events ledger so Stripe webhook retries never
 * report the same purchase twice. Failures are logged and recorded, never
 * thrown: ad reporting must not break fulfillment.
 */

export type Platform = "meta" | "tiktok";

export interface DispatchResult {
  platform: Platform;
  status: "sent" | "failed" | "skipped" | "duplicate";
  detail?: string;
}

interface SendOutcome {
  ok: boolean;
  status: number;
  retryable: boolean;
  detail: string;
}

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [0, 400, 1500];

async function postJson(url: string, body: unknown, headers: Record<string, string> = {}): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
}

async function sendToMeta(event: ConversionEvent): Promise<SendOutcome> {
  const env = serverEnv();
  if (!env.META_PIXEL_ID || !env.META_CAPI_ACCESS_TOKEN) {
    return { ok: false, status: 0, retryable: false, detail: "not_configured" };
  }
  const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/${env.META_PIXEL_ID}/events`);
  url.searchParams.set("access_token", env.META_CAPI_ACCESS_TOKEN);
  const response = await postJson(url.toString(), {
    data: [toMetaEvent(event)],
    ...(env.META_TEST_EVENT_CODE ? { test_event_code: env.META_TEST_EVENT_CODE } : {}),
  });
  const body = (await response.json().catch(() => null)) as {
    events_received?: number;
    error?: { message?: string };
  } | null;
  const ok = response.ok && (body?.events_received ?? 0) > 0;
  return {
    ok,
    status: response.status,
    retryable: response.status === 429 || response.status >= 500,
    detail: ok ? "ok" : (body?.error?.message ?? `HTTP ${response.status}`),
  };
}

async function sendToTikTok(event: ConversionEvent): Promise<SendOutcome> {
  const env = serverEnv();
  if (!env.TIKTOK_PIXEL_ID || !env.TIKTOK_EVENTS_API_ACCESS_TOKEN) {
    return { ok: false, status: 0, retryable: false, detail: "not_configured" };
  }
  const response = await postJson(
    "https://business-api.tiktok.com/open_api/v1.3/event/track/",
    {
      event_source: "web",
      event_source_id: env.TIKTOK_PIXEL_ID,
      ...(env.TIKTOK_TEST_EVENT_CODE ? { test_event_code: env.TIKTOK_TEST_EVENT_CODE } : {}),
      data: [toTikTokEvent(event)],
    },
    { "Access-Token": env.TIKTOK_EVENTS_API_ACCESS_TOKEN },
  );
  // TikTok reports errors in the body with HTTP 200, so check `code` too.
  const body = (await response.json().catch(() => null)) as { code?: number; message?: string } | null;
  const ok = response.ok && body?.code === 0;
  return {
    ok,
    status: response.status,
    retryable: response.status === 429 || response.status >= 500 || body?.code === 40100,
    detail: ok ? "ok" : (body?.message ?? `HTTP ${response.status}`),
  };
}

const SENDERS: Record<Platform, (event: ConversionEvent) => Promise<SendOutcome>> = {
  meta: sendToMeta,
  tiktok: sendToTikTok,
};

export async function sendWithRetry(
  send: (event: ConversionEvent) => Promise<SendOutcome>,
  event: ConversionEvent,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<SendOutcome & { attempts: number }> {
  let last: SendOutcome = { ok: false, status: 0, retryable: true, detail: "not attempted" };
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    if (BACKOFF_MS[attempt - 1]) await sleep(BACKOFF_MS[attempt - 1]);
    try {
      last = await send(event);
    } catch (error) {
      last = {
        ok: false,
        status: 0,
        retryable: true,
        detail: error instanceof Error ? error.message : "network error",
      };
    }
    if (last.ok || !last.retryable) return { ...last, attempts: attempt };
  }
  return { ...last, attempts: MAX_ATTEMPTS };
}

/**
 * Claim the (platform, event, id) slot in the ledger. Returns false when the
 * event was already sent or another worker is sending it right now.
 */
async function claim(platform: Platform, event: ConversionEvent): Promise<boolean> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("conversion_events")
    .upsert(
      { platform, event_name: event.name, event_id: event.eventId, status: "pending" },
      { onConflict: "platform,event_name,event_id", ignoreDuplicates: true },
    )
    .select("id");
  if (error) throw new Error(`conversion ledger: ${error.message}`);
  if (data.length > 0) return true;

  // Row existed: only a previously failed attempt may be retried.
  const { data: retried, error: retryError } = await db
    .from("conversion_events")
    .update({ status: "pending", updated_at: new Date().toISOString() })
    .eq("platform", platform)
    .eq("event_name", event.name)
    .eq("event_id", event.eventId)
    .eq("status", "failed")
    .select("id");
  if (retryError) throw new Error(`conversion ledger: ${retryError.message}`);
  return retried.length > 0;
}

export async function dispatchConversion(
  event: ConversionEvent,
  platforms: readonly Platform[] = ["meta", "tiktok"],
  { ledger = true }: { ledger?: boolean } = {},
): Promise<DispatchResult[]> {
  return Promise.all(
    platforms.map(async (platform): Promise<DispatchResult> => {
      try {
        if (ledger && !(await claim(platform, event))) {
          return { platform, status: "duplicate" };
        }
        const outcome = await sendWithRetry(SENDERS[platform], event);
        const status = outcome.detail === "not_configured" ? "skipped" : outcome.ok ? "sent" : "failed";
        if (ledger) {
          await supabaseAdmin()
            .from("conversion_events")
            .update({
              status,
              attempts: outcome.attempts,
              response_code: outcome.status || null,
              last_error: outcome.ok ? null : outcome.detail.slice(0, 500),
              updated_at: new Date().toISOString(),
            })
            .eq("platform", platform)
            .eq("event_name", event.name)
            .eq("event_id", event.eventId);
        }
        if (status === "failed") {
          console.error(`[tracking] ${platform} ${event.name} ${event.eventId} failed: ${outcome.detail}`);
        }
        return { platform, status, detail: outcome.ok ? undefined : outcome.detail };
      } catch (error) {
        console.error(`[tracking] ${platform} ${event.name} ${event.eventId} error`, error);
        return { platform, status: "failed", detail: "internal_error" };
      }
    }),
  );
}
