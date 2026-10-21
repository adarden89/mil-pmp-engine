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
  SUPABASE_SECRET_KEY: optionalString,
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  ANTHROPIC_API_KEY: optionalString,
  ANTHROPIC_MODEL: z.preprocess(emptyToUndefined, z.string().trim().min(1).default("claude-opus-5-5")),
  TRANSLATION_LIMIT_PER_30_DAYS: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(40)),
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
      env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && env.SUPABASE_SECRET_KEY,
    ),
    stripe: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
    anthropic: Boolean(env.ANTHROPIC_API_KEY),
  };
}
