/**
 * Credential decision engine.
 *
 * Compares six routes (fundamentals training, CAPM, PMP, PSM I, CSM, and job
 * search first) against what the member told us: goal, how they describe
 * their experience, documented project-leadership months, education, timeline,
 * how they expect to pay, and target roles.
 *
 * Deliberately rules-based and explainable: every fit comes with the reasons
 * that produced it, there is no percentage score, and the output is a
 * preliminary recommendation, never an eligibility, funding, or hiring
 * decision. Unknowns ("not sure") push toward documenting evidence, not toward
 * buying something.
 */

import { z } from "zod";
import { PATHWAY_IDS, PATHWAYS, type PathwayId } from "./credentials";
import {
  EDUCATION_LEVELS,
  EXPERIENCE_WINDOW_MONTHS,
  requiredPmpMonths,
  serviceWindow,
  type EducationLevel,
} from "./eligibility";
import { PMP_LIVE_TRAINING_RULE } from "./pmi-facts";

export const GOALS = ["understand", "pmp", "agile", "job", "not_sure"] as const;
export type Goal = (typeof GOALS)[number];

export const FAMILIARITY = ["new", "coordinated", "led"] as const;
export type Familiarity = (typeof FAMILIARITY)[number];

export const TIMELINES = ["0-3", "3-6", "6-12", "12+"] as const;
export type Timeline = (typeof TIMELINES)[number];

export const FUNDING_PLANS = ["service_funding", "self_pay", "unknown"] as const;
export type FundingPlan = (typeof FUNDING_PLANS)[number];

export const TARGET_ROLES = [
  "project_coordinator",
  "project_manager",
  "operations",
  "agile_scrum",
  "logistics_supply",
  "safety_compliance",
  "not_sure",
] as const;
export type TargetRole = (typeof TARGET_ROLES)[number];

export const GOAL_LABELS: Record<Goal, { label: string; detail: string }> = {
  understand: {
    label: "Understand the field first",
    detail: "Learn what project managers do before choosing anything.",
  },
  pmp: { label: "Work toward the PMP", detail: "Check whether my documented experience could qualify." },
  agile: { label: "Learn Scrum / Agile", detail: "Explore how teams deliver work in short cycles." },
  job: { label: "Get a civilian job", detail: "Find realistic roles and close the gaps." },
  not_sure: { label: "Not sure yet", detail: "Help me figure out what makes sense." },
};

export const FAMILIARITY_LABELS: Record<Familiarity, { label: string; detail: string }> = {
  new: { label: "I'm new to this", detail: "I haven't studied project management." },
  coordinated: { label: "I've coordinated work", detail: "I helped plan, track, or deliver efforts someone else led." },
  led: { label: "I've led defined efforts", detail: "I was accountable for planning and delivering them." },
};

export const TIMELINE_LABELS: Record<Timeline, string> = {
  "0-3": "Within 3 months",
  "3-6": "3 to 6 months",
  "6-12": "6 to 12 months",
  "12+": "More than a year",
};

export const FUNDING_LABELS: Record<FundingPlan, { label: string; detail: string }> = {
  service_funding: { label: "Service funding", detail: "COOL or credentialing assistance, if approved" },
  self_pay: { label: "Paying myself", detail: "Cost matters" },
  unknown: { label: "Not sure", detail: "I don't know what's available" },
};

export const TARGET_ROLE_LABELS: Record<TargetRole, string> = {
  project_coordinator: "Project coordinator",
  project_manager: "Project manager",
  operations: "Operations",
  agile_scrum: "Scrum / agile team",
  logistics_supply: "Logistics / supply chain",
  safety_compliance: "Safety / compliance",
  not_sure: "Not sure yet",
};

export const pathwayInputSchema = z.object({
  goal: z.enum(GOALS),
  familiarity: z.enum(FAMILIARITY),
  education: z.enum(EDUCATION_LEVELS),
  /** Months of project leadership the member can document; null means "not sure yet". */
  documentedProjectMonths: z.number().int().min(0).max(600).nullable(),
  timeline: z.enum(TIMELINES),
  funding: z.enum(FUNDING_PLANS),
  targetRoles: z.array(z.enum(TARGET_ROLES)).max(TARGET_ROLES.length),
  separatedOn: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .nullable()
    .optional(),
});
export type PathwayInput = z.infer<typeof pathwayInputSchema>;

/** Ordered from strongest to weakest. */
export const FITS = ["recommended", "consider", "not_yet", "skip_for_now"] as const;
export type Fit = (typeof FITS)[number];

export const FIT_LABELS: Record<Fit, string> = {
  recommended: "Recommended",
  consider: "Worth considering",
  not_yet: "Not yet",
  skip_for_now: "Skip for now",
};

export interface PathwayAssessment {
  id: PathwayId;
  fit: Fit;
  /** Plain sentences, each tied to something the member told us. */
  reasons: string[];
  /** What to confirm on official sites before spending money. */
  verify: string[];
}

export interface NextAction {
  title: string;
  detail: string;
  href: string;
  minutes: number;
}

export interface PathwayPlan {
  primary: PathwayId;
  headline: string;
  summary: string;
  assessments: PathwayAssessment[];
  nextAction: NextAction;
  avoidSpending: string[];
  pmpReadiness: { requiredMonths: number; countedMonths: number | null; gapMonths: number | null };
  caveat: string;
}

export const PATHWAY_CAVEAT =
  "This is a preliminary, rules-based recommendation built only from your answers. It is not a PMI eligibility decision, a funding approval, or a prediction that you will be hired.";

interface Facts {
  input: PathwayInput;
  requiredMonths: number;
  countedMonths: number | null;
  pmpReady: boolean;
  wantsPm: boolean;
  wantsAgile: boolean;
  separatingSoon: boolean;
}

function deriveFacts(input: PathwayInput, today: Date): Facts {
  const requiredMonths = requiredPmpMonths(input.education);
  let countedMonths: number | null = null;
  if (input.documentedProjectMonths !== null) {
    const window = input.separatedOn ? serviceWindow(input.separatedOn, requiredMonths, today) : null;
    countedMonths = Math.min(input.documentedProjectMonths, window ? window.monthsInWindow : EXPERIENCE_WINDOW_MONTHS);
  }
  return {
    input,
    requiredMonths,
    countedMonths,
    pmpReady: countedMonths !== null && countedMonths >= requiredMonths,
    wantsPm: input.goal === "pmp" || input.targetRoles.includes("project_manager"),
    wantsAgile: input.goal === "agile" || input.targetRoles.includes("agile_scrum"),
    separatingSoon: input.timeline === "0-3",
  };
}

function assessFundamentals(f: Facts): PathwayAssessment {
  const { input } = f;
  const verify = ["Confirm the course states how many project management education hours it provides."];
  if (input.familiarity === "new" || input.goal === "understand" || input.goal === "not_sure") {
    return {
      id: "fundamentals",
      fit: "recommended",
      reasons: [
        input.familiarity === "new"
          ? "You said you are new to project management, so the vocabulary comes first."
          : "You want to understand the field before committing to a credential.",
        "A fundamentals course also provides the 23 hours of PM education the CAPM requires.",
      ],
      verify,
    };
  }
  if (f.pmpReady && input.familiarity === "led") {
    return {
      id: "fundamentals",
      fit: "skip_for_now",
      reasons: ["You have led projects and report enough documented months; go straight to PMP preparation."],
      verify: [],
    };
  }
  return {
    id: "fundamentals",
    fit: "consider",
    reasons: ["Useful if terms like scope, schedule baseline, or stakeholder register are still unfamiliar."],
    verify,
  };
}

function assessCapm(f: Facts): PathwayAssessment {
  const { input } = f;
  const verify = [
    "Check the CAPM requirements and exam fee on pmi.org.",
    "Ask your education office whether COOL can fund the exam.",
  ];
  if (f.pmpReady && f.wantsPm) {
    return {
      id: "capm",
      fit: "skip_for_now",
      reasons: ["Your documented months may already meet the PMP bar, so the CAPM would likely duplicate it."],
      verify: [],
    };
  }
  if (input.goal === "pmp") {
    return {
      id: "capm",
      fit: "recommended",
      reasons: [
        f.countedMonths === null
          ? "You are not sure yet how many months of project leadership you can document."
          : `You can document ${f.countedMonths} of the ${f.requiredMonths} months the PMP requires with your education.`,
        "The CAPM needs no project experience, and an active CAPM later covers the PMP's 35-hour education requirement.",
      ],
      verify,
    };
  }
  if (input.targetRoles.includes("project_coordinator")) {
    return {
      id: "capm",
      fit: "recommended",
      reasons: [
        "You are targeting project coordinator roles, where an entry-level PM credential can help you stand out.",
      ],
      verify,
    };
  }
  if (f.wantsAgile && !f.wantsPm) {
    return {
      id: "capm",
      fit: "skip_for_now",
      reasons: ["Your goal is Scrum / agile work, where a Scrum credential is the more direct signal."],
      verify: [],
    };
  }
  return {
    id: "capm",
    fit: "consider",
    reasons: ["A recognized entry-level credential, worth it if the postings you want mention it."],
    verify,
  };
}

function assessPmp(f: Facts): PathwayAssessment {
  const { input } = f;
  const verify = [
    "Confirm the current experience and education requirements on pmi.org.",
    "Make sure each project has dates, an objective, your role, deliverables, and a verifier.",
    PMP_LIVE_TRAINING_RULE.summary,
  ];
  if (!f.wantsPm) {
    return {
      id: "pmp",
      fit: f.pmpReady ? "consider" : "skip_for_now",
      reasons: [
        f.pmpReady
          ? "Your documented months may meet the PMP bar, but your goals and target roles do not call for it right now."
          : "Your goals and target roles do not call for the PMP right now.",
      ],
      verify: f.pmpReady ? verify : [],
    };
  }
  if (f.countedMonths === null) {
    return {
      id: "pmp",
      fit: "not_yet",
      reasons: [
        "You are not sure how many months of project leadership you can document. Document them first: PMI counts months leading defined projects, not time in service.",
      ],
      verify,
    };
  }
  if (!f.pmpReady) {
    return {
      id: "pmp",
      fit: "not_yet",
      reasons: [
        `PMI asks for ${f.requiredMonths} months of project leadership with your education; you can document ${f.countedMonths}, a gap of ${f.requiredMonths - f.countedMonths} months.`,
      ],
      verify,
    };
  }
  if (input.familiarity !== "led") {
    return {
      id: "pmp",
      fit: "consider",
      reasons: [
        `Your ${f.countedMonths} documented months meet the ${f.requiredMonths}-month bar, but you described your role as coordinating rather than leading. PMI counts months spent leading and directing project work.`,
      ],
      verify,
    };
  }
  return {
    id: "pmp",
    fit: "recommended",
    reasons: [
      `You report ${f.countedMonths} documented months of project leadership; PMI asks for ${f.requiredMonths} with your education.`,
      "You described yourself as having led defined efforts, which is what PMI counts.",
    ],
    verify,
  };
}

function assessScrum(f: Facts, id: "psm1" | "csm"): PathwayAssessment {
  const { input } = f;
  if (!f.wantsAgile) {
    return {
      id,
      fit: "skip_for_now",
      reasons: [
        "None of your goals or target roles call for Scrum. Many project management postings never mention it.",
      ],
      verify: [],
    };
  }
  const prefersFundedClass = input.funding === "service_funding";
  const recommended = id === "csm" ? prefersFundedClass : !prefersFundedClass;
  const reasons =
    id === "psm1"
      ? [
          "One $200 online assessment, no required course, and no renewal fee.",
          prefersFundedClass
            ? "A good fallback if your service's program will not fund a CSM course."
            : "The lowest-cost Scrum credential when you are paying yourself.",
        ]
      : [
          "Starts with a live two-day course from a certified trainer, then a short test.",
          prefersFundedClass
            ? "You plan to use service funding, which can make the higher course price reasonable if it is approved."
            : "Costs several times more than the PSM I and renews every two years.",
        ];
  return {
    id,
    fit: recommended ? "recommended" : "consider",
    reasons,
    verify:
      id === "csm"
        ? [
            "Confirm your service's COOL program lists and funds the CSM before you enroll.",
            "Compare course prices; the exam is included.",
          ]
        : ["Check the current assessment price on Scrum.org."],
  };
}

function assessDirectEmployment(f: Facts): PathwayAssessment {
  const { input } = f;
  const reasons: string[] = [];
  if (input.goal === "job")
    reasons.push("Your first goal is a civilian job, and many roles hire on documented experience.");
  if (f.separatingSoon)
    reasons.push("You want progress within 3 months; credentials take months, so start applications in parallel.");
  if (reasons.length > 0) {
    return {
      id: "direct_employment",
      fit: "recommended",
      reasons,
      verify: ["Read 10 real postings in your target location and note which credentials they actually require."],
    };
  }
  return {
    id: "direct_employment",
    fit: "consider",
    reasons: ["Worth doing alongside any credential: a resume backed by real examples helps on every path."],
    verify: ["Read 10 real postings in your target location and note which credentials they actually require."],
  };
}

const NEXT_ACTIONS: Record<PathwayId, NextAction> = {
  fundamentals: {
    title: "Learn what a project manager actually does",
    detail: "A 10-minute plain-English walkthrough with military examples, before you pick a course.",
    href: "/start#learn",
    minutes: 10,
  },
  capm: {
    title: "Compare CAPM prep options",
    detail: "See prerequisites, total cost, and renewal side by side, then check funding before you pay.",
    href: "/credentials#capm",
    minutes: 15,
  },
  pmp: {
    title: "Document your first project",
    detail: "Add one project with dates, objective, your role, deliverables, and who can verify it.",
    href: "/dashboard/evidence",
    minutes: 15,
  },
  psm1: {
    title: "Read the free Scrum Guide",
    detail: "The PSM I assessment is based on it. About 15 pages.",
    href: "https://scrumguides.org/",
    minutes: 30,
  },
  csm: {
    title: "Check whether your service funds the CSM",
    detail: "Confirm funding with your education office before enrolling in a course.",
    href: "/funding",
    minutes: 15,
  },
  direct_employment: {
    title: "Turn one duty into resume bullets",
    detail: "Describe one effort you coordinated; we show the transferable skills and the facts you still need.",
    href: "/dashboard/resume",
    minutes: 15,
  },
};

function choosePrimary(f: Facts, assessments: PathwayAssessment[]): PathwayId {
  const recommended = new Set(assessments.filter((a) => a.fit === "recommended").map((a) => a.id));
  const preference: PathwayId[] = (() => {
    switch (f.input.goal) {
      case "job":
        return ["direct_employment", "capm", "pmp", "fundamentals", "psm1", "csm"];
      case "pmp":
        return ["pmp", "capm", "fundamentals", "direct_employment", "psm1", "csm"];
      case "agile":
        return ["psm1", "csm", "fundamentals", "direct_employment", "capm", "pmp"];
      default:
        return ["fundamentals", "capm", "direct_employment", "pmp", "psm1", "csm"];
    }
  })();
  if (f.separatingSoon && recommended.has("direct_employment")) return "direct_employment";
  return preference.find((id) => recommended.has(id)) ?? preference[0];
}

function avoidSpending(f: Facts): string[] {
  const items: string[] = [];
  if (!f.pmpReady) {
    items.push("A PMP bootcamp or exam prep before you have documented the required months of project leadership.");
  }
  items.push("Exam fees or exam scheduling before your service's funding is approved, if you plan to use it.");
  if (!f.wantsAgile) items.push("Scrum courses, unless the job postings you want ask for them.");
  if (f.input.funding === "service_funding") {
    items.push(
      "Courses on the assumption a voucher covers them: Navy COOL and Marine Corps COOL vouchers fund exams, not training.",
    );
  }
  if (f.separatingSoon && f.input.goal === "job") {
    items.push("Waiting on a credential before you start applying.");
  }
  items.push("Anything from us before you have used the free assessment and comparison: they are free.");
  return items;
}

const SUMMARIES: Record<PathwayId, string> = {
  fundamentals: "Build the vocabulary first, then decide on a credential with real information.",
  capm: "Earn the entry-level PMI credential while you document experience toward the PMP.",
  pmp: "Your documented experience may meet the PMP bar. Verify it project by project before you spend money.",
  psm1: "A low-cost Scrum credential fits your goal; read the Scrum Guide and self-study.",
  csm: "A live Scrum course fits your goal if your service funding approves it.",
  direct_employment: "Start applying with a resume built on real examples; add a credential if postings require it.",
};

export function recommendPathway(input: PathwayInput, today: Date = new Date()): PathwayPlan {
  const facts = deriveFacts(input, today);
  const assessments = [
    assessFundamentals(facts),
    assessCapm(facts),
    assessPmp(facts),
    assessScrum(facts, "psm1"),
    assessScrum(facts, "csm"),
    assessDirectEmployment(facts),
  ];
  const primary = choosePrimary(facts, assessments);
  const order = (a: PathwayAssessment) =>
    (a.id === primary ? -1 : 0) + FITS.indexOf(a.fit) * 10 + PATHWAY_IDS.indexOf(a.id) / 10;
  assessments.sort((a, b) => order(a) - order(b));

  // Someone aiming for the PMP who cannot document their months yet starts by documenting them.
  const nextAction =
    input.goal === "pmp" && !facts.pmpReady && facts.countedMonths === null ? NEXT_ACTIONS.pmp : NEXT_ACTIONS[primary];

  return {
    primary,
    headline: `Suggested next step: ${PATHWAYS[primary].name}`,
    summary: SUMMARIES[primary],
    assessments,
    nextAction,
    avoidSpending: avoidSpending(facts),
    pmpReadiness: {
      requiredMonths: facts.requiredMonths,
      countedMonths: facts.countedMonths,
      gapMonths: facts.countedMonths === null ? null : Math.max(0, facts.requiredMonths - facts.countedMonths),
    },
    caveat: PATHWAY_CAVEAT,
  };
}

export type { EducationLevel };
