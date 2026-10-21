/**
 * CAPM vs. PMP eligibility estimator.
 *
 * PMI does not look at rank or time in service. It counts months spent leading
 * and directing projects within the last eight years, plus hours of project
 * management education. Rank and time in service are only a proxy for that, so
 * the estimate below is deliberately conservative: it uses the low end of each
 * time-in-service band and a rank-based share of that time as "leading" months.
 *
 * Thresholds (PMI PMP / CAPM requirements):
 * - PMP, four-year degree: 36 months leading projects in the last 8 years + 35 contact hours
 * - PMP, GAC-accredited bachelor's or master's: 24 months + 35 contact hours
 * - PMP, high school diploma or associate's degree: 60 months + 35 contact hours
 * - CAPM: secondary diploma + 23 contact hours of project management education
 * An active CAPM satisfies the PMP's 35-hour education requirement.
 */

export const RANK_BANDS = ["E1_E3", "E4", "E5", "E6", "E7_E9", "W1_W5", "O1_O2", "O3_PLUS"] as const;
export type RankBand = (typeof RANK_BANDS)[number];

export const SERVICE_BANDS = ["LT_2", "2_4", "4_6", "6_10", "10_PLUS"] as const;
export type ServiceBand = (typeof SERVICE_BANDS)[number];

export const EDUCATION_LEVELS = ["HIGH_SCHOOL", "ASSOCIATE", "BACHELOR", "BACHELOR_GAC", "GRADUATE"] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export interface EligibilityInput {
  rank: RankBand;
  service: ServiceBand;
  education: EducationLevel;
}

export type Recommendation = "PMP" | "CAPM_THEN_PMP" | "CAPM";
export type Confidence = "strong" | "borderline" | "not_yet";

export interface EligibilityResult {
  recommendation: Recommendation;
  confidence: Confidence;
  requiredMonths: number;
  estimatedLeadershipMonths: number;
  gapMonths: number;
  educationHoursRequired: number;
  headline: string;
  rationale: string;
  nextSteps: string[];
}

export const RANK_LABELS: Record<RankBand, { label: string; detail: string }> = {
  E1_E3: { label: "E-1 to E-3", detail: "Junior enlisted" },
  E4: { label: "E-4", detail: "Specialist / Corporal / PO3 / SrA" },
  E5: { label: "E-5", detail: "Sergeant / PO2 / SSgt" },
  E6: { label: "E-6", detail: "Staff Sergeant / PO1 / TSgt" },
  E7_E9: { label: "E-7 to E-9", detail: "Senior NCO / Chief" },
  W1_W5: { label: "W-1 to W-5", detail: "Warrant officer" },
  O1_O2: { label: "O-1 to O-2", detail: "Junior officer" },
  O3_PLUS: { label: "O-3 and above", detail: "Company grade and up" },
};

export const SERVICE_LABELS: Record<ServiceBand, string> = {
  LT_2: "Less than 2 years",
  "2_4": "2 to 4 years",
  "4_6": "4 to 6 years",
  "6_10": "6 to 10 years",
  "10_PLUS": "10+ years",
};

export const EDUCATION_LABELS: Record<EducationLevel, { label: string; detail: string }> = {
  HIGH_SCHOOL: { label: "High school / GED", detail: "Secondary diploma" },
  ASSOCIATE: { label: "Associate degree", detail: "Or some college" },
  BACHELOR: { label: "Bachelor's degree", detail: "Four-year degree" },
  BACHELOR_GAC: {
    label: "Bachelor's (GAC-accredited)",
    detail: "PMI GAC-accredited PM program",
  },
  GRADUATE: { label: "Master's or higher", detail: "Graduate degree" },
};

/** Low end of each band, in months. Conservative on purpose. */
const SERVICE_FLOOR_MONTHS: Record<ServiceBand, number> = {
  LT_2: 0,
  "2_4": 24,
  "4_6": 48,
  "6_10": 72,
  "10_PLUS": 120,
};

/**
 * Share of service time that typically involves leading or directing work
 * (planning a task, running a work center, owning a deliverable).
 */
const LEADERSHIP_SHARE: Record<RankBand, number> = {
  E1_E3: 0,
  E4: 0.25,
  E5: 0.5,
  E6: 0.7,
  E7_E9: 0.8,
  W1_W5: 0.8,
  O1_O2: 0.7,
  O3_PLUS: 0.8,
};

/** PMI only counts experience inside the last eight years. */
export const EXPERIENCE_WINDOW_MONTHS = 96;

export function requiredPmpMonths(education: EducationLevel): number {
  switch (education) {
    case "HIGH_SCHOOL":
    case "ASSOCIATE":
      return 60;
    case "BACHELOR":
      return 36;
    // PMI's 24-month path applies to GAC-accredited degrees (bachelor's or
    // post-graduate). A general master's still requires 36 months.
    case "BACHELOR_GAC":
      return 24;
    case "GRADUATE":
      return 36;
  }
}

export function estimateLeadershipMonths(rank: RankBand, service: ServiceBand): number {
  const months = SERVICE_FLOOR_MONTHS[service] * LEADERSHIP_SHARE[rank];
  return Math.min(Math.floor(months), EXPERIENCE_WINDOW_MONTHS);
}

/** Gap under which we recommend CAPM now with a dated PMP target. */
const CAPM_BRIDGE_MAX_GAP_MONTHS = 24;

export function assessEligibility(input: EligibilityInput): EligibilityResult {
  const requiredMonths = requiredPmpMonths(input.education);
  const estimatedLeadershipMonths = estimateLeadershipMonths(input.rank, input.service);
  const gapMonths = Math.max(0, requiredMonths - estimatedLeadershipMonths);

  if (gapMonths === 0) {
    const strong = estimatedLeadershipMonths >= requiredMonths * 1.25;
    return {
      recommendation: "PMP",
      confidence: strong ? "strong" : "borderline",
      requiredMonths,
      estimatedLeadershipMonths,
      gapMonths,
      educationHoursRequired: 35,
      headline: strong ? "Go straight for the PMP" : "PMP is within reach, document carefully",
      rationale: strong
        ? `Your profile suggests roughly ${estimatedLeadershipMonths} months of project leadership against PMI's ${requiredMonths}-month requirement. You have margin for an audit.`
        : `Your estimated ${estimatedLeadershipMonths} months only just clears the ${requiredMonths}-month bar. Every month you claim must be verifiable by a supervisor, so list projects conservatively.`,
      nextSteps: [
        "Inventory every project you led in the last 8 years with dates and a supervisor who can verify it.",
        "Complete 35 contact hours of PM education (or hold an active CAPM).",
        "Translate each project in the Translation Studio and keep audit scores at 80+.",
        "Request a COOL voucher before you submit the PMI application, since funding approval takes time.",
      ],
    };
  }

  if (gapMonths <= CAPM_BRIDGE_MAX_GAP_MONTHS && estimatedLeadershipMonths > 0) {
    return {
      recommendation: "CAPM_THEN_PMP",
      confidence: "borderline",
      requiredMonths,
      estimatedLeadershipMonths,
      gapMonths,
      educationHoursRequired: 23,
      headline: `CAPM now, PMP in about ${gapMonths} months`,
      rationale: `You are an estimated ${gapMonths} months short of the ${requiredMonths}-month PMP requirement. Earning the CAPM now gets you a funded credential today, and it also satisfies the PMP's 35-hour education requirement later.`,
      nextSteps: [
        "Complete 23 contact hours of PM education to qualify for the CAPM.",
        "Request a COOL voucher for the CAPM exam.",
        "Start logging projects now: objective, your role, deliverables, outcome, and a verifier.",
        `Volunteer to lead tasks and working groups so that your remaining ${gapMonths} months count.`,
      ],
    };
  }

  return {
    recommendation: "CAPM",
    confidence: "not_yet",
    requiredMonths,
    estimatedLeadershipMonths,
    gapMonths,
    educationHoursRequired: 23,
    headline: "Start with the CAPM",
    rationale:
      estimatedLeadershipMonths === 0
        ? "PMI counts months spent leading projects, not time in service. At this stage the CAPM is the credential you can actually earn, and it needs no project experience."
        : `PMI counts months spent leading projects, not time in service. Your estimated ${estimatedLeadershipMonths} months is well short of ${requiredMonths}, so the CAPM is the honest, fundable first step.`,
    nextSteps: [
      "Complete 23 contact hours of PM education.",
      "Request a COOL voucher for the CAPM exam.",
      "Build your Leitner flashcard streak around the CAPM and PMP fundamentals.",
      "Ask your chain of command for ownership of a small project, and log it from day one.",
    ],
  };
}
