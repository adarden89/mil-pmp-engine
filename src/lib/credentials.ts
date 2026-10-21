/**
 * Credential and pathway reference data for the decision engine and the
 * comparison page.
 *
 * Every fact carries its source and a review date, and says whether the source
 * is the credential owner (official) or a secondary summary (training
 * providers, reviews). Secondary facts are shown with a "confirm before you
 * rely on it" label. Re-review everything before each release and bump
 * CREDENTIALS_REVIEWED_ON.
 */

import { EDUCATION_HOURS, EXAM_FEES, PMP_EXPERIENCE_MONTHS, PMP_EXPERIENCE_WINDOW_YEARS } from "./pmi-facts";

export const CREDENTIALS_REVIEWED_ON = "2026-10-21";

export type SourceKind = "official" | "secondary";

export interface SourcedFact {
  text: string;
  source: { label: string; url: string; kind: SourceKind };
  reviewedOn: string;
}

export const PATHWAY_IDS = ["fundamentals", "capm", "pmp", "psm1", "csm", "direct_employment"] as const;
export type PathwayId = (typeof PATHWAY_IDS)[number];

export interface CostLine {
  label: string;
  /** Dollars. A range when the price depends on the provider. */
  amount: number | { min: number; max: number };
  note?: string;
}

export interface PathwayInfo {
  id: PathwayId;
  name: string;
  shortName: string;
  issuer: string | null;
  /** One plain-English sentence for someone who has never heard of it. */
  plainEnglish: string;
  bestFor: string[];
  notFor: string[];
  prerequisites: string[];
  costs: CostLine[];
  timeToComplete: string;
  renewal: string;
  officialUrl: string | null;
  facts: SourcedFact[];
}

const PMI = {
  label: "PMI",
  url: "https://www.pmi.org/certifications/project-management-pmp",
  kind: "official",
} as const;
const PMI_CAPM = {
  label: "PMI",
  url: "https://www.pmi.org/certifications/certified-associate-capm",
  kind: "official",
} as const;
const PMI_ECO = {
  label: "PMI 2026 PMP Examination Content Outline",
  url: "https://www.pmi.org/-/media/pmi/documents/public/pdf/certifications/new-pmp-examination-content-outline-2026.pdf",
  kind: "official",
} as const;
const SECONDARY_PMI = {
  label: "Training-provider summaries of PMI's 2026 rules",
  url: "https://www.pmi.org/certifications/project-management-pmp",
  kind: "secondary",
} as const;
const SCRUM_ALLIANCE_COURSE = {
  label: "Scrum Alliance support",
  url: "https://support.scrumalliance.org/hc/en-us/articles/210313803-Is-the-Certified-ScrumMaster-CSM-course-required-before-taking-the-test",
  kind: "official",
} as const;
const SCRUM_ALLIANCE_RENEWAL = {
  label: "Scrum Alliance support",
  url: "https://support.scrumalliance.org/hc/en-us/articles/50926906482843-What-is-the-cost-to-renew-a-certification",
  kind: "official",
} as const;
const SCRUM_ORG_STORE = {
  label: "Scrum.org store",
  url: "https://store.scrum.org/products/professional-scrum-master-i-assessment",
  kind: "official",
} as const;
const GOOGLE_PM = {
  label: "Google Career Certificates",
  url: "https://grow.google/certificates/project-management/",
  kind: "official",
} as const;

function fact(text: string, source: SourcedFact["source"]): SourcedFact {
  return { text, source, reviewedOn: CREDENTIALS_REVIEWED_ON };
}

export const PATHWAYS: Record<PathwayId, PathwayInfo> = {
  fundamentals: {
    id: "fundamentals",
    name: "Project management fundamentals training",
    shortName: "Fundamentals",
    issuer: null,
    plainEnglish:
      "A course that teaches how projects are planned, run, and finished, so the words in job postings and exams make sense before you pay for a credential.",
    bestFor: [
      "People new to project management who want the vocabulary first",
      "Anyone planning the CAPM, which needs 23 hours of project management education",
    ],
    notFor: ["Someone who already holds the PMP education hours and documented project experience"],
    prerequisites: ["None"],
    costs: [
      {
        label: "Google Project Management Certificate on Coursera",
        amount: 49,
        note: "Per month after a 7-day trial; financial aid available",
      },
      { label: "Onward to Opportunity (O2O)", amount: 0, note: "Free for eligible transitioning service members" },
    ],
    timeToComplete: "About 3 months at 20 hours a week, or 6 months at 10 hours a week (Google's estimate)",
    renewal: "None",
    officialUrl: GOOGLE_PM.url,
    facts: [
      fact("Google lists the certificate at US$49 per month on Coursera after a 7-day free trial.", GOOGLE_PM),
      fact(
        "Google says completing the certificate provides over 100 hours of project management education that applies to PMI credentials such as the CAPM.",
        GOOGLE_PM,
      ),
    ],
  },
  capm: {
    id: "capm",
    name: "Certified Associate in Project Management",
    shortName: "CAPM",
    issuer: "Project Management Institute (PMI)",
    plainEnglish:
      "PMI's entry-level credential. It shows you know project management terms and methods; it does not require project experience.",
    bestFor: [
      "People without documented project-leading experience who want a recognized PM credential",
      "Project coordinator and junior project roles",
      "A step toward the PMP: an active CAPM covers the PMP's 35-hour education requirement",
    ],
    notFor: ["Someone who already meets the PMP requirements and wants a senior PM role"],
    prerequisites: [
      "Secondary diploma (high school or equivalent)",
      `${EDUCATION_HOURS.CAPM} contact hours of project management education before the exam`,
    ],
    costs: [{ label: "Exam fee", amount: EXAM_FEES.CAPM.nonMember, note: `$${EXAM_FEES.CAPM.member} for PMI members` }],
    timeToComplete: "Commonly 1 to 3 months of study",
    renewal: "15 professional development units (PDUs) every 3 years",
    officialUrl: PMI_CAPM.url,
    facts: [
      fact(
        `PMI lists a secondary diploma and ${EDUCATION_HOURS.CAPM} hours of project management education as CAPM requirements.`,
        PMI_CAPM,
      ),
      fact(
        `Exam fee $${EXAM_FEES.CAPM.member} for PMI members, $${EXAM_FEES.CAPM.nonMember} for non-members.`,
        SECONDARY_PMI,
      ),
      fact("Renewal: 15 PDUs every 3 years.", SECONDARY_PMI),
    ],
  },
  pmp: {
    id: "pmp",
    name: "Project Management Professional",
    shortName: "PMP",
    issuer: "Project Management Institute (PMI)",
    plainEnglish:
      "PMI's experienced-practitioner credential. It requires documented months spent leading projects, not just time in service or a leadership title.",
    bestFor: ["People who have led defined projects and can document dates, scope, and a verifier for each"],
    notFor: [
      "Anyone who cannot yet document the required months of project leadership",
      "Roles whose postings do not ask for it",
    ],
    prerequisites: [
      `${PMP_EXPERIENCE_MONTHS.secondary} months leading projects with a secondary diploma, ${PMP_EXPERIENCE_MONTHS.associate} with an associate degree, ${PMP_EXPERIENCE_MONTHS.fourYearDegree} with a four-year degree, or ${PMP_EXPERIENCE_MONTHS.gacDegree} with a GAC-accredited degree, all within the last ${PMP_EXPERIENCE_WINDOW_YEARS} years`,
      `${EDUCATION_HOURS.PMP} contact hours of project management education, or an active CAPM`,
      "Experience a supervisor can verify if PMI audits the application",
    ],
    costs: [
      { label: "Exam fee", amount: EXAM_FEES.PMP.nonMember, note: `$${EXAM_FEES.PMP.member} for PMI members` },
      {
        label: "35-hour course",
        amount: { min: 20, max: 2000 },
        note: "Self-paced courses cost far less than live bootcamps",
      },
    ],
    timeToComplete: "Commonly 2 to 4 months of study after the application is approved",
    renewal: "60 PDUs every 3 years",
    officialUrl: PMI.url,
    facts: [
      fact("The exam launched in July 2026 weights People 33%, Process 41%, and Business Environment 26%.", PMI_ECO),
      fact(
        `Experience tiers (60 / 48 / 36 / 24 months by education) and the ${PMP_EXPERIENCE_WINDOW_YEARS}-year window come from summaries of PMI's July 2026 rules.`,
        SECONDARY_PMI,
      ),
      fact(
        "From December 1, 2026, live instructor-led training hours reportedly count only from PMI Authorized Training Partners or accredited academic programs; self-paced courses are unaffected.",
        SECONDARY_PMI,
      ),
      fact(
        `Exam fee $${EXAM_FEES.PMP.member} for PMI members, $${EXAM_FEES.PMP.nonMember} for non-members. Renewal: 60 PDUs every 3 years.`,
        SECONDARY_PMI,
      ),
    ],
  },
  psm1: {
    id: "psm1",
    name: "Professional Scrum Master I",
    shortName: "PSM I",
    issuer: "Scrum.org",
    plainEnglish:
      "A Scrum credential earned by passing one online assessment. It shows you understand how Scrum teams plan and deliver work in short cycles.",
    bestFor: ["Self-studiers targeting Scrum Master or agile team roles who want the lowest cost"],
    notFor: ["Roles that are not agile or software-adjacent; many PM jobs never mention Scrum"],
    prerequisites: ["None; a course is optional"],
    costs: [{ label: "Assessment (one attempt)", amount: 200 }],
    timeToComplete: "Commonly 2 to 6 weeks of self-study",
    renewal: "No renewal fee reported (lifetime credential)",
    officialUrl: SCRUM_ORG_STORE.url,
    facts: [
      fact("Scrum.org lists the PSM I assessment at $200 for one attempt.", SCRUM_ORG_STORE),
      fact("No course is required, and the credential does not expire.", {
        label: "Secondary summaries",
        url: SCRUM_ORG_STORE.url,
        kind: "secondary",
      }),
    ],
  },
  csm: {
    id: "csm",
    name: "Certified ScrumMaster",
    shortName: "CSM",
    issuer: "Scrum Alliance",
    plainEnglish:
      "A Scrum credential that starts with a live two-day course from a certified trainer, followed by a short online test.",
    bestFor: ["People who learn best in a live class and target Scrum Master or agile team roles"],
    notFor: ["Anyone paying out of pocket who would do as well with self-study (see PSM I)"],
    prerequisites: ["A 16-hour live course taught by a Certified Scrum Trainer, before the test"],
    costs: [
      {
        label: "Course (exam and first two-year membership included)",
        amount: { min: 350, max: 1400 },
        note: "Varies by trainer and format",
      },
      { label: "Renewal every 2 years", amount: 100 },
    ],
    timeToComplete: "2-day course, then the online test",
    renewal: "Every 2 years: $100 and 20 Scrum Education Units",
    officialUrl: SCRUM_ALLIANCE_COURSE.url,
    facts: [
      fact(
        "Scrum Alliance requires the CSM course, taught by a Certified Scrum Trainer, before the test.",
        SCRUM_ALLIANCE_COURSE,
      ),
      fact("Renewing a foundational certification such as the CSM costs $100.", SCRUM_ALLIANCE_RENEWAL),
      fact("Course prices commonly range from about $350 to $1,400 and include the exam.", {
        label: "Secondary summaries",
        url: SCRUM_ALLIANCE_COURSE.url,
        kind: "secondary",
      }),
    ],
  },
  direct_employment: {
    id: "direct_employment",
    name: "Apply for civilian roles now, credential later",
    shortName: "Job search first",
    issuer: null,
    plainEnglish:
      "Many operations, logistics, and coordinator roles hire on documented experience. A credential can come later if the jobs you want ask for it.",
    bestFor: [
      "People separating soon who need income more than a credential",
      "Target roles whose postings do not require a PM credential",
    ],
    notFor: ["Roles where the posting lists the PMP or CAPM as required"],
    prerequisites: ["A civilian resume backed by examples you can explain in an interview"],
    costs: [{ label: "Direct cost", amount: 0 }],
    timeToComplete: "Start now",
    renewal: "None",
    officialUrl: null,
    facts: [],
  },
};

export function formatCost(amount: CostLine["amount"]): string {
  if (typeof amount === "number") return amount === 0 ? "Free" : `$${amount.toLocaleString("en-US")}`;
  return `$${amount.min.toLocaleString("en-US")} to $${amount.max.toLocaleString("en-US")}`;
}
