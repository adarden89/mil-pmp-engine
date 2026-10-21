import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: () => ({}) }));

const { hashEmail, sha256, toMetaEvent, toTikTokEvent } = await import("./payloads");
const { formatFbc, maySendAdData, parseConsent } = await import("./shared");
const { sendWithRetry } = await import("./dispatch");
const { clampEventTime } = await import("./purchase");

const purchase = {
  name: "Purchase" as const,
  eventId: "cs_test_123",
  eventTime: 1_790_000_000,
  eventSourceUrl: "https://miltopmp.example/",
  value: 34.98,
  currency: "usd",
  contents: [
    { id: "base_tool", name: "Core", price: 24.99, quantity: 1 },
    { id: "cool_fast_track", name: "Guide", price: 9.99, quantity: 1 },
  ],
  user: {
    email: "  Sailor@Example.COM ",
    externalId: "user-1",
    ip: "203.0.113.5",
    userAgent: "Mozilla/5.0",
    fbp: "fb.1.1.abc",
    fbc: "fb.1.2.xyz",
    ttclid: "tt-123",
    ttp: "ttp-456",
  },
};

describe("hashing", () => {
  it("normalizes email before SHA-256", () => {
    expect(hashEmail("  Sailor@Example.COM ")).toBe(sha256("sailor@example.com"));
    expect(hashEmail("")).toBeUndefined();
  });
});

describe("Meta Conversions API payload", () => {
  it("maps a purchase with hashed identifiers, click ids, and order value", () => {
    const event = toMetaEvent(purchase);
    expect(event).toMatchObject({
      event_name: "Purchase",
      event_id: "cs_test_123",
      action_source: "website",
      user_data: {
        em: [sha256("sailor@example.com")],
        external_id: [sha256("user-1")],
        client_ip_address: "203.0.113.5",
        fbp: "fb.1.1.abc",
        fbc: "fb.1.2.xyz",
      },
      custom_data: { value: 34.98, currency: "USD", content_ids: ["base_tool", "cool_fast_track"], num_items: 2 },
    });
    expect(JSON.stringify(event)).not.toContain("Sailor@Example.COM");
  });

  it("omits empty identifiers instead of sending blanks", () => {
    const event = toMetaEvent({ ...purchase, user: { email: null, ip: null } });
    expect(event.user_data).toEqual({});
  });
});

describe("TikTok Events API payload", () => {
  it("maps Purchase to CompletePayment with ttclid and ttp", () => {
    const event = toTikTokEvent(purchase);
    expect(event.event).toBe("CompletePayment");
    expect(event.user).toMatchObject({ email: sha256("sailor@example.com"), ttclid: "tt-123", ttp: "ttp-456" });
    expect(event.properties).toMatchObject({ value: 34.98, currency: "USD", content_type: "product" });
    expect(event.page.url).toBe("https://miltopmp.example/");
  });
});

describe("consent", () => {
  it("honors Global Privacy Control and explicit opt-outs in every mode", () => {
    expect(maySendAdData("granted", "opt-out", true)).toBe(false);
    expect(maySendAdData("denied", "opt-out", false)).toBe(false);
  });

  it("shares by default in opt-out mode and only after consent in opt-in mode", () => {
    expect(maySendAdData("unknown", "opt-out", false)).toBe(true);
    expect(maySendAdData("unknown", "opt-in", false)).toBe(false);
    expect(maySendAdData("granted", "opt-in", false)).toBe(true);
  });

  it("parses only known consent values", () => {
    expect(parseConsent("granted")).toBe("granted");
    expect(parseConsent("yes please")).toBe("unknown");
  });

  it("formats fbc the way Meta documents it", () => {
    expect(formatFbc("IwAR123", 1_700_000_000_000)).toBe("fb.1.1700000000000.IwAR123");
  });
});

describe("sendWithRetry", () => {
  const noSleep = async () => {};

  it("retries transient failures and stops on success", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, retryable: true, detail: "busy" })
      .mockResolvedValueOnce({ ok: true, status: 200, retryable: false, detail: "ok" });
    const result = await sendWithRetry(send, purchase, noSleep);
    expect(result).toMatchObject({ ok: true, attempts: 2 });
  });

  it("does not retry permanent errors", async () => {
    const send = vi.fn().mockResolvedValue({ ok: false, status: 400, retryable: false, detail: "bad token" });
    const result = await sendWithRetry(send, purchase, noSleep);
    expect(result).toMatchObject({ ok: false, attempts: 1 });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("treats thrown network errors as retryable and gives up after three attempts", async () => {
    const send = vi.fn().mockRejectedValue(new Error("ECONNRESET"));
    const result = await sendWithRetry(send, purchase, noSleep);
    expect(result).toMatchObject({ ok: false, attempts: 3, detail: "ECONNRESET" });
  });
});

describe("clampEventTime", () => {
  it("keeps recent events and pulls old ones inside Meta's 7-day window", () => {
    const now = 1_800_000_000;
    expect(clampEventTime(now - 60, now)).toBe(now - 60);
    expect(clampEventTime(now - 30 * 24 * 3600, now)).toBe(now - 7 * 24 * 3600 + 3600);
    expect(clampEventTime(now + 500, now)).toBe(now);
  });
});
