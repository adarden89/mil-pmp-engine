import { createHash } from "node:crypto";
import type { ConversionEventName } from "./shared";

/**
 * Platform-neutral conversion event, mapped below to the Meta Conversions API
 * and TikTok Events API 2.0 payload shapes. Pure functions, unit tested.
 */

export interface ConversionContent {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ConversionUser {
  email?: string | null;
  externalId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  ttclid?: string | null;
  ttp?: string | null;
}

export interface ConversionEvent {
  name: ConversionEventName;
  /** Shared with the browser pixel so each platform can deduplicate. */
  eventId: string;
  /** Unix seconds. */
  eventTime: number;
  eventSourceUrl: string;
  value?: number;
  currency?: string;
  contents?: ConversionContent[];
  user: ConversionUser;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Meta and TikTok both require trimmed, lowercased email before hashing. */
export function hashEmail(email: string | null | undefined): string | undefined {
  const normalized = email?.trim().toLowerCase();
  return normalized ? sha256(normalized) : undefined;
}

function hashId(id: string | null | undefined): string | undefined {
  return id ? sha256(id.trim()) : undefined;
}

function compact<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  ) as Partial<T>;
}

export function toMetaEvent(event: ConversionEvent) {
  const email = hashEmail(event.user.email);
  const externalId = hashId(event.user.externalId);
  return {
    event_name: event.name,
    event_time: event.eventTime,
    event_id: event.eventId,
    action_source: "website" as const,
    event_source_url: event.eventSourceUrl,
    user_data: compact({
      em: email ? [email] : undefined,
      external_id: externalId ? [externalId] : undefined,
      client_ip_address: event.user.ip ?? undefined,
      client_user_agent: event.user.userAgent ?? undefined,
      fbp: event.user.fbp ?? undefined,
      fbc: event.user.fbc ?? undefined,
    }),
    custom_data: compact({
      value: event.value,
      currency: event.currency?.toUpperCase(),
      content_ids: event.contents?.map((content) => content.id),
      content_type: event.contents ? "product" : undefined,
      num_items: event.contents?.reduce((sum, content) => sum + content.quantity, 0),
    }),
  };
}

const TIKTOK_EVENT_NAMES: Record<ConversionEventName, string> = {
  Purchase: "CompletePayment",
  InitiateCheckout: "InitiateCheckout",
  ViewContent: "ViewContent",
};

export function toTikTokEvent(event: ConversionEvent) {
  return {
    event: TIKTOK_EVENT_NAMES[event.name],
    event_time: event.eventTime,
    event_id: event.eventId,
    user: compact({
      email: hashEmail(event.user.email),
      external_id: hashId(event.user.externalId),
      ip: event.user.ip ?? undefined,
      user_agent: event.user.userAgent ?? undefined,
      ttclid: event.user.ttclid ?? undefined,
      ttp: event.user.ttp ?? undefined,
    }),
    properties: compact({
      value: event.value,
      currency: event.currency?.toUpperCase(),
      content_type: event.contents ? "product" : undefined,
      contents: event.contents?.map((content) => ({
        content_id: content.id,
        content_name: content.name,
        price: content.price,
        quantity: content.quantity,
      })),
    }),
    page: { url: event.eventSourceUrl },
  };
}
