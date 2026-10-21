import { afterEach, describe, expect, it, vi } from "vitest";
import { buildErrorReport, buildSentryEnvelope, parseDsn, redact, reportError } from "./monitoring";

describe("redact", () => {
  it("removes emails, keys, tokens, and SSNs", () => {
    const text =
      "user jane.doe@navy.mil key sk_live_abcdefgh12345678 whsec_abcdefghijk sk-ant-abc_defghijklmn Bearer abc.def.ghi 123-45-6789 /auth/confirm?token_hash=abc123&type=magiclink";
    const result = redact(text);
    expect(result).not.toMatch(/jane\.doe|sk_live_abc|whsec_abc|sk-ant-abc|abc\.def\.ghi|123-45-6789|abc123/);
    expect(result).toContain("[email]");
    expect(result).toContain("token_hash=[redacted]");
  });
});

describe("buildErrorReport", () => {
  it("captures name, redacted message, stack, digest, and strips query strings", () => {
    const error = Object.assign(new Error("lookup failed for ops@example.com"), { digest: "123" });
    const report = buildErrorReport(error, { source: "route", route: "/api/translate?x=1" }, new Date(0));
    expect(report.name).toBe("Error");
    expect(report.message).toBe("lookup failed for [email]");
    expect(report.context.route).toBe("/api/translate");
    expect(report.context.digest).toBe("123");
    expect(report.timestamp).toBe("1970-01-01T00:00:00.000Z");
    expect(report.eventId).toMatch(/^[0-9a-f]{32}$/);
  });

  it("handles thrown non-errors", () => {
    expect(buildErrorReport("boom", { source: "client" }).message).toBe("boom");
    expect(buildErrorReport(undefined, { source: "client" }).name).toBe("undefined");
  });
});

describe("Sentry envelope", () => {
  it("parses DSNs, including path prefixes, and rejects malformed ones", () => {
    expect(parseDsn("https://abc123@o1.ingest.sentry.io/456")?.envelopeUrl).toBe(
      "https://o1.ingest.sentry.io/api/456/envelope/",
    );
    expect(parseDsn("https://key@sentry.example.com/prefix/7")?.envelopeUrl).toBe(
      "https://sentry.example.com/prefix/api/7/envelope/",
    );
    expect(parseDsn("not a dsn")).toBeNull();
    expect(parseDsn("https://o1.ingest.sentry.io/456")).toBeNull();
  });

  it("builds a three-line envelope", () => {
    const dsn = parseDsn("https://abc123@o1.ingest.sentry.io/456")!;
    const report = buildErrorReport(new TypeError("bad"), { source: "render", route: "/dashboard" });
    const lines = buildSentryEnvelope(report, dsn).split("\n");
    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[1])).toEqual({ type: "event" });
    const event = JSON.parse(lines[2]);
    expect(event.exception.values[0]).toEqual({ type: "TypeError", value: "bad" });
    expect(event.tags.source).toBe("render");
  });
});

describe("reportError", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("logs one JSON line and never throws when forwarding fails", async () => {
    vi.stubEnv("SENTRY_DSN", "https://abc123@o1.ingest.sentry.io/456");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    const report = await reportError(new Error("x"), { source: "route" });
    expect(report?.message).toBe("x");
    expect(JSON.parse(String(log.mock.calls[0][0])).type).toBe("error_report");
  });
});
