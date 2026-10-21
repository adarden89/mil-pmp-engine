import { z } from "zod";
import { PROCESS_GROUP_LABELS, type ProcessGroupKey, type SavedTranslation } from "@/lib/translation-schema";

/**
 * Command supervisor verification packet. If PMI audits an application, the
 * applicant's former supervisor may be asked to confirm the experience, so the
 * packet shows them what the evaluation says next to what the applicant wrote
 * for PMI, before anything is submitted. Everything here is pure text
 * building; the PDF layout lives in components/dashboard/verification.
 *
 * There is deliberately no SSN, DoD ID, unit, or location anywhere in the
 * packet: a supervisor confirms experience from memory and the evaluation
 * text, and the packet may be forwarded by email.
 */

export const SUPERVISOR_ROLES = [
  "commanding_officer",
  "executive_officer",
  "department_head",
  "division_officer",
  "ncoic_oic",
  "lpo_section_chief",
  "civilian_supervisor",
  "other",
] as const;
export type SupervisorRole = (typeof SUPERVISOR_ROLES)[number];

export const SUPERVISOR_ROLE_LABELS: Record<SupervisorRole, string> = {
  commanding_officer: "Commanding Officer",
  executive_officer: "Executive Officer",
  department_head: "Department Head",
  division_officer: "Division Officer",
  ncoic_oic: "NCOIC / OIC",
  lpo_section_chief: "Leading Petty Officer / Section Chief",
  civilian_supervisor: "Civilian supervisor",
  other: "Other",
};

/** How the applicant refers to the supervisor in the letter: "when you were my ...". */
const ROLE_RELATION: Record<SupervisorRole, string> = {
  commanding_officer: "my Commanding Officer",
  executive_officer: "my Executive Officer",
  department_head: "my Department Head",
  division_officer: "my Division Officer",
  ncoic_oic: "my NCOIC / OIC",
  lpo_section_chief: "my Leading Petty Officer / Section Chief",
  civilian_supervisor: "my supervisor",
  other: "my supervisor",
};

/** Always in the letter and the PDF, word for word. */
export const INTEGRITY_SENTENCE =
  "Please confirm only what you directly observed. If anything is inaccurate, tell me and I will fix it before I submit.";

export const PACKET_FOOTER = "Prepared by the applicant with MilToPMP. Not a PMI form.";

export const COLUMN_HEADINGS = { military: "What my evaluation says", pmi: "What I wrote for PMI" } as const;

/** What the supervisor is asked to check. Phrased as questions of fact, never as an attestation to sign. */
export const SUPERVISOR_CHECKLIST = [
  "The project, the dates, and my role match what you remember.",
  "The evaluation text is what was written about my work on this project.",
  "Each statement in what I wrote for PMI describes work you saw me do.",
  "Numbers (team size, budget, results) match the record or your recollection.",
  "Anything inaccurate or overstated is in your reply, so I can fix it before I submit.",
] as const;

/**
 * Longest mailto: URL we hand to the operating system. Some desktop mail
 * clients (notably Outlook on Windows) truncate or refuse links past roughly
 * 2,000 characters, so longer emails are copy-only.
 */
export const MAILTO_MAX_LENGTH = 2000;

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const simpleEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const month = z.string().regex(monthPattern, "Use YYYY-MM.");

export const packetApplicantSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  dutyTitle: z.string().trim().min(2, "Enter your duty title at the time.").max(160),
  contact: z.string().trim().min(3, "Add a phone number or email address.").max(120),
});

export const packetSupervisorSchema = z.object({
  name: z.string().trim().min(2, "Enter your supervisor's name.").max(80),
  role: z.enum(SUPERVISOR_ROLES, "Choose their role."),
  email: z
    .string()
    .trim()
    .max(120)
    .refine((value) => value === "" || simpleEmailPattern.test(value), "Enter a valid email or leave it blank."),
});

export const packetDetailsSchema = z
  .object({
    title: z.string().trim().min(3, "Give the project a title your supervisor will recognize.").max(160),
    startMonth: month,
    endMonth: month,
  })
  .refine((value) => value.startMonth <= value.endMonth, {
    message: "End month must be on or after the start month.",
    path: ["endMonth"],
  });

export const packetMilitaryTextSchema = z
  .string()
  .trim()
  .min(20, "Paste the evaluation text for this project.")
  .max(8000, "Keep the evaluation text under 8,000 characters.");

export const packetPmiTextSchema = z
  .string()
  .trim()
  .min(20, "Paste what you wrote for PMI.")
  .max(8000, "Keep the PMI text under 8,000 characters.");

const processGroupsSchema = z.object({
  initiating: z.array(z.string()),
  planning: z.array(z.string()),
  executing: z.array(z.string()),
  monitoringControlling: z.array(z.string()),
  closing: z.array(z.string()),
});

export const packetProjectSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    /** Civilian title used on the PMI application, when it differs from the military name. */
    pmiTitle: z.string().trim().max(300),
    startMonth: month,
    endMonth: month,
    militaryText: packetMilitaryTextSchema,
    pmiText: packetPmiTextSchema,
    glossary: z.array(z.object({ military: z.string().trim().max(120), civilian: z.string().trim().max(300) })).max(60),
    processGroups: processGroupsSchema,
  })
  .refine((value) => value.startMonth <= value.endMonth, {
    message: "End month must be on or after the start month.",
    path: ["endMonth"],
  });

/** Unknown keys (an SSN or DoD ID pasted into a request, say) are stripped by parse(). */
export const supervisorPacketSchema = z.object({
  applicant: packetApplicantSchema,
  supervisor: packetSupervisorSchema,
  project: packetProjectSchema,
});

export type PacketApplicant = z.infer<typeof packetApplicantSchema>;
export type PacketSupervisor = z.infer<typeof packetSupervisorSchema>;
export type PacketProject = z.infer<typeof packetProjectSchema>;
export type PacketProcessGroups = z.infer<typeof processGroupsSchema>;
export type SupervisorPacket = z.infer<typeof supervisorPacketSchema>;

export const EMPTY_PROCESS_GROUPS: PacketProcessGroups = {
  initiating: [],
  planning: [],
  executing: [],
  monitoringControlling: [],
  closing: [],
};

export const EMPTY_PROJECT: PacketProject = {
  title: "",
  pmiTitle: "",
  startMonth: "",
  endMonth: "",
  militaryText: "",
  pmiText: "",
  glossary: [],
  processGroups: EMPTY_PROCESS_GROUPS,
};

/** First message per field path ("endMonth", "email"), for inline form errors. */
export function issuesByField(error: z.ZodError): Record<string, string> {
  const issues: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_";
    issues[key] ??= issue.message;
  }
  return issues;
}

/** One packet project from a saved Translation Studio run. */
export function projectFromSaved(saved: SavedTranslation): PacketProject {
  const { input, translation } = saved;
  return {
    title: input.projectTitle,
    pmiTitle: translation.civilianProjectTitle,
    startMonth: input.startMonth,
    endMonth: input.endMonth,
    militaryText: normalizeText(input.rawBullets),
    pmiText: normalizeText(translation.applicationSummary),
    glossary: translation.jargonTranslations.filter((entry) => entry.military.trim() && entry.civilian.trim()),
    processGroups: translation.processGroups,
  };
}

/** CRLF and CR to LF, trailing spaces removed, no more than one blank line in a row. */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Collapse any whitespace, including newlines, to single spaces. Used for names and subject lines. */
export function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** "2024-03" to "March 2024". Anything else is returned as given. */
export function formatMonth(yyyyMm: string): string {
  if (!monthPattern.test(yyyyMm)) return yyyyMm;
  const [year, monthNumber] = yyyyMm.split("-");
  return `${MONTH_NAMES[Number(monthNumber) - 1]} ${year}`;
}

export function formatDateRange(startMonth: string, endMonth: string): string {
  if (!startMonth && !endMonth) return "";
  if (!endMonth || startMonth === endMonth) return formatMonth(startMonth);
  if (!startMonth) return formatMonth(endMonth);
  return `${formatMonth(startMonth)} to ${formatMonth(endMonth)}`;
}

/** Role as printed in the packet; "Other" reads as plain "Supervisor". */
export function supervisorRoleLabel(role: SupervisorRole): string {
  return role === "other" ? "Supervisor" : SUPERVISOR_ROLE_LABELS[role];
}

/** Non-empty process groups in lifecycle order, each with its PMI label. */
export function processGroupEvidence(groups: PacketProcessGroups): { key: ProcessGroupKey; label: string; items: string[] }[] {
  const order: ProcessGroupKey[] = ["initiating", "planning", "executing", "monitoringControlling", "closing"];
  return order
    .map((key) => ({
      key,
      label: PROCESS_GROUP_LABELS[key],
      items: groups[key].map((item) => oneLine(item)).filter(Boolean),
    }))
    .filter((group) => group.items.length > 0);
}

/** The civilian title, only when it says something the military title does not. */
function distinctPmiTitle(project: PacketProject): string | null {
  const pmiTitle = oneLine(project.pmiTitle);
  return pmiTitle && pmiTitle.toLowerCase() !== oneLine(project.title).toLowerCase() ? pmiTitle : null;
}

export interface OutreachEmail {
  subject: string;
  body: string;
}

const SUBJECT_TITLE_MAX = 80;
const DIVIDER = "----------------------------------------";

/**
 * Plain-text email from the applicant to the former supervisor. It reminds
 * them of the project, explains why they might hear from PMI, and asks for
 * corrections. It never asks them to sign anything and sets no deadline.
 */
export function buildOutreachEmail(packet: SupervisorPacket): OutreachEmail {
  const { applicant, supervisor, project } = packet;
  const title = oneLine(project.title);
  const shortTitle =
    title.length > SUBJECT_TITLE_MAX ? `${title.slice(0, SUBJECT_TITLE_MAX - 3).trimEnd()}...` : title;
  const pmiTitle = distinctPmiTitle(project);
  const dates = formatDateRange(project.startMonth, project.endMonth);

  const glossary = project.glossary
    .map((entry) => ({ military: oneLine(entry.military), civilian: oneLine(entry.civilian) }))
    .filter((entry) => entry.military && entry.civilian);

  const lines = [
    `Hello ${oneLine(supervisor.name)},`,
    "",
    `I am preparing my application for a Project Management Institute (PMI) certification. One of the projects I am listing is from when you were ${ROLE_RELATION[supervisor.role]}:`,
    "",
    `  ${title}`,
    ...(dates ? [`  ${dates}`] : []),
    `  My role: ${oneLine(applicant.dutyTitle)}`,
    "",
    "PMI selects some applications for audit at random. If mine is selected, PMI may ask you to confirm the experience I describe. I would rather you see exactly what I wrote now, before I submit.",
    "",
    "Below is a side-by-side summary: what my evaluation says, then what I wrote for PMI. When you have a few minutes, please read it and reply with any corrections.",
    "",
    INTEGRITY_SENTENCE,
    "",
    "There is nothing to sign right now. A reply to this email is all I need.",
    "",
    "Thank you,",
    oneLine(applicant.name),
    oneLine(applicant.contact),
    "",
    DIVIDER,
    COLUMN_HEADINGS.military.toUpperCase(),
    DIVIDER,
    normalizeText(project.militaryText),
    "",
    DIVIDER,
    COLUMN_HEADINGS.pmi.toUpperCase(),
    DIVIDER,
    ...(pmiTitle ? [`Project title on my application: ${pmiTitle}`, ""] : []),
    normalizeText(project.pmiText),
    ...(glossary.length > 0
      ? ["", DIVIDER, "MILITARY TERMS I TRANSLATED", DIVIDER, ...glossary.map((e) => `- ${e.military}: ${e.civilian}`)]
      : []),
  ];

  return { subject: `Quick review of my PMI application: ${shortTitle}`, body: lines.join("\n") };
}

/**
 * Percent-encode a mailto header value. RFC 6068 wants line breaks in the body
 * as CRLF, so every newline becomes %0D%0A.
 */
export function encodeMailtoValue(value: string): string {
  return encodeURIComponent(value.replace(/\r\n?/g, "\n").replace(/\n/g, "\r\n"));
}

export type MailtoLink = { ok: true; href: string } | { ok: false; reason: "too_long"; length: number; limit: number };

/** A mailto: link for the email, or a too_long result when mail apps may truncate it. */
export function buildMailtoLink(
  to: string | undefined,
  email: OutreachEmail,
  limit: number = MAILTO_MAX_LENGTH,
): MailtoLink {
  const address = to?.trim() ?? "";
  // A malformed address is left out rather than breaking the link; the member types it in their mail app.
  const recipient = simpleEmailPattern.test(address) ? encodeURIComponent(address).replace(/%40/g, "@") : "";
  const href = `mailto:${recipient}?subject=${encodeMailtoValue(oneLine(email.subject))}&body=${encodeMailtoValue(email.body)}`;
  if (href.length > limit) return { ok: false, reason: "too_long", length: href.length, limit };
  return { ok: true, href };
}

export type SensitiveNumberKind = "ssn" | "dod_id";

/**
 * Evaluation forms carry an SSN or DoD ID in their header blocks, and members
 * sometimes paste the whole page. Flag anything shaped like one so it can be
 * removed before the packet is shared.
 */
export function findSensitiveNumbers(text: string): SensitiveNumberKind[] {
  const found: SensitiveNumberKind[] = [];
  if (/(?<![\d-])\d{3}[- ]\d{2}[- ]\d{4}(?![\d-])/.test(text) || /(?<![\d,.$])\d{9}(?![\d,.])/.test(text)) {
    found.push("ssn");
  }
  if (/(?<![\d,.$])\d{10}(?![\d,.])/.test(text)) found.push("dod_id");
  return found;
}

/** Glyphs the PDF's standard fonts cannot draw, mapped to plain equivalents. */
const PDF_REPLACEMENTS: [RegExp, string][] = [
  [/←/g, "<-"],
  [/[→⇒➜]/g, "->"],
  [/≤/g, "<="],
  [/≥/g, ">="],
  [/≈/g, "~"],
  [/×/g, "x"],
  [/[‐‑‒−]/g, "-"],
  [/[ -   ]/g, " "],
  [/[​-‍⁠﻿]/g, ""],
  [/[✓✔✅]/g, "*"],
];

/** Characters above U+00FF that jsPDF maps into WinAnsi for its built-in fonts. */
const WIN_ANSI_EXTRAS = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");

/**
 * Text the built-in PDF fonts (WinAnsi) can render. Common symbols become
 * ASCII; anything else outside the code page is dropped instead of printing
 * as garbage.
 */
export function toPdfText(text: string): string {
  let output = text.normalize("NFC");
  for (const [pattern, replacement] of PDF_REPLACEMENTS) output = output.replace(pattern, replacement);
  return [...output]
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return (
        code === 10 || code === 9 || (code >= 32 && code <= 126) || (code >= 160 && code <= 255) || WIN_ANSI_EXTRAS.has(char)
      );
    })
    .join("");
}

export function packetFileName(project: Pick<PacketProject, "title">): string {
  const slug = project.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
    .replace(/-$/, "");
  return `supervisor-verification-${slug || "project"}.pdf`;
}
