import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { renderAccessEmail } = await import("./access-email");
const { escapeHtml, maskEmail } = await import("@/lib/email");

describe("renderAccessEmail", () => {
  const email = renderAccessEmail({
    loginUrl: "https://miltopmp.example/auth/confirm?token_hash=abc&type=magiclink&next=%2Fdashboard",
    products: ["base_tool", "cool_fast_track"],
    siteUrl: "https://miltopmp.example",
  });

  it("includes the sign-in link, each product's starting point, and the COOL warning", () => {
    expect(email.html).toContain("token_hash=abc&amp;type=magiclink");
    expect(email.text).toContain("https://miltopmp.example/dashboard/translator");
    expect(email.text).toContain("https://miltopmp.example/funding#opnav-1500-57");
    expect(email.text).toContain("Do NOT pay out of pocket");
  });

  it("never sends a password", () => {
    expect(email.text.toLowerCase()).not.toMatch(/password:/);
  });
});

describe("email helpers", () => {
  it("escapes HTML", () => {
    expect(escapeHtml(`<script>"x"&'y'</script>`)).toBe("&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;");
  });

  it("masks addresses so the success page cannot leak them", () => {
    expect(maskEmail("jordan.rivera@gmail.com")).toBe("j******@gmail.com");
    expect(maskEmail("a@b.co")).toBe("a**@b.co");
    expect(maskEmail("not-an-email")).toBe("your email");
  });
});
