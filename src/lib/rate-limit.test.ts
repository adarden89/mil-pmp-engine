import { describe, expect, it } from "vitest";
import { RateLimiter } from "./rate-limit";

describe("RateLimiter", () => {
  it("allows up to the limit within a window, then blocks with a retry hint", () => {
    const limiter = new RateLimiter(2, 60_000);
    expect(limiter.check("u1", 0).allowed).toBe(true);
    expect(limiter.check("u1", 1_000).allowed).toBe(true);
    const blocked = limiter.check("u1", 2_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(58);
  });

  it("resets after the window and tracks keys independently", () => {
    const limiter = new RateLimiter(1, 1_000);
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("b", 0).allowed).toBe(true);
    expect(limiter.check("a", 500).allowed).toBe(false);
    expect(limiter.check("a", 1_000).allowed).toBe(true);
  });

  it("stays bounded when the key space is exhausted", () => {
    const limiter = new RateLimiter(1, 60_000, 2);
    limiter.check("a", 0);
    limiter.check("b", 0);
    expect(limiter.check("c", 0).allowed).toBe(true);
  });
});
