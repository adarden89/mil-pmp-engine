/**
 * Generates TikTok scripts and Instagram ad copy with Claude, screens them for
 * risky claims, and writes markdown + CSV for human review.
 *
 *   npm run generate-ads -- --tiktok 6 --instagram 4 --out ad-creatives
 *
 * Reads ANTHROPIC_API_KEY (and optional ANTHROPIC_MODEL) from the environment
 * or .env.local. Nothing is published: output is drafts for a person to review.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { adCreativeBatchSchema, instagramCsv, screenCompliance, tiktokCsv, toMarkdown } from "../src/lib/ad-creatives";
import { PRODUCTS } from "../src/lib/catalog";
import { EXAM_FEES, NAVY_COOL } from "../src/lib/pmi-facts";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: rely on the shell environment.
}

const { values } = parseArgs({
  options: {
    tiktok: { type: "string", default: "6" },
    instagram: { type: "string", default: "4" },
    out: { type: "string", default: "ad-creatives" },
  },
});

const tiktokCount = Math.min(Math.max(Number(values.tiktok) || 6, 1), 15);
const instagramCount = Math.min(Math.max(Number(values.instagram) || 4, 1), 10);

const price = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const SYSTEM_PROMPT = `You are a direct-response copywriter for MilToPMP, an independent software product that helps U.S. service members (E-1 to E-9 and officers) earn the CAPM or PMP project management certification with the exam fee covered by their service's credentialing program (Navy COOL, Army IgnitED Credentialing Assistance, Air Force COOL).

Facts you may use (do not invent others):
- Products: ${PRODUCTS.base_tool.name} ${price(PRODUCTS.base_tool.priceCents)} (AI tool that turns NCOER, EPR/EPB, EVAL, and FITREP bullets into PMI application language, with an audit-risk meter); ${PRODUCTS.cool_fast_track.name} ${price(PRODUCTS.cool_fast_track.priceCents)} (${NAVY_COOL.formNumber} prep packet and timing check); ${PRODUCTS.exam_vault.name} ${price(PRODUCTS.exam_vault.priceCents)} (flashcards from zero knowledge to exam-ready).
- Exam fees approved COOL / credentialing funding can cover: CAPM $${EXAM_FEES.CAPM.member}-$${EXAM_FEES.CAPM.nonMember}, PMP $${EXAM_FEES.PMP.member}-$${EXAM_FEES.PMP.nonMember}.
- CAPM: 23 contact hours of PM education, no experience needed. PMP: 35 contact hours plus 36 months leading projects (bachelor's) or 60 months (no bachelor's).
- Most junior enlisted members start with the CAPM.
- The #1 mistake: paying out of pocket or scheduling the exam before the voucher is approved. Programs do not reimburse it.

Hard rules (ads that break these get rejected by platforms or create legal risk):
1. Never imply endorsement by DoD, any military service, Navy COOL, or PMI. Never say "official", "approved", or "endorsed" about the product. No seals, insignia, or logos.
2. No uniforms. UGC creators appear in civilian clothes. Do not suggest filming on base or in government spaces.
3. "$0 out of pocket" refers only to the exam fee, and only when funding is approved. Never imply the product is free or that funding is guaranteed. If you mention the product, its price must be clear.
4. No guaranteed outcomes: no "guaranteed", "pass first try", "audit-proof", or salary promises.
5. No fake urgency, fake reviews, fabricated statistics, or invented testimonials. UGC scripts are scripts for a paid creator; captions for creator posts include #ad.
6. Do not assert or imply sensitive personal attributes of the viewer (health, finances, disability). Address situations ("If your EVALs are full of acronyms..."), not identities.
7. Plain, energetic, respectful military voice. Light jargon is fine (EVAL, NCOER, COOL) because the audience knows it.

Formats:
- TikTok: ${tiktokCount} UGC scripts, 15 to 30 seconds each, structured Hook (first 3 seconds) -> Pain point -> Solution -> CTA. Mix angles: Navy COOL vouchers and the out-of-pocket trap; translating NCOER/EPR/FITREP bullets into a PMP application; "accidental PM" (FTX planning, inspections, deployments are projects); CAPM for junior enlisted; transitioning veterans.
- Instagram: ${instagramCount} feed ads (primary text under 125 characters before the fold, headline under 40 characters), ${Math.max(2, Math.ceil(instagramCount / 2))} carousels of 5 to 7 slides, and ${Math.max(2, Math.ceil(instagramCount / 2))} story sequences of 3 to 4 frames. Target active duty members and transitioning veterans. End primary text with: "Not affiliated with DoD or PMI."`;

async function main() {
  const client = new Anthropic();
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
  console.log(`Generating ${tiktokCount} TikTok scripts and ${instagramCount} Instagram ads with ${model}...`);

  const response = await client.beta.messages.parse({
    model,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(adCreativeBatchSchema) },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: "Write the full creative batch now, following every hard rule." }],
  });

  if (response.stop_reason === "refusal") throw new Error("Claude declined to generate this batch.");
  if (response.stop_reason === "max_tokens") throw new Error("Output was cut off. Ask for fewer creatives.");
  const batch = response.parsed_output;
  if (!batch) throw new Error("Claude returned an unexpected format.");

  const flags = screenCompliance(batch);
  const stamp = new Date().toISOString().replaceAll(":", "-").slice(0, 19);
  const outDir = path.resolve(values.out, stamp);
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(outDir, "ad-creatives.md"), toMarkdown(batch, flags, new Date().toISOString())),
    writeFile(path.join(outDir, "tiktok-scripts.csv"), tiktokCsv(batch)),
    writeFile(path.join(outDir, "instagram-ads.csv"), instagramCsv(batch)),
    writeFile(path.join(outDir, "batch.json"), JSON.stringify(batch, null, 2)),
  ]);

  console.log(`Wrote ${outDir}`);
  console.log(
    flags.length === 0
      ? "Compliance screen: no risky phrases found. Review every claim before publishing."
      : `Compliance screen: ${flags.length} flag(s). See the "Compliance review" section before publishing.`,
  );
}

main().catch((error: unknown) => {
  if (error instanceof Anthropic.AuthenticationError) {
    console.error("Anthropic rejected the API key. Set ANTHROPIC_API_KEY in .env.local or your shell.");
  } else if (error instanceof Anthropic.RateLimitError) {
    console.error("Rate limited by Anthropic. Wait a minute and retry.");
  } else if (error instanceof Anthropic.APIError) {
    console.error(`Anthropic API error ${error.status}: ${error.message}`);
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exitCode = 1;
});
