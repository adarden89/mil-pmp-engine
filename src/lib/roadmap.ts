/**
 * Beginner-to-Certified roadmap. Generated from the eligibility result and the
 * member's branch; task ids are stable so progress can be stored and synced.
 */

import type { CertificationPath, EligibilityResult } from "./eligibility";
import { BRANCH_PORTALS, NAVY_COOL } from "./pmi-facts";
import type { Branch } from "./translation-schema";

export interface RoadmapTask {
  id: string;
  title: string;
  detail: string;
  href?: string;
  /** Tasks that would cost the member money if done early. */
  blockedUntilVoucher?: boolean;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  timeframe: string;
  tasks: RoadmapTask[];
}

export interface Roadmap {
  path: CertificationPath;
  branch: Branch;
  phases: RoadmapPhase[];
}

function fundingTasks(branch: Branch, path: CertificationPath): RoadmapTask[] {
  const portal = BRANCH_PORTALS[branch];
  if (branch === "navy") {
    return [
      {
        id: "fund-navy-mapping",
        title: `Confirm the ${path} is mapped to your rating on Navy COOL`,
        detail: "Funding follows the mapping to your rating, designator, or collateral duty. Screenshot the page.",
        href: portal.url,
      },
      {
        id: "fund-navy-1500-57",
        title: `Complete ${NAVY_COOL.formNumber} and route it through your command`,
        detail: `Use the prep packet to gather every field, transfer it onto the official ${NAVY_COOL.formNumber} from Navy COOL, and get command approval. Your EAOS must be more than ${NAVY_COOL.minMonthsRemainingAtReceipt} months after Navy COOL receives it.`,
        href: "/funding#opnav-1500-57",
      },
      {
        id: "fund-navy-approval",
        title: "Wait for Navy COOL funding approval",
        detail: "Navy COOL pays PMI directly once approved. Do not pay anything yourself in the meantime.",
      },
    ];
  }
  return [
    {
      id: `fund-${branch}-portal`,
      title: `Confirm ${path} funding eligibility in ${portal.name}`,
      detail:
        "Check that the credential is fundable for your specialty and that you meet the program's service and fitness requirements.",
      href: portal.url,
    },
    {
      id: `fund-${branch}-request`,
      title: "Submit the funding request and get approval",
      detail:
        "Submit through your service's portal with your PMI eligibility details. Approval must come before any payment.",
      href: "/funding",
    },
  ];
}

export function buildRoadmap(result: EligibilityResult, branch: Branch): Roadmap {
  const path = result.path;
  const hours = result.educationHours;

  const phases: RoadmapPhase[] = [
    {
      id: "foundation",
      title: "Foundation",
      timeframe: "Week 1",
      tasks: [
        {
          id: "found-pmi-account",
          title: "Create your free PMI account",
          detail: "Use a personal email you will keep after you separate. Your certification lives in this account.",
          href: "https://www.pmi.org/",
        },
        {
          id: "found-experience-log",
          title: path === "PMP" ? "List every project you led in the last 8 years" : "Start a project log today",
          detail:
            path === "PMP"
              ? "Dates, objective, your role, outcome, and a verifier for each. Use the Accidental PM Mapper to spot projects hiding in your duties."
              : "The PMP will need it later. Record each detail, exercise, or inspection you lead, with dates and a verifier.",
          href: "/eligibility#mapper",
        },
        {
          id: "found-jst",
          title: "Download your Joint Services Transcript",
          detail: "It documents your training and is the first thing an education office or PMI auditor asks for.",
          href: "https://jst.doded.mil/",
        },
      ],
    },
    {
      id: "education",
      title: `${hours} contact hours`,
      timeframe: path === "PMP" ? "Weeks 2 to 5" : "Weeks 2 to 3",
      tasks: [
        {
          id: "edu-course",
          title: `Complete ${hours} contact hours of project management education`,
          detail:
            path === "PMP"
              ? "A course that issues a 35 contact hour certificate, such as Andrew Ramdayal's or Joseph Phillips' Udemy courses, or a free Onward to Opportunity pathway if you are transitioning."
              : "Any course that issues a 23 contact hour certificate. Free options exist for transitioning members through Onward to Opportunity.",
          href: "/funding#education",
        },
        {
          id: "edu-certificate",
          title: "Save your course completion certificate",
          detail: "PMI can ask for it during an audit, years later.",
        },
      ],
    },
    {
      id: "application",
      title: "PMI application",
      timeframe: "Week 5 to 6",
      tasks: [
        ...(path === "PMP"
          ? [
              {
                id: "app-translate",
                title: "Translate each project into PMI language",
                detail:
                  "Run every project through the Translation Studio and clear its audit flags before you paste it in.",
                href: "/translate",
              },
            ]
          : []),
        {
          id: "app-submit",
          title: `Submit your ${path} application to PMI`,
          detail:
            "Submitting the application is free. Payment comes after approval, and that payment must come from your approved voucher, not your card.",
          href: "https://www.pmi.org/certifications",
        },
        {
          id: "app-approved",
          title: "Receive PMI's application approval",
          detail: "Usually about 5 business days. If you are selected for audit, send your verifications promptly.",
        },
      ],
    },
    {
      id: "funding",
      title: "$0 out-of-pocket funding",
      timeframe: "Weeks 6 to 8",
      tasks: fundingTasks(branch, path),
    },
    {
      id: "study",
      title: "Study",
      timeframe: path === "PMP" ? "6 to 10 weeks" : "3 to 6 weeks",
      tasks: [
        {
          id: "study-flashcards",
          title: "Reach 70%+ retention in every flashcard category",
          detail: "Short daily reps beat weekend cramming.",
          href: "/vault",
        },
        {
          id: "study-simulator",
          title: "Score consistently on a full-length exam simulator",
          detail: "PMI Study Hall is closest to the real exam. Take full-length tests under timed conditions.",
          href: "/vault#resources",
        },
      ],
    },
    {
      id: "exam",
      title: "Exam day",
      timeframe: "Within the voucher window",
      tasks: [
        {
          id: "exam-schedule",
          title: "Schedule the exam with your approved funding",
          detail: "Only after the voucher or funded authorization is in hand. Book inside its validity window.",
          blockedUntilVoucher: true,
        },
        {
          id: "exam-sit",
          title: `Sit and pass the ${path}`,
          detail: "Arrive early with ID that matches your PMI profile exactly.",
          blockedUntilVoucher: true,
        },
        {
          id: "exam-report",
          title: "Report your result to your COOL / CA program",
          detail: "Unreported results can block future funding.",
        },
      ],
    },
  ];

  return { path, branch, phases };
}

export function allTaskIds(roadmap: Roadmap): string[] {
  return roadmap.phases.flatMap((phase) => phase.tasks.map((task) => task.id));
}

export function roadmapProgress(
  roadmap: Roadmap,
  completed: readonly string[],
): { done: number; total: number; percent: number } {
  const ids = allTaskIds(roadmap);
  const done = ids.filter((id) => completed.includes(id)).length;
  return { done, total: ids.length, percent: ids.length ? Math.round((done / ids.length) * 100) : 0 };
}

/** First phase with an unfinished task: the member's current focus. */
export function currentPhase(roadmap: Roadmap, completed: readonly string[]): RoadmapPhase | null {
  return roadmap.phases.find((phase) => phase.tasks.some((task) => !completed.includes(task.id))) ?? null;
}
