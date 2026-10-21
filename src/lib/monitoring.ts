/**
 * Error monitoring without an SDK in the build.
 *
 * Every report is written as one structured JSON line (picked up by the
 * host's log drain) and, when SENTRY_DSN is set, forwarded to Sentry's
 * envelope endpoint. Reports are redacted first: email addresses, API keys,
 * bearer tokens, and SSN-shaped numbers never leave the process. Reporting
 * never throws and gives up after a short timeout.
 */

export interface ErrorContext {
  /** Where it happened: "render", "route", "action", "proxy", "client", or a job name. */
  source: string;
  /** Route file path or page path, without query strings. */
  route?: string;
  method?: string;
  digest?: string;
  /** Extra non-sensitive tags, e.g. { webhook: "checkout.session.completed" }. */
  tags?: Record<string, string>;
}

export interface ErrorReport {
  eventId: string;
  timestamp: string;
  level: "error";
  name: string;
  message: string;
  stack: string | null;
  context: ErrorContext;
  environment: string;
}

const REDACTIONS: [RegExp, string][] = [
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]"],
  [/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{8,}\b/g, "[stripe-key]"],
  [/\bwhsec_[A-Za-z0-9]{8,}\b/g, "[stripe-webhook-secret]"],
  [/\bsk-ant-[A-Za-z0-9_-]{8,}\b/g, "[anthropic-key]"],
  [/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]{8,}\b/g, "[supabase-key]"],
  [/\bre_[A-Za-z0-9]{16,}\b/g, "[resend-key]"],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "[jwt]"],
  [/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [token]"],
  [/\b\d{3}-\d{2}-\d{4}\b/g, "[ssn]"],
  [/([?&](?:token|token_hash|code|access_token|session_id)=)[^&\s]+/gi, "$1[redacted]"],
];

const MAX_MESSAGE = 1000;
const MAX_STACK = 6000;

export function redact(text: string): string {
  return REDACTIONS.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text);
}

function eventId(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

function environment(): string {
  return process.env.VERCEL_ENV || process.env.NODE_ENV || "development";
}

export function buildErrorReport(error: unknown, context: ErrorContext, now: Date = new Date()): ErrorReport {
  const isError = error instanceof Error;
  const digest =
    context.digest ??
    (typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined);
  return {
    eventId: eventId(),
    timestamp: now.toISOString(),
    level: "error",
    name: isError ? error.name : typeof error,
    message: redact((isError ? error.message : String(error)) || "(no message)").slice(0, MAX_MESSAGE),
    stack: isError && error.stack ? redact(error.stack).slice(0, MAX_STACK) : null,
    context: {
      ...context,
      route: context.route ? redact(context.route.split("?")[0]) : undefined,
      ...(digest ? { digest } : {}),
    },
    environment: environment(),
  };
}

export interface ParsedDsn {
  envelopeUrl: string;
  publicKey: string;
  dsn: string;
}

/** https://<key>@<host>[/<path>]/<projectId> to Sentry's envelope endpoint. Null when malformed. */
export function parseDsn(dsn: string): ParsedDsn | null {
  try {
    const url = new URL(dsn);
    const segments = url.pathname.split("/").filter(Boolean);
    const projectId = segments.pop();
    if (!url.username || !projectId || !/^\d+$/.test(projectId)) return null;
    const prefix = segments.length ? `/${segments.join("/")}` : "";
    return {
      envelopeUrl: `${url.protocol}//${url.host}${prefix}/api/${projectId}/envelope/`,
      publicKey: url.username,
      dsn,
    };
  } catch {
    return null;
  }
}

export function buildSentryEnvelope(report: ErrorReport, dsn: ParsedDsn): string {
  const header = { event_id: report.eventId, sent_at: report.timestamp, dsn: dsn.dsn };
  const event = {
    event_id: report.eventId,
    timestamp: Date.parse(report.timestamp) / 1000,
    platform: "javascript",
    level: report.level,
    logger: "miltopmp",
    environment: report.environment,
    transaction: report.context.route,
    tags: {
      source: report.context.source,
      ...(report.context.method ? { method: report.context.method } : {}),
      ...report.context.tags,
    },
    exception: { values: [{ type: report.name, value: report.message }] },
    extra: { stack: report.stack, digest: report.context.digest },
  };
  return [JSON.stringify(header), JSON.stringify({ type: "event" }), JSON.stringify(event)].join("\n");
}

async function forwardToSentry(report: ErrorReport): Promise<void> {
  const raw = process.env.SENTRY_DSN?.trim();
  if (!raw) return;
  const dsn = parseDsn(raw);
  if (!dsn) {
    console.error("[monitoring] SENTRY_DSN is malformed; reports stay in logs only");
    return;
  }
  await fetch(dsn.envelopeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-sentry-envelope",
      "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${dsn.publicKey}, sentry_client=miltopmp/1.0`,
    },
    body: buildSentryEnvelope(report, dsn),
    signal: AbortSignal.timeout(3000),
  });
}

/** Log and forward an error. Safe to call from anywhere on the server; never throws. */
export async function reportError(error: unknown, context: ErrorContext): Promise<ErrorReport | null> {
  try {
    const report = buildErrorReport(error, context);
    console.error(JSON.stringify({ type: "error_report", ...report }));
    await forwardToSentry(report).catch((forwardError: unknown) => {
      console.error("[monitoring] could not forward report", forwardError instanceof Error ? forwardError.message : "");
    });
    return report;
  } catch {
    return null;
  }
}
