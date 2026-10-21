/**
 * CAPM vs. PMP routing.
 *
 * PMI does not look at rank or time in service. It counts months spent leading
 * and directing projects within the 10 years before the application (the
 * window was 8 years until July 2026), plus hours of project management
 * education:
 * - PMP, GAC-accredited degree: 24 months + 35 contact hours
 * - PMP, four-year degree or higher: 36 months + 35 contact hours
 * - PMP, associate degree: 48 months + 35 contact hours
 * - PMP, secondary diploma: 60 months + 35 contact hours
 * - CAPM: secondary diploma + 23 contact hours, no experience
 * An active CAPM satisfies the PMP's 35-hour education requirement.
 *
 * Veterans lose countable months as their service ages out of the window, so
 * the separation month caps what can still count.
 *
 * Product rule layered on top: junior enlisted (E-1 to E-4) are routed to the
 * CAPM first. Their numbers may meet the PMP bar on paper, but most of that
 * time is supporting rather than leading work, which is what PMI audits.
 */

import { z } from "zod";
import { FUNDING_PROGRAMS, FUNDING_WARNING, fundingProgramFor } from "./funding-data";
import { EDUCATION_HOURS, EXAM_FEES, NAVY_COOL, PMP_EXPERIENCE_MONTHS, PMP_EXPERIENCE_WINDOW_YEARS } from "./pmi-facts";
import { BRANCHES, type Branch } from "./translation-schema";

export const RANK_BANDS = ["E1_E4", "E5_E6", "E7_E9", "W1_W5", "O1_O3", "O4_PLUS"] as const;
export type RankBand = (typeof RANK_BANDS)[number];

export const EDUCATION_LEVELS = ["HIGH_SCHOOL", "ASSOCIATE", "BACHELOR", "BACHELOR_GAC", "GRADUATE"] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export interface EligibilityInput {
  branch: Branch;
  rank: RankBand;
  education: EducationLevel;
  /** Months spent leading or directing projects in the last 10 years. */
  leadershipMonths: number;
  /** Month the member left active service (YYYY-MM). Absent or null while still serving. */
  separatedOn?: string | null;
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
  O4_PLUS: { label: "O-4 to O-6+", detail: "Field grade and senior officer" },
};

export const EDUCATION_LABELS: Record<EducationLevel, { label: string; detail: string }> = {
  HIGH_SCHOOL: { label: "High school / GED", detail: "Secondary diploma" },
  ASSOCIATE: { label: "Associate degree", detail: "Two-year degree" },
  BACHELOR: { label: "Bachelor's degree", detail: "Four-year degree" },
  BACHELOR_GAC: { label: "GAC-accredited degree", detail: "PMI GAC-accredited PM program" },
  GRADUATE: { label: "Master's or higher", detail: "Graduate degree" },
};

/** PMI only counts experience inside the last 10 years. */
export const EXPERIENCE_WINDOW_MONTHS = PMP_EXPERIENCE_WINDOW_YEARS * 12;

const OFFICER_BANDS: readonly RankBand[] = ["W1_W5", "O1_O3", "O4_PLUS"];

export function requiredPmpMonths(education: EducationLevel): number {
  switch (education) {
    case "HIGH_SCHOOL":
      return PMP_EXPERIENCE_MONTHS.secondary;
    case "ASSOCIATE":
      return PMP_EXPERIENCE_MONTHS.associate;
    case "BACHELOR":
    case "GRADUATE":
      return PMP_EXPERIENCE_MONTHS.fourYearDegree;
    case "BACHELOR_GAC":
      return PMP_EXPERIENCE_MONTHS.gacDegree;
  }
}

export function isOfficer(rank: RankBand): boolean {
  return OFFICER_BANDS.includes(rank);
}

function fundingNotes(input: EligibilityInput): EligibilityNote[] {
  const notes: EligibilityNote[] = [{ tone: "critical", text: FUNDING_WARNING }];
  const program = FUNDING_PROGRAMS[fundingProgramFor(input.branch)];
  if (program.paymentModel === "reimbursement") {
    notes.push({ tone: "info", text: program.paymentNote });
  }
  if (input.branch === "navy" && isOfficer(input.rank)) {
    notes.push({ tone: "warning", text: NAVY_COOL.officerFundingNote });
  }
  return notes;
}

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

function monthIndex(year: number, monthZeroBased: number): number {
  return year * 12 + monthZeroBased;
}

/** Whole months from `yyyyMm` to `today`, or null when the value is not a YYYY-MM month. */
export function monthsSince(yyyyMm: string, today: Date): number | null {
  const match = MONTH_PATTERN.exec(yyyyMm);
  if (!match) return null;
  return monthIndex(today.getFullYear(), today.getMonth()) - monthIndex(Number(match[1]), Number(match[2]) - 1);
}

function formatMonth(index: number): string {
  const date = new Date(Date.UTC(Math.floor(index / 12), index % 12, 1));
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export interface ServiceWindow {
  /** Separation month, e.g. "June 2019". */
  separated: string;
  /** Months of military service still inside PMI's lookback window. */
  monthsInWindow: number;
  /** First month of service that still counts, e.g. "March 2017". */
  oldestCountedMonth: string;
  /** Last month to apply before the counted months fall below the PMP minimum, if that matters. */
  applyBy: string | null;
  /** Months from today until `applyBy`. */
  monthsUntilApplyBy: number | null;
}

/** Only surface the apply-by date when it is close enough to change behavior. */
const APPLY_BY_HORIZON_MONTHS = 24;

/**
 * For veterans: how much of their service still sits inside the lookback
 * window. Assumes project leadership happened in the final years of service,
 * which is the most generous reading, so the UI says "up to".
 */
export function serviceWindow(separatedOn: string, requiredMonths: number, today: Date): ServiceWindow | null {
  const since = monthsSince(separatedOn, today);
  if (since === null || since < 0) return null;
  const match = MONTH_PATTERN.exec(separatedOn)!;
  const separationIndex = monthIndex(Number(match[1]), Number(match[2]) - 1);
  const todayIndex = monthIndex(today.getFullYear(), today.getMonth());
  const windowStart = todayIndex - EXPERIENCE_WINDOW_MONTHS;
  const monthsInWindow = Math.max(0, EXPERIENCE_WINDOW_MONTHS - since);
  // Counted months drop below the minimum once fewer than `requiredMonths` of service remain in the window.
  const lastGoodMonth = separationIndex + EXPERIENCE_WINDOW_MONTHS - requiredMonths;
  const stillEligible = monthsInWindow >= requiredMonths;
  return {
    separated: formatMonth(separationIndex),
    monthsInWindow,
    oldestCountedMonth: formatMonth(windowStart),
    applyBy: stillEligible ? formatMonth(lastGoodMonth) : null,
    monthsUntilApplyBy: stillEligible ? lastGoodMonth - todayIndex : null,
  };
}

export function assessEligibility(input: EligibilityInput, today: Date = new Date()): EligibilityResult {
  const requiredMonths = requiredPmpMonths(input.education);
  const reported = Math.max(0, Math.floor(input.leadershipMonths));
  const window = input.separatedOn ? serviceWindow(input.separatedOn, requiredMonths, today) : null;
  const ceiling = window ? window.monthsInWindow : EXPERIENCE_WINDOW_MONTHS;
  const countedMonths = Math.min(reported, ceiling);
  const meetsPmp = countedMonths >= requiredMonths;
  const juniorEnlisted = input.rank === "E1_E4";
  const notes = fundingNotes(input);

  if (window && reported > window.monthsInWindow) {
    notes.unshift({
      tone: "warning",
      text: `PMI only counts the last ${PMP_EXPERIENCE_WINDOW_YEARS} years. You left active service in ${window.separated}, so at most ${window.monthsInWindow} months of your service still count. Projects you led before ${window.oldestCountedMonth} no longer count.`,
    });
  }
  const deadlineSoon = window?.monthsUntilApplyBy != null && window.monthsUntilApplyBy <= APPLY_BY_HORIZON_MONTHS;
  if (window?.applyBy && deadlineSoon && meetsPmp && !juniorEnlisted) {
    notes.unshift({
      tone: "warning",
      text: `Apply by ${window.applyBy}. After that, fewer than ${requiredMonths} months of your service fall inside PMI's ${PMP_EXPERIENCE_WINDOW_YEARS}-year window, unless you add civilian project experience.`,
    });
  }

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
      headline: "You may be ready to apply for the PMP",
      rationale: `This is a preliminary screen, not a PMI decision. PMI requires ${requiredMonths} months of project leadership for your education level, and you reported ${countedMonths} that fall inside the window. Before you spend money, document each project (dates, objective, your role, deliverables, a verifier) and confirm the current rules on pmi.org. Then you need 35 contact hours of PM education and a PMI application your supervisors can verify.`,
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
  separatedOn: z.string().regex(MONTH_PATTERN, "Use YYYY-MM.").nullable().optional(),
});
