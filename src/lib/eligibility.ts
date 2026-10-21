/**
 * CAPM vs. PMP routing.
 *
 * PMI does not look at rank or time in service. It counts months spent leading
 * and directing projects within the last eight years, plus hours of project
 * management education:
 * - PMP, four-year degree: 36 months + 35 contact hours
 * - PMP, GAC-accredited degree: 24 months + 35 contact hours
 * - PMP, high school diploma or associate degree: 60 months + 35 contact hours
 * - CAPM: secondary diploma + 23 contact hours, no experience
 * An active CAPM satisfies the PMP's 35-hour education requirement.
 *
 * Product rule layered on top: junior enlisted (E-1 to E-4) are routed to the
 * CAPM first. Their numbers may meet the PMP bar on paper, but most of that
 * time is supporting rather than leading work, which is what PMI audits.
 */

import { z } from "zod";
import { EDUCATION_HOURS, EXAM_FEES, NAVY_COOL } from "./pmi-facts";
import { BRANCHES, type Branch } from "./translation-schema";

export const RANK_BANDS = ["E1_E4", "E5_E6", "E7_E9", "W1_W5", "O1_O3", "O4_PLUS"] as const;
export type RankBand = (typeof RANK_BANDS)[number];

export const EDUCATION_LEVELS = ["HIGH_SCHOOL", "ASSOCIATE", "BACHELOR", "BACHELOR_GAC", "GRADUATE"] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export interface EligibilityInput {
  branch: Branch;
  rank: RankBand;
  education: EducationLevel;
  /** Months spent leading or directing projects in the last eight years. */
  leadershipMonths: number;
}

export type CertificationPath = "CAPM" | "PMP";
export type NoteTone = "info" | "warning" | "critical";

export interface EligibilityNote {
  tone: NoteTone;
  text: string;
}

export interface EligibilityResult {
  path: CertificationPath;
  /** Set when the member starts with the CAPM but could reach the PMP later. */
  pmpGapMonths: number | null;
  requiredPmpMonths: number;
  countedMonths: number;
  educationHours: number;
  examFee: { member: number; nonMember: number };
  headline: string;
  rationale: string;
  notes: EligibilityNote[];
}

export const RANK_LABELS: Record<RankBand, { label: string; detail: string }> = {
  E1_E4: { label: "E-1 to E-4", detail: "Junior enlisted" },
  E5_E6: { label: "E-5 to E-6", detail: "NCO / Petty Officer" },
  E7_E9: { label: "E-7 to E-9", detail: "Senior enlisted / Chief" },
  W1_W5: { label: "W-1 to W-5", detail: "Warrant officer" },
  O1_O3: { label: "O-1 to O-3", detail: "Company grade / junior officer" },
  O4_PLUS: { label: "O-4 and above", detail: "Field grade and senior officer" },
};

export const EDUCATION_LABELS: Record<EducationLevel, { label: string; detail: string }> = {
  HIGH_SCHOOL: { label: "High school / GED", detail: "Secondary diploma" },
  ASSOCIATE: { label: "Associate degree", detail: "Or some college" },
  BACHELOR: { label: "Bachelor's degree", detail: "Four-year degree" },
  BACHELOR_GAC: { label: "GAC-accredited degree", detail: "PMI GAC-accredited PM program" },
  GRADUATE: { label: "Master's or higher", detail: "Graduate degree" },
};

/** PMI only counts experience inside the last eight years. */
export const EXPERIENCE_WINDOW_MONTHS = 96;

const OFFICER_BANDS: readonly RankBand[] = ["W1_W5", "O1_O3", "O4_PLUS"];

export function requiredPmpMonths(education: EducationLevel): number {
  switch (education) {
    case "HIGH_SCHOOL":
    case "ASSOCIATE":
      return 60;
    case "BACHELOR":
    case "GRADUATE":
      return 36;
    case "BACHELOR_GAC":
      return 24;
  }
}

export function isOfficer(rank: RankBand): boolean {
  return OFFICER_BANDS.includes(rank);
}

function fundingNotes(input: EligibilityInput): EligibilityNote[] {
  const notes: EligibilityNote[] = [
    {
      tone: "critical",
      text: "Do not pay out of pocket or schedule your exam before your COOL / credentialing voucher is approved. Unapproved expenses are not reimbursed.",
    },
  ];
  if (input.branch === "navy" && isOfficer(input.rank)) {
    notes.push({ tone: "warning", text: NAVY_COOL.officerFundingNote });
  }
  return notes;
}

export function assessEligibility(input: EligibilityInput): EligibilityResult {
  const requiredMonths = requiredPmpMonths(input.education);
  const countedMonths = Math.max(0, Math.min(Math.floor(input.leadershipMonths), EXPERIENCE_WINDOW_MONTHS));
  const meetsPmp = countedMonths >= requiredMonths;
  const juniorEnlisted = input.rank === "E1_E4";
  const notes = fundingNotes(input);

  if (meetsPmp && !juniorEnlisted) {
    const borderline = countedMonths < requiredMonths * 1.15;
    if (borderline) {
      notes.unshift({
        tone: "warning",
        text: `You are within a few months of the ${requiredMonths}-month minimum. PMI audits a share of applications, so claim only months a supervisor will verify.`,
      });
    }
    return {
      path: "PMP",
      pmpGapMonths: null,
      requiredPmpMonths: requiredMonths,
      countedMonths,
      educationHours: EDUCATION_HOURS.PMP,
      examFee: EXAM_FEES.PMP,
      headline: "You qualify for the PMP",
      rationale: `PMI requires ${requiredMonths} months of project leadership for your education level, and you reported ${countedMonths}. Next you need 35 contact hours of PM education, then a PMI application your supervisors can verify.`,
      notes,
    };
  }

  if (meetsPmp && juniorEnlisted) {
    notes.unshift({
      tone: "info",
      text: `Your ${countedMonths} months meet PMI's ${requiredMonths}-month bar on paper. At E-1 to E-4 most of that time is usually supporting rather than leading work, so start with the CAPM. Apply for the PMP only if you can name a verifier who will confirm you led each project.`,
    });
  }

  const gap = Math.max(0, requiredMonths - countedMonths);
  return {
    path: "CAPM",
    pmpGapMonths: gap,
    requiredPmpMonths: requiredMonths,
    countedMonths,
    educationHours: EDUCATION_HOURS.CAPM,
    examFee: EXAM_FEES.CAPM,
    headline: "Start with the CAPM",
    rationale:
      gap > 0
        ? `The CAPM needs no project experience, only 23 contact hours of PM education. You are ${gap} months of project leadership away from the PMP, and an active CAPM also covers the PMP's education requirement when you get there.`
        : "The CAPM needs no project experience, only 23 contact hours of PM education. It is the fastest funded credential for your rank, and it also covers the PMP's education requirement later.",
    notes,
  };
}

export const eligibilityInputSchema = z.object({
  branch: z.enum(BRANCHES),
  rank: z.enum(RANK_BANDS),
  education: z.enum(EDUCATION_LEVELS),
  leadershipMonths: z.number().int().min(0).max(600),
});
