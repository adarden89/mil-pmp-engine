import { z } from "zod";

/**
 * Ad creative schema, compliance screening, and exporters used by
 * scripts/generate-ad-creatives.ts. Pure and unit-tested; the CLI handles I/O.
 */

export const tiktokScriptSchema = z.object({
  title: z.string(),
  angle: z.string(),
  durationSeconds: z.number(),
  hook: z.string(),
  painPoint: z.string(),
  solution: z.string(),
  cta: z.string(),
  onScreenText: z.array(z.string()),
  shotList: z.array(z.string()),
  caption: z.string(),
  hashtags: z.array(z.string()),
});

export const instagramFeedAdSchema = z.object({
  audience: z.string(),
  primaryText: z.string(),
  headline: z.string(),
  description: z.string(),
  callToAction: z.string(),
});

export const instagramCarouselSchema = z.object({
  title: z.string(),
  audience: z.string(),
  slides: z.array(z.object({ headline: z.string(), body: z.string() })),
  caption: z.string(),
});

export const instagramStorySchema = z.object({
  title: z.string(),
  frames: z.array(z.string()),
  callToAction: z.string(),
});

export const adCreativeBatchSchema = z.object({
  tiktokScripts: z.array(tiktokScriptSchema),
  instagramFeedAds: z.array(instagramFeedAdSchema),
  instagramCarousels: z.array(instagramCarouselSchema),
  instagramStories: z.array(instagramStorySchema),
});

export type AdCreativeBatch = z.infer<typeof adCreativeBatchSchema>;

/**
 * Phrases that create legal or platform-policy risk for this product:
 * implied government or PMI endorsement, guaranteed outcomes, and "free"
 * claims that hide the product price. A hit is a flag for human review, not
 * an automatic rejection.
 */
export const RISKY_PHRASES: readonly { pattern: RegExp; reason: string }[] = [
  { pattern: /\bguarantee(d|s)?\b/i, reason: "Guaranteed outcomes cannot be promised" },
  { pattern: /\baudit[- ]?proof\b/i, reason: "No application is audit-proof" },
  {
    pattern: /\b(dod|navy|army|air force|marine corps|coast guard|pmi)[- ]?(approved|endorsed|certified|official)\b/i,
    reason: "Implies official endorsement",
  },
  { pattern: /\bofficial (navy|dod|military|cool|pmi)\b/i, reason: "Implies official status" },
  { pattern: /\bfree (pmp|capm|certification|tool|app)\b/i, reason: "Product is paid; only exam fees can be covered" },
  { pattern: /\b100% free\b/i, reason: "Product is paid; only exam fees can be covered" },
  {
    pattern: /\bin uniform\b|\bwearing (your|a|the) uniform\b|\bocp\b|\bnwu\b/i,
    reason: "Uniforms in commercial ads imply endorsement",
  },
  { pattern: /\b(only|just) \d+ (spots|seats) left\b|\bexpires (tonight|today)\b/i, reason: "Fake scarcity" },
  { pattern: /\bpass (on|the exam on) (your|the) first (try|attempt)\b/i, reason: "Outcome claim" },
];

export interface ComplianceFlag {
  location: string;
  phrase: string;
  reason: string;
}

function collectText(batch: AdCreativeBatch): { location: string; text: string }[] {
  const entries: { location: string; text: string }[] = [];
  batch.tiktokScripts.forEach((s, i) => {
    const where = `TikTok #${i + 1} "${s.title}"`;
    for (const text of [s.hook, s.painPoint, s.solution, s.cta, s.caption, ...s.onScreenText, ...s.shotList]) {
      entries.push({ location: where, text });
    }
  });
  batch.instagramFeedAds.forEach((ad, i) => {
    for (const text of [ad.primaryText, ad.headline, ad.description])
      entries.push({ location: `IG feed #${i + 1}`, text });
  });
  batch.instagramCarousels.forEach((c, i) => {
    const where = `IG carousel #${i + 1} "${c.title}"`;
    entries.push({ location: where, text: c.caption });
    for (const slide of c.slides) entries.push({ location: where, text: `${slide.headline} ${slide.body}` });
  });
  batch.instagramStories.forEach((story, i) => {
    for (const text of story.frames) entries.push({ location: `IG story #${i + 1} "${story.title}"`, text });
  });
  return entries;
}

export function screenCompliance(batch: AdCreativeBatch): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];
  for (const { location, text } of collectText(batch)) {
    for (const { pattern, reason } of RISKY_PHRASES) {
      const match = text.match(pattern);
      if (match) flags.push({ location, phrase: match[0], reason });
    }
  }
  return flags;
}

export function toCsv(rows: readonly Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => {
    const text = String(value);
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return (
    [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h] ?? "")).join(","))].join("\n") + "\n"
  );
}

export function tiktokCsv(batch: AdCreativeBatch): string {
  return toCsv(
    batch.tiktokScripts.map((s, i) => ({
      id: `tt-${i + 1}`,
      title: s.title,
      angle: s.angle,
      duration_seconds: s.durationSeconds,
      hook: s.hook,
      pain_point: s.painPoint,
      solution: s.solution,
      cta: s.cta,
      on_screen_text: s.onScreenText.join(" | "),
      shot_list: s.shotList.join(" | "),
      caption: s.caption,
      hashtags: s.hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)).join(" "),
    })),
  );
}

export function instagramCsv(batch: AdCreativeBatch): string {
  return toCsv([
    ...batch.instagramFeedAds.map((ad, i) => ({
      id: `ig-feed-${i + 1}`,
      format: "feed",
      audience: ad.audience,
      primary_text: ad.primaryText,
      headline: ad.headline,
      description: ad.description,
      call_to_action: ad.callToAction,
    })),
    ...batch.instagramCarousels.map((c, i) => ({
      id: `ig-carousel-${i + 1}`,
      format: "carousel",
      audience: c.audience,
      primary_text: c.caption,
      headline: c.title,
      description: c.slides.map((slide, n) => `${n + 1}. ${slide.headline}: ${slide.body}`).join(" | "),
      call_to_action: "Learn More",
    })),
    ...batch.instagramStories.map((story, i) => ({
      id: `ig-story-${i + 1}`,
      format: "story",
      audience: "",
      primary_text: story.frames.join(" | "),
      headline: story.title,
      description: "",
      call_to_action: story.callToAction,
    })),
  ]);
}

export function toMarkdown(batch: AdCreativeBatch, flags: readonly ComplianceFlag[], generatedAt: string): string {
  const lines: string[] = [
    "# MilToPMP ad creatives",
    "",
    `Generated ${generatedAt}. **Drafts for human review: do not publish without checking every claim.**`,
    "",
    "## Compliance review",
    "",
    flags.length === 0
      ? "No risky phrases detected by the automated screen. A person still needs to review claims, tone, and platform policy."
      : flags.map((flag) => `- **${flag.location}**: "${flag.phrase}" (${flag.reason})`).join("\n"),
    "",
    "## TikTok scripts",
    "",
  ];
  batch.tiktokScripts.forEach((s, i) => {
    lines.push(
      `### ${i + 1}. ${s.title} (${s.durationSeconds}s, ${s.angle})`,
      "",
      `- **Hook:** ${s.hook}`,
      `- **Pain point:** ${s.painPoint}`,
      `- **Solution:** ${s.solution}`,
      `- **CTA:** ${s.cta}`,
      `- **On-screen text:** ${s.onScreenText.join(" / ")}`,
      `- **Shots:** ${s.shotList.join(" → ")}`,
      `- **Caption:** ${s.caption} ${s.hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)).join(" ")}`,
      "",
    );
  });
  lines.push("## Instagram feed ads", "");
  batch.instagramFeedAds.forEach((ad, i) => {
    lines.push(
      `### Feed ${i + 1} (${ad.audience})`,
      "",
      `**Headline:** ${ad.headline}`,
      "",
      ad.primaryText,
      "",
      `*${ad.description}* · CTA: ${ad.callToAction}`,
      "",
    );
  });
  lines.push("## Instagram carousels", "");
  batch.instagramCarousels.forEach((c, i) => {
    lines.push(`### Carousel ${i + 1}: ${c.title} (${c.audience})`, "");
    c.slides.forEach((slide, n) => lines.push(`${n + 1}. **${slide.headline}** ${slide.body}`));
    lines.push("", `Caption: ${c.caption}`, "");
  });
  lines.push("## Instagram stories", "");
  batch.instagramStories.forEach((story, i) => {
    lines.push(`### Story ${i + 1}: ${story.title}`, "");
    story.frames.forEach((frame, n) => lines.push(`${n + 1}. ${frame}`));
    lines.push("", `CTA: ${story.callToAction}`, "");
  });
  return lines.join("\n");
}
