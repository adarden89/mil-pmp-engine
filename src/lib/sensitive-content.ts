/**
 * Screen for material that must never be pasted into the app: classification
 * and control markings, Social Security numbers, and details that look like
 * DoD ID numbers or locations.
 *
 * This is one layer, not protection on its own. Pattern matching misses
 * anything written in plain prose, so the UI also warns before every paste
 * and asks members to confirm their text is unclassified and contains no CUI
 * or sensitive operational detail. "block" findings are rejected by the API;
 * "warn" findings are shown so the member can remove them.
 */

export type SensitiveSeverity = "block" | "warn";

export interface SensitiveFinding {
  id: string;
  severity: SensitiveSeverity;
  label: string;
  /** The matched text, truncated, so the member can find and remove it. */
  excerpt: string;
}

interface Rule {
  id: string;
  severity: SensitiveSeverity;
  label: string;
  pattern: RegExp;
}

const RULES: readonly Rule[] = [
  {
    id: "classification_banner",
    severity: "block",
    label: "Classification marking",
    // Case-sensitive on purpose: banners are uppercase, while "secret" and "confidential" are ordinary words.
    // A clearance level ("Active TOP SECRET/SCI clearance") is normal resume content, not a marking.
    pattern:
      /\b(?:TOP SECRET|SECRET|CONFIDENTIAL)\b(?!(?:\/SCI)?\s+(?:security\s+)?clearance)(?:\s*\/\/\s*[A-Z][A-Z /-]*)?/g,
  },
  {
    id: "dissemination_control",
    severity: "block",
    label: "Dissemination control marking",
    pattern: /\b(?:NOFORN|ORCON|IMCON|PROPIN|RELIDO|FVEY|REL TO(?: [A-Z]{3})+|FOUO|LIMDIS|SBU)\b/g,
  },
  {
    id: "cui_marking",
    severity: "block",
    label: "CUI marking",
    pattern: /\bCUI\b|\bCONTROLLED UNCLASSIFIED\b|\bCONTROLLED UNCLASSIFIED INFORMATION\b/g,
  },
  {
    id: "portion_marking",
    severity: "block",
    label: "Portion marking",
    pattern: /\((?:TS|S|C|U\/\/FOUO|CUI|S\/\/NF|TS\/\/SCI|S\/\/REL)\)(?=\s)/g,
  },
  {
    id: "ssn",
    severity: "block",
    label: "Social Security number",
    pattern: /\b(?!000|666|9\d\d)\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
  },
  {
    id: "dod_id",
    severity: "warn",
    label: "Possible DoD ID number",
    pattern: /\b\d{10}\b/g,
  },
  {
    id: "mgrs",
    severity: "warn",
    label: "Possible grid coordinate",
    pattern: /\b\d{1,2}[C-HJ-NP-X]\s?[A-HJ-NP-Z]{2}\s?(?:\d{4}|\d{6}|\d{8}|\d{10})\b/g,
  },
  {
    id: "lat_long",
    severity: "warn",
    label: "Possible latitude / longitude",
    pattern: /-?\b\d{1,2}\.\d{3,}\s*[,/ ]\s*-?\d{1,3}\.\d{3,}\b/g,
  },
];

const MAX_EXCERPT = 40;

export function screenSensitiveContent(text: string): SensitiveFinding[] {
  const findings: SensitiveFinding[] = [];
  const seen = new Set<string>();
  for (const rule of RULES) {
    for (const match of text.matchAll(rule.pattern)) {
      const excerpt = match[0].trim().slice(0, MAX_EXCERPT);
      const key = `${rule.id}:${excerpt}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({ id: rule.id, severity: rule.severity, label: rule.label, excerpt });
    }
  }
  return findings;
}

export function blockingFindings(findings: readonly SensitiveFinding[]): SensitiveFinding[] {
  return findings.filter((finding) => finding.severity === "block");
}

/** The message the API returns when it refuses text, and the UI shows inline. */
export function sensitiveContentMessage(findings: readonly SensitiveFinding[]): string {
  const labels = [...new Set(findings.map((finding) => finding.label.toLowerCase()))];
  return `Remove the ${labels.join(", ")} before continuing. Never paste classified information, CUI, Social Security numbers, or sensitive operational details.`;
}

export const SENSITIVE_CONTENT_NOTICE =
  "Paste only unclassified, non-CUI text. Remove names, Social Security and DoD ID numbers, unit locations, and operational details. An automated check catches obvious markings, not everything, so the responsibility is yours.";
