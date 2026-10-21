import { describe, expect, it } from "vitest";
import { instagramCsv, screenCompliance, tiktokCsv, toCsv, toMarkdown, type AdCreativeBatch } from "./ad-creatives";

const batch: AdCreativeBatch = {
  tiktokScripts: [
    {
      title: "Stop paying out of pocket",
      angle: "Navy COOL",
      durationSeconds: 20,
      hook: "Don't pay for the PMP yourself",
      painPoint: "Sailors pay $675, then find out Navy COOL won't reimburse it",
      solution: "Get the OPNAV 1500/57 approved first",
      cta: "Link in bio",
      onScreenText: ["Voucher FIRST", "Then schedule"],
      shotList: ["Creator at kitchen table", "Screen recording of the prep packet"],
      caption: 'Exam fee covered when your funding is approved, "no surprises" #ad',
      hashtags: ["NavyCOOL", "#PMP"],
    },
  ],
  instagramFeedAds: [
    {
      audience: "Active duty",
      primaryText: "Turn your EVAL bullets into a PMP application. Not affiliated with DoD or PMI.",
      headline: "Your EVALs, PMI-ready",
      description: "$24.99 Core Translator",
      callToAction: "Learn More",
    },
  ],
  instagramCarousels: [
    {
      title: "5 projects hiding in your NCOER",
      audience: "Transitioning veterans",
      slides: [{ headline: "FTX planning", body: "That's a project." }],
      caption: "Swipe. Not affiliated with DoD or PMI.",
    },
  ],
  instagramStories: [
    { title: "CAPM first", frames: ["E-4?", "Start with the CAPM"], callToAction: "Check eligibility" },
  ],
};

describe("screenCompliance", () => {
  it("passes clean copy", () => {
    expect(screenCompliance(batch)).toEqual([]);
  });

  it("flags implied endorsement, guarantees, uniforms, and 'free product' claims", () => {
    const risky: AdCreativeBatch = {
      ...batch,
      instagramFeedAds: [
        {
          ...batch.instagramFeedAds[0],
          primaryText: "The Navy-approved tool, guaranteed to get you a free PMP. Film it in uniform!",
        },
      ],
    };
    const reasons = screenCompliance(risky).map((flag) => flag.reason);
    expect(reasons).toContain("Implies official endorsement");
    expect(reasons).toContain("Guaranteed outcomes cannot be promised");
    expect(reasons).toContain("Product is paid; only exam fees can be covered");
    expect(reasons).toContain("Uniforms in commercial ads imply endorsement");
  });
});

describe("exporters", () => {
  it("escapes CSV quotes, commas, and newlines", () => {
    expect(toCsv([{ a: 'say "hi", ok', b: "line1\nline2" }])).toBe('a,b\n"say ""hi"", ok","line1\nline2"\n');
  });

  it("normalizes hashtags and joins lists in the TikTok CSV", () => {
    const csv = tiktokCsv(batch);
    expect(csv.split("\n")[0]).toContain("hook,pain_point,solution,cta");
    expect(csv).toContain("#NavyCOOL #PMP");
    expect(csv).toContain("Voucher FIRST | Then schedule");
  });

  it("puts every Instagram format in one CSV", () => {
    const rows = instagramCsv(batch).trim().split("\n");
    expect(rows).toHaveLength(4);
    expect(rows.slice(1).map((row) => row.split(",")[1])).toEqual(["feed", "carousel", "story"]);
  });

  it("leads the markdown with the compliance review", () => {
    const markdown = toMarkdown(batch, [], "2026-10-21T00:00:00Z");
    expect(markdown.indexOf("## Compliance review")).toBeLessThan(markdown.indexOf("## TikTok scripts"));
    expect(markdown).toContain("Drafts for human review");
  });
});
