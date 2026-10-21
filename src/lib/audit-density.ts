import type { ProcessGroupKey, TranslateRequest, TranslationResult } from "./translation-schema";
import { countWords } from "./utils";

/**
 * Audit-density check: a heuristic read of how well a project write-up would
 * hold up if PMI selects the application for audit. It rewards what auditors
 * and verifiers look for (your own actions, coverage of the project lifecycle,
 * measurable outcomes, civilian language) and penalizes what triggers
 * follow-up questions (unexplained acronyms, vague "we" statements, length
 * outside PMI's recommended 200-500 words).
 */

export type CheckStatus = "pass" | "warn" | "fail";

export interface AuditCheck {
  id: "length" | "coverage" | "metrics" | "jargon" | "ownership" | "elements" | "fidelity";
  label: string;
  status: CheckStatus;
  detail: string;
  weight: number;
}

export interface AuditDensityReport {
  score: number;
  grade: "audit_ready" | "needs_work" | "high_risk";
  gradeLabel: string;
  wordCount: number;
  checks: AuditCheck[];
  /** Figures in the write-up that do not appear in the member's own material. */
  unsupportedFigures: string[];
}

/** What the member actually wrote, so every figure in the draft can be traced back to it. */
export interface AuditSource {
  text: string;
  /** Numbers derived from structured inputs, such as the project length in months. */
  allowedNumbers?: readonly number[];
}

/** Military terms a civilian PMI reviewer may not parse. Matched as whole words. */
export const MILITARY_JARGON = [
  "EVAL",
  "EVALS",
  "NCOER",
  "OER",
  "FITREP",
  "EPB",
  "OPB",
  "EER",
  "LPO",
  "LCPO",
  "DIVO",
  "DH",
  "NCOIC",
  "OIC",
  "XO",
  "CO",
  "CMC",
  "CSM",
  "1SG",
  "MOS",
  "AFSC",
  "UIC",
  "TAD",
  "TDY",
  "PCS",
  "CONUS",
  "OCONUS",
  "INSURV",
  "OPTEMPO",
  "OPORD",
  "FRAGO",
  "S-1",
  "S-2",
  "S-3",
  "S-4",
  "S-6",
  "S3",
  "S4",
  "FTX",
  "CPX",
  "COA",
  "MDMP",
  "CONOP",
  "CONOPS",
  "PMCS",
  "MTOE",
  "AAR",
  "EPR",
  "RSO",
  "SITREP",
  "POA&M",
  "CASREP",
  "3M",
  "PMS",
  "ESWS",
  "EAWS",
  "billet",
  "Sailors",
  "Soldiers",
  "Airmen",
  "Marines",
  "Guardians",
  "shipmates",
  "underway",
  "deployment",
  "command",
] as const;

const jargonPattern = new RegExp(
  `(?<![\\w&])(${MILITARY_JARGON.map((term) => term.replace(/[.*+?^${}()|[\]\\&]/g, "\\$&")).join("|")})(?![\\w&])`,
  "g",
);

export function findJargon(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(jargonPattern)) {
    found.add(match[1]);
  }
  return [...found];
}

/** Numbers, percentages, currency, and multipliers ("3x"). */
export function countQuantifiers(text: string): number {
  const matches =
    text.match(/(\$\s?\d[\d,.]*\s?[kKmMbB]?|\d[\d,.]*\s?%|\b\d+(?:[.,]\d+)?x\b|\b\d[\d,]*(?:\.\d+)?\b)/g) ?? [];
  // Calendar years describe when, not how much, so they are not outcomes.
  return matches.filter((match) => !/^(19|20)\d{2}$/.test(match)).length;
}

function monthNumber(yyyyMm: string): number {
  const [year, month] = yyyyMm.split("-").map(Number);
  return year * 12 + month;
}

/** Everything the member typed for this project, plus the project length derived from its dates. */
export function auditSourceFor(input: TranslateRequest): AuditSource {
  const span = monthNumber(input.endMonth) - monthNumber(input.startMonth);
  const allowed = [span, span + 1, ...(input.teamSize ? [input.teamSize] : [])];
  if ((span + 1) % 12 === 0) allowed.push((span + 1) / 12);
  return {
    text: [input.rawBullets, input.jstCourses ?? "", input.projectTitle, input.billet, input.rateOrMos].join("\n"),
    allowedNumbers: allowed,
  };
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  dozen: 12,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  fifty: 50,
  hundred: 100,
};

const SCALE: Record<string, number> = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, b: 1e9, billion: 1e9 };

const figurePattern = /(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)\s*(k|m|b|thousand|million|billion)?\b/gi;

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Numeric values mentioned in a text, with scaled variants: "$2.1M" yields 2.1
 * and 2,100,000 so "$2.1 million" in the draft matches "$2.1M" in the bullets.
 */
export function extractFigures(text: string): { raw: string; values: number[] }[] {
  const figures: { raw: string; values: number[] }[] = [];
  for (const match of text.matchAll(figurePattern)) {
    const base = Number(match[1].replace(/,/g, ""));
    if (!Number.isFinite(base)) continue;
    const scale = match[2] ? SCALE[match[2].toLowerCase()] : undefined;
    figures.push({ raw: match[0].trim(), values: scale ? [round(base), round(base * scale)] : [round(base)] });
  }
  return figures;
}

function knownNumbers(source: AuditSource): Set<number> {
  const known = new Set<number>(source.allowedNumbers ?? []);
  for (const figure of extractFigures(source.text)) {
    for (const value of figure.values) known.add(value);
  }
  for (const word of source.text.toLowerCase().match(/[a-z]+/g) ?? []) {
    if (word in NUMBER_WORDS) known.add(NUMBER_WORDS[word]);
  }
  return known;
}

/**
 * Figures in the draft that never appear in the member's material: the most
 * likely sign of an invented budget, headcount, or result. Calendar years and
 * single digits used as list counts are ignored.
 */
export function findUnsupportedFigures(draft: string, source: AuditSource): string[] {
  const known = knownNumbers(source);
  const unsupported = new Set<string>();
  for (const figure of extractFigures(draft)) {
    const [value] = figure.values;
    if (/^(19|20)\d{2}$/.test(figure.raw)) continue;
    if (figure.values.some((candidate) => known.has(candidate))) continue;
    if (value <= 5 && Number.isInteger(value) && !/[%$]/.test(figure.raw)) continue;
    unsupported.add(figure.raw);
  }
  return [...unsupported];
}

function fidelityCheck(unsupported: string[]): AuditCheck {
  const base = { id: "fidelity", label: "Every figure traces to your bullets", weight: 20 } as const;
  if (unsupported.length === 0) {
    return { ...base, status: "pass", detail: "No numbers appear that are missing from your own material." };
  }
  const list = unsupported.map((figure) => `"${figure}"`).join(", ");
  return {
    ...base,
    status: unsupported.length === 1 ? "warn" : "fail",
    detail: `Not found in your bullets: ${list}. Verify each one or remove it before you submit.`,
  };
}

function lengthCheck(wordCount: number): AuditCheck {
  const base = { id: "length", label: "PMI length window (200-500 words)", weight: 20 } as const;
  if (wordCount >= 200 && wordCount <= 500) {
    return { ...base, status: "pass", detail: `${wordCount} words, inside the recommended range.` };
  }
  if ((wordCount >= 150 && wordCount < 200) || (wordCount > 500 && wordCount <= 600)) {
    return { ...base, status: "warn", detail: `${wordCount} words, just outside 200-500. Tighten or expand.` };
  }
  return { ...base, status: "fail", detail: `${wordCount} words, far outside PMI's 200-500 recommendation.` };
}

function coverageCheck(groups: TranslationResult["processGroups"]): AuditCheck {
  const keys = Object.keys(groups) as ProcessGroupKey[];
  const covered = keys.filter((key) => groups[key].some((item) => item.trim() !== ""));
  const missing = keys.filter((key) => !covered.includes(key));
  const base = { id: "coverage", label: "Lifecycle coverage (5 process groups)", weight: 25 } as const;
  if (covered.length === 5) {
    return { ...base, status: "pass", detail: "Initiating through Closing are all evidenced." };
  }
  if (covered.length >= 3) {
    return { ...base, status: "warn", detail: `Missing evidence for: ${missing.join(", ")}.` };
  }
  return { ...base, status: "fail", detail: `Only ${covered.length} of 5 process groups evidenced.` };
}

function metricsCheck(summary: string, outcome: string): AuditCheck {
  const quantifiers = countQuantifiers(`${summary} ${outcome}`);
  const base = { id: "metrics", label: "Measurable outcomes", weight: 20 } as const;
  if (quantifiers >= 3) {
    return { ...base, status: "pass", detail: `${quantifiers} quantified results (budget, schedule, %, counts).` };
  }
  if (quantifiers >= 1) {
    return {
      ...base,
      status: "warn",
      detail: "Add at least one more number: budget, team size, schedule, or % change.",
    };
  }
  return { ...base, status: "fail", detail: "No measurable results. Reviewers cannot verify vague outcomes." };
}

function jargonCheck(summary: string): AuditCheck {
  const jargon = findJargon(summary);
  const base = { id: "jargon", label: "Civilian readability", weight: 15 } as const;
  if (jargon.length === 0) {
    return { ...base, status: "pass", detail: "No unexplained military terms detected." };
  }
  if (jargon.length <= 2) {
    return { ...base, status: "warn", detail: `Translate or spell out: ${jargon.join(", ")}.` };
  }
  return { ...base, status: "fail", detail: `Too much military jargon: ${jargon.join(", ")}.` };
}

function ownershipCheck(summary: string): AuditCheck {
  const iStatements = (summary.match(/\bI\s+[a-z]+/g) ?? []).length;
  const weStatements = (summary.match(/\b[Ww]e\b/g) ?? []).length;
  const base = { id: "ownership", label: "Your role is explicit", weight: 10 } as const;
  if (iStatements >= 3 && weStatements <= iStatements / 2) {
    return { ...base, status: "pass", detail: `${iStatements} first-person action statements.` };
  }
  if (iStatements >= 1) {
    return { ...base, status: "warn", detail: 'Use more "I led / I built / I tracked" statements and fewer "we".' };
  }
  return { ...base, status: "fail", detail: "PMI audits what you did. State your own actions in first person." };
}

function elementsCheck(result: TranslationResult): AuditCheck {
  const missing: string[] = [];
  if (!result.objective.trim()) missing.push("objective");
  if (!result.role.trim()) missing.push("role");
  if (!result.deliverables.some((d) => d.trim())) missing.push("deliverables");
  if (!result.outcome.trim()) missing.push("outcome");
  const base = { id: "elements", label: "Required PMI elements", weight: 10 } as const;
  if (missing.length === 0) {
    return { ...base, status: "pass", detail: "Objective, role, deliverables, and outcome all present." };
  }
  return {
    ...base,
    status: missing.length === 1 ? "warn" : "fail",
    detail: `Missing: ${missing.join(", ")}.`,
  };
}

const STATUS_CREDIT: Record<CheckStatus, number> = { pass: 1, warn: 0.5, fail: 0 };

export function analyzeAuditDensity(result: TranslationResult, source?: AuditSource): AuditDensityReport {
  const wordCount = countWords(result.applicationSummary);
  const unsupportedFigures = source
    ? findUnsupportedFigures(`${result.applicationSummary} ${result.outcome}`, source)
    : [];
  const checks = [
    lengthCheck(wordCount),
    coverageCheck(result.processGroups),
    metricsCheck(result.applicationSummary, result.outcome),
    jargonCheck(result.applicationSummary),
    ownershipCheck(result.applicationSummary),
    elementsCheck(result),
    ...(source ? [fidelityCheck(unsupportedFigures)] : []),
  ];
  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce((sum, check) => sum + check.weight * STATUS_CREDIT[check.status], 0);
  const score = Math.round((earned / totalWeight) * 100);
  const grade = score >= 80 ? "audit_ready" : score >= 60 ? "needs_work" : "high_risk";
  const gradeLabel =
    grade === "audit_ready" ? "Low audit risk" : grade === "needs_work" ? "Moderate audit risk" : "High audit risk";
  return { score, grade, gradeLabel, wordCount, checks, unsupportedFigures };
}
