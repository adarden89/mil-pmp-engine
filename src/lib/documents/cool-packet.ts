import { z } from "zod";
import { FUNDING_PROGRAM_IDS, FUNDING_PROGRAMS } from "@/lib/funding-data";
import { LEGAL_DISCLAIMER } from "@/lib/site";
import { COOL_DOCUMENT_IDS, type CoolDocumentId } from "./cool-documents-meta";
import { PdfBuilder } from "./pdf-builder";

export { COOL_DOCUMENT_IDS, COOL_DOCUMENT_META, type CoolDocumentId } from "./cool-documents-meta";

const monthOrEmpty = z
  .string()
  .trim()
  .regex(/^(\d{4}-(0[1-9]|1[0-2]))?$/, "Use YYYY-MM.")
  .optional();

/** Personalization the member enters in the browser; every field is optional free text. */
export const packetPersonalizationSchema = z.object({
  branch: z.enum(FUNDING_PROGRAM_IDS).default("navy"),
  credential: z.enum(["CAPM", "PMP"]).default("CAPM"),
  fullName: z.string().trim().max(80).optional(),
  rank: z.string().trim().max(24).optional(),
  rateOrMos: z.string().trim().max(80).optional(),
  command: z.string().trim().max(120).optional(),
  obligatedServiceEnd: monthOrEmpty,
  targetExamMonth: monthOrEmpty,
});

export type PacketPersonalization = z.infer<typeof packetPersonalizationSchema>;

function footer(): string {
  return `Planning aid only, not an official government form. Submit official requests through your service's COOL or credentialing portal. ${LEGAL_DISCLAIMER}`;
}

function identityBlock(pdf: PdfBuilder, p: PacketPersonalization): void {
  pdf
    .section("Member")
    .field("Name", p.fullName)
    .field("Rank", p.rank)
    .field("Rate / MOS / AFSC", p.rateOrMos)
    .field("Command / unit", p.command)
    .field("Target credential", p.credential)
    .field("Obligated service ends", p.obligatedServiceEnd)
    .field("Target exam month", p.targetExamMonth);
}

export function buildJstAuditChecklist(p: PacketPersonalization): ArrayBuffer {
  const program = FUNDING_PROGRAMS[p.branch];
  const hours = p.credential === "PMP" ? 35 : 23;
  const pdf = new PdfBuilder(footer()).header(
    "Joint Services Transcript Audit Checklist",
    `Prepared for ${p.fullName || "the member"} pursuing the ${p.credential} through ${program.shortName}. Work through every box before you submit your PMI application.`,
  );
  identityBlock(pdf, p);

  pdf
    .section("1. Pull the right transcript")
    .checklist([
      "Download your current JST as a PDF from jst.doded.mil (Air Force members: use your CCAF transcript where applicable).",
      "Confirm your name, service, and dates of service match your PMI profile exactly.",
      "Confirm every military school you completed is listed. Missing courses: contact your service's JST or education office to correct the record.",
    ])
    .section(`2. Find project management education (${hours} hours needed)`)
    .checklist([
      "List leadership and management courses (e.g., NCO or PO leadership courses, officer basic courses, supply and maintenance management) with dates and hours.",
      "Mark which courses covered planning, scheduling, budgeting, risk, quality, or leading teams.",
      `Total the qualifying hours. If you are short of ${hours}, plan a course that issues a contact-hour certificate.`,
      "Keep the course certificates. PMI can request proof of education hours during an audit.",
    ]);

  if (p.credential === "PMP") {
    pdf
      .section("3. Map experience to projects")
      .checklist([
        "List each project you led in the last 8 years with start and end months.",
        "For each, name a verifier (supervisor or department head) you can still contact.",
        "Do not count months twice when projects overlap. PMI counts calendar months of experience.",
        "Translate each project in the MilToPMP Translation Studio and resolve every audit flag.",
      ]);
  } else {
    pdf
      .section("3. Start your experience log now")
      .checklist([
        "The CAPM needs no project experience, but the PMP will. Start logging projects today.",
        "Record objective, your role, deliverables, outcome, dates, and a verifier for each.",
      ]);
  }

  pdf
    .section("4. Before you request funding")
    .checklist([
      `Confirm the ${p.credential} is mapped to you on ${program.shortName}: ${program.officialUrl}`,
      ...program.eligibilityHighlights.map((item) => `Eligibility: ${item}`),
      "Have PMI's application approval in hand before you request the exam voucher.",
    ]);

  return pdf.toArrayBuffer();
}

export function buildVoucherPrepWorksheet(p: PacketPersonalization): ArrayBuffer {
  const program = FUNDING_PROGRAMS[p.branch];
  const pdf = new PdfBuilder(footer()).header(
    `${program.shortName} Voucher Prep Worksheet`,
    `Everything you need in one place before you open ${program.portalName}. Official requests are submitted only through ${program.portalUrl}.`,
  );
  identityBlock(pdf, p);

  pdf
    .section("PMI details")
    .field("PMI account email", undefined)
    .field("PMI application ID", undefined)
    .field("Application approved on", undefined);

  pdf.section("Eligibility check").checklist(program.eligibilityHighlights);

  pdf.section("Step-by-step");
  program.steps.forEach((step, index) => {
    pdf.heading(`${index + 1}. ${step.title}`, `${step.owner} · ${step.typicalDuration}`);
    pdf.bullets([step.detail, ...step.documents.map((doc) => `Have ready: ${doc}`)]);
  });

  pdf.section("Watch outs").bullets(program.watchOuts);

  const name = p.fullName || "[Your name]";
  const rank = p.rank || "[Rank]";
  pdf
    .section("Email template: Education Services Officer")
    .paragraph(
      `Subject: ${p.credential} exam funding request through ${program.shortName}\n\n${rank} ${name} here${p.command ? ` from ${p.command}` : ""}. I am pursuing the ${p.credential} and my PMI application ${p.credential === "PMP" ? "has been approved" : "is ready"}. I plan to sit the exam ${p.targetExamMonth ? `in ${p.targetExamMonth}` : "within the next 90 days"}. Could you confirm I meet the current ${program.shortName} requirements and let me know of any command routing I should start now? My obligated service runs through ${p.obligatedServiceEnd || "[month/year]"}.\n\nVery respectfully,\n${rank} ${name}`,
    )
    .section("Email template: approving official")
    .paragraph(
      `Subject: Approval request: ${p.credential} exam via ${program.shortName}\n\nSir/Ma'am, I have submitted a ${program.shortName} request for the ${p.credential} exam. It is related to my duties as ${p.rateOrMos || "[rate/MOS]"} and costs the command no unit funds. My PFA, advancement or promotion status, and obligated service meet program requirements. Request your approval in ${program.portalName} at your earliest convenience.\n\nVery respectfully,\n${rank} ${name}`,
    );

  return pdf.toArrayBuffer();
}

export function buildCoolDocument(id: CoolDocumentId, p: PacketPersonalization): ArrayBuffer {
  return id === "jst-audit-checklist" ? buildJstAuditChecklist(p) : buildVoucherPrepWorksheet(p);
}

export function isCoolDocumentId(value: unknown): value is CoolDocumentId {
  return typeof value === "string" && (COOL_DOCUMENT_IDS as readonly string[]).includes(value);
}
