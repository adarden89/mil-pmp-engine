import "server-only";
import { z } from "zod";

/**
 * Server environment, validated once on first use. Every integration is
 * optional at boot so the marketing site renders without secrets; routes that
 * need a missing value throw ConfigError, which API handlers turn into a 503.
 */

const optionalString = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .optional();

const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.preprocess(emptyToUndefined, z.url().default("http://localhost:3000")),
  NEXT_PUBLIC_SUPABASE_URL: optionalString,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalString,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SECRET_KEY: optionalString,
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  /** Public key for Stripe.js (Elements checkout modal). Exposed to the browser via next.config.ts. */
  STRIPE_PUBLISHABLE_KEY: optionalString,
  ANTHROPIC_API_KEY: optionalString,
  ANTHROPIC_MODEL: z.preprocess(emptyToUndefined, z.string().trim().min(1).default("claude-opus-5-5")),
  TRANSLATION_LIMIT_PER_30_DAYS: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(40)),
  // Transactional email
  RESEND_API_KEY: optionalString,
  RESEND_FROM_EMAIL: optionalString,
  // Server-side ad conversions
  META_PIXEL_ID: optionalString,
  META_CAPI_ACCESS_TOKEN: optionalString,
  META_GRAPH_API_VERSION: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^v\d+\.\d+$/)
      .default("v24.0"),
  ),
  META_TEST_EVENT_CODE: optionalString,
  TIKTOK_PIXEL_ID: optionalString,
  TIKTOK_EVENTS_API_ACCESS_TOKEN: optionalString,
  TIKTOK_TEST_EVENT_CODE: optionalString,
  /** Sell the $299 human expert review. Leave unset until a reviewer is staffed to fulfill it. */
  EXPERT_REVIEW_ENABLED: z.preprocess(emptyToUndefined, z.stringbool().default(false)),
  /** Where new expert review orders are sent for a human to pick up. */
  EXPERT_REVIEW_INBOX: z.preprocess(emptyToUndefined, z.email().optional()),
  /** Optional Sentry DSN; error reports are always logged as JSON and also forwarded here when set. */
  SENTRY_DSN: optionalString,
  /** opt-out: share unless the visitor opts out or sends GPC (US model). opt-in: share only after consent. */
  TRACKING_CONSENT_MODE: z.preprocess(emptyToUndefined, z.enum(["opt-out", "opt-in"]).default("opt-out")),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class ConfigError extends Error {
  constructor(public readonly missing: string) {
    super(`Server is missing required configuration: ${missing}`);
    this.name = "ConfigError";
  }
}

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (!cached) {
    const parsed = serverEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
      throw new ConfigError(`invalid values for ${issues}`);
    }
    cached = parsed.data;
  }
  return cached;
}

/** Keys that may be absent at boot; all of them are plain strings. */
type OptionalEnvKey = {
  [K in keyof ServerEnv]-?: undefined extends ServerEnv[K] ? K : never;
}[keyof ServerEnv];

export function requireEnv(key: OptionalEnvKey): string {
  const value = serverEnv()[key];
  if (!value) {
    throw new ConfigError(key);
  }
  return value;
}

export function siteUrl(): string {
  return serverEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
}

export function integrationStatus() {
  const env = serverEnv();
  return {
    supabase: Boolean(
      env.NEXT_PUBLIC_SUPABASE_URL &&
      (env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
      env.SUPABASE_SECRET_KEY,
    ),
    stripe: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
    stripeElements: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PUBLISHABLE_KEY),
    expertReview: env.EXPERT_REVIEW_ENABLED && Boolean(env.EXPERT_REVIEW_INBOX),
    errorMonitoring: Boolean(env.SENTRY_DSN),
    anthropic: Boolean(env.ANTHROPIC_API_KEY),
    email: Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL),
    metaConversions: Boolean(env.META_PIXEL_ID && env.META_CAPI_ACCESS_TOKEN),
    tiktokEvents: Boolean(env.TIKTOK_PIXEL_ID && env.TIKTOK_EVENTS_API_ACCESS_TOKEN),
  };
}
