/**
 * Flashcard deck tagged two ways:
 * - domain: the PMP Examination Content Outline domains (People, Process,
 *   Business Environment). The July 2026 outline weights them roughly
 *   33% / 41% / 26%.
 * - approach: predictive, agile, or hybrid. About 40% of exam questions are
 *   predictive and the rest are agile or hybrid.
 *
 * Cards marked `free` are the public sample; the rest unlock with the
 * Exam Vault add-on.
 */

export const DOMAINS = ["people", "process", "business_environment"] as const;
export type Domain = (typeof DOMAINS)[number];

export const APPROACHES = ["predictive", "agile", "hybrid"] as const;
export type Approach = (typeof APPROACHES)[number];

export const DOMAIN_LABELS: Record<Domain, string> = {
  people: "People",
  process: "Process",
  business_environment: "Business Environment",
};

export const DOMAIN_EXAM_WEIGHT: Record<Domain, number> = {
  people: 33,
  process: 41,
  business_environment: 26,
};

export const APPROACH_LABELS: Record<Approach, string> = {
  predictive: "Predictive",
  agile: "Agile",
  hybrid: "Hybrid",
};

export interface Flashcard {
  id: string;
  domain: Domain;
  approach: Approach;
  front: string;
  back: string;
  /** Optional bridge from a military concept the member already knows. */
  fieldNote?: string;
  free?: boolean;
}

export const FLASHCARDS: readonly Flashcard[] = [
  // People
  {
    id: "p-servant-leadership",
    domain: "people",
    approach: "agile",
    free: true,
    front: "On an agile team, what is the primary job of a servant leader?",
    back: "Remove impediments, shield the team from distractions, and create the conditions for the team to self-organize. They lead by serving the team, not by assigning tasks.",
    fieldNote: "Closer to a good LPO clearing obstacles for the work center than a supervisor handing out tasks.",
  },
  {
    id: "p-conflict-collaborate",
    domain: "people",
    approach: "hybrid",
    free: true,
    front: "Which conflict resolution technique most often produces a lasting, win-win result?",
    back: "Collaborating (problem solving): bring multiple viewpoints together, address the root cause, and reach consensus and commitment.",
  },
  {
    id: "p-tuckman",
    domain: "people",
    approach: "predictive",
    free: true,
    front: "Name Tuckman's five stages of team development in order.",
    back: "Forming, Storming, Norming, Performing, Adjourning.",
    fieldNote: "A new crew after a turnover goes through the same cycle.",
  },
  {
    id: "p-raci",
    domain: "people",
    approach: "predictive",
    front: "What does a RACI chart define, and what is its key rule?",
    back: "For each activity: who is Responsible, Accountable, Consulted, and Informed. Exactly one person is Accountable per activity.",
    fieldNote: "Like a watch bill: one name owns each station.",
  },
  {
    id: "p-disengaged",
    domain: "people",
    approach: "hybrid",
    front: "A normally strong team member has become disengaged. What should you do first?",
    back: "Meet privately to understand the root cause before escalating, reassigning work, or involving their manager.",
  },
  {
    id: "p-engagement-matrix",
    domain: "people",
    approach: "predictive",
    front: "Which tool compares stakeholders' current and desired engagement levels?",
    back: "The stakeholder engagement assessment matrix: Unaware, Resistant, Neutral, Supportive, Leading, with C marking current and D marking desired.",
  },
  {
    id: "p-power-interest",
    domain: "people",
    approach: "predictive",
    front: "A stakeholder has high power but low interest. What is the strategy?",
    back: "Keep satisfied: meet their needs and keep them informed enough that they do not become an unexpected blocker.",
  },
  {
    id: "p-psych-safety",
    domain: "people",
    approach: "agile",
    front: "Why does psychological safety matter on an agile team?",
    back: "People raise risks, mistakes, and ideas early without fear of blame, which keeps feedback fast and makes continuous improvement possible.",
  },
  {
    id: "p-distributed",
    domain: "people",
    approach: "hybrid",
    front: "Your team is spread across four time zones. What is the best first step?",
    back: "Create a team charter or working agreements: communication norms, core overlap hours, tools, and response expectations.",
  },
  {
    id: "p-team-charter",
    domain: "people",
    approach: "agile",
    front: "What belongs in a team charter?",
    back: "Team values, working agreements, ground rules, how decisions are made, how conflict is handled, and meeting norms.",
  },
  {
    id: "p-skill-gap",
    domain: "people",
    approach: "agile",
    front: "A team member lacks a skill the current iteration depends on. What do you do first?",
    back: "Assess the gap and arrange development through pairing, mentoring, or targeted training rather than replacing the person.",
  },
  // Process
  {
    id: "pr-critical-path",
    domain: "process",
    approach: "predictive",
    free: true,
    front: "What is the critical path?",
    back: "The longest path through the schedule network. It sets the shortest possible project duration, and its activities normally have zero total float.",
    fieldNote: "The chain of events in an OPORD timeline where any slip delays H-hour.",
  },
  {
    id: "pr-cpi",
    domain: "process",
    approach: "predictive",
    free: true,
    front: "CPI is 0.8. What does that tell you?",
    back: "CPI = EV / AC. You earn $0.80 of planned value for every $1.00 spent, so the project is over budget.",
  },
  {
    id: "pr-spi",
    domain: "process",
    approach: "predictive",
    free: true,
    front: "What is the SPI formula, and what does an SPI above 1.0 mean?",
    back: "SPI = EV / PV. Above 1.0 means you are ahead of schedule.",
  },
  {
    id: "pr-eac-typical",
    domain: "process",
    approach: "predictive",
    front: "What is EAC when current cost variances are expected to continue?",
    back: "EAC = BAC / CPI.",
  },
  {
    id: "pr-change-request",
    domain: "process",
    approach: "predictive",
    front: "On a predictive project, a senior stakeholder asks for a scope change. What comes first?",
    back: "Analyze the impact on scope, schedule, cost, and risk, then submit a formal change request through integrated change control. Never implement it first.",
  },
  {
    id: "pr-backlog-owner",
    domain: "process",
    approach: "agile",
    front: "Who owns and orders the product backlog?",
    back: "The product owner, ordering items by business value and risk.",
  },
  {
    id: "pr-dod-vs-ac",
    domain: "process",
    approach: "agile",
    front: "How does the Definition of Done differ from acceptance criteria?",
    back: "The Definition of Done is a team-wide quality checklist applied to every item. Acceptance criteria are specific to one user story.",
  },
  {
    id: "pr-threat-responses",
    domain: "process",
    approach: "predictive",
    front: "List the five response strategies for negative risks (threats).",
    back: "Escalate, Avoid, Transfer, Mitigate, Accept.",
  },
  {
    id: "pr-opportunity-responses",
    domain: "process",
    approach: "predictive",
    front: "List the five response strategies for positive risks (opportunities).",
    back: "Escalate, Exploit, Share, Enhance, Accept.",
  },
  {
    id: "pr-work-package",
    domain: "process",
    approach: "predictive",
    front: "What is the lowest level of the WBS called, and what is the 100% rule?",
    back: "The work package. The WBS contains all of the project's work and only the project's work.",
  },
  {
    id: "pr-velocity",
    domain: "process",
    approach: "agile",
    front: "What is velocity for, and what is it not for?",
    back: "It helps a team forecast how much it can finish per iteration. It is not a metric for comparing teams or judging individuals.",
  },
  {
    id: "pr-flat-burndown",
    domain: "process",
    approach: "agile",
    front: "The burndown chart has been flat for three days mid-iteration. What do you do?",
    back: "Investigate at the daily standup, identify the impediment, and work with the team to remove it.",
  },
  {
    id: "pr-hybrid-tailoring",
    domain: "process",
    approach: "hybrid",
    front: "When is a hybrid approach most appropriate?",
    back: "When some deliverables have stable, well-understood requirements and others are uncertain. Tailor the approach per deliverable, for example predictive for construction and agile for software.",
  },
  {
    id: "pr-cost-of-quality",
    domain: "process",
    approach: "predictive",
    front: "What are the two halves of the cost of quality?",
    back: "Cost of conformance (prevention and appraisal) and cost of nonconformance (internal and external failure). Prevention is the cheapest place to spend.",
  },
  {
    id: "pr-ffp",
    domain: "process",
    approach: "predictive",
    front: "Which contract type puts the most cost risk on the seller?",
    back: "Firm fixed price (FFP).",
  },
  {
    id: "pr-retrospective",
    domain: "process",
    approach: "agile",
    front: "What is the purpose of a retrospective?",
    back: "The team inspects how it worked and commits to specific improvements for the next iteration.",
    fieldNote: "An after-action review that produces action items, not blame.",
  },
  {
    id: "pr-mvp",
    domain: "process",
    approach: "agile",
    front: "What is a minimum viable product (MVP)?",
    back: "The smallest release that delivers value to real users and generates validated learning.",
  },
  {
    id: "pr-lessons-learned",
    domain: "process",
    approach: "hybrid",
    front: "When should lessons learned be captured?",
    back: "Throughout the project, not just at the end. Record them in the lessons learned register and transfer them to organizational process assets at closure.",
  },
  {
    id: "pr-closing",
    domain: "process",
    approach: "predictive",
    front: "What must happen before you release the team at project closure?",
    back: "Obtain formal acceptance of deliverables, close procurements, archive records, and finalize lessons learned. Then release resources.",
  },
  // Business Environment
  {
    id: "be-benefits-plan",
    domain: "business_environment",
    approach: "hybrid",
    free: true,
    front: "What does a benefits management plan describe?",
    back: "How and when the project's benefits will be delivered and measured, tying the work to business value.",
  },
  {
    id: "be-regulation",
    domain: "business_environment",
    approach: "hybrid",
    free: true,
    front: "A new regulation affects your project mid-execution. What do you do first?",
    back: "Assess the impact on scope, schedule, cost, and compliance, engage the compliance or legal function, and process any change through governance.",
  },
  {
    id: "be-business-case",
    domain: "business_environment",
    approach: "predictive",
    free: true,
    front: "What does the business case justify?",
    back: "Why the project is worth the investment: the business need, the options considered, and the expected benefits. It is used to authorize the project and is revisited to confirm it is still worth doing.",
  },
  {
    id: "be-org-change",
    domain: "business_environment",
    approach: "hybrid",
    front: "Your deliverable changes how another department works. What must you plan for?",
    back: "Organizational change management: stakeholder readiness, training, communication, and transition support so the change is actually adopted.",
  },
  {
    id: "be-governance",
    domain: "business_environment",
    approach: "hybrid",
    front: "What is project governance?",
    back: "The framework of roles, decision rights, escalation paths, and oversight that guides the project and keeps it aligned with organizational strategy.",
    fieldNote: "The chain of command and approval authorities for the project.",
  },
  {
    id: "be-pestle",
    domain: "business_environment",
    approach: "predictive",
    front: "What is a PESTLE analysis used for?",
    back: "Scanning Political, Economic, Social, Technological, Legal, and Environmental factors that could affect the project or its benefits.",
  },
  {
    id: "be-value-delivery",
    domain: "business_environment",
    approach: "agile",
    front: "In an agile environment, when is value actually delivered?",
    back: "When working increments are accepted and put to use by the business. Outcomes matter more than outputs.",
  },
  {
    id: "be-program-portfolio",
    domain: "business_environment",
    approach: "predictive",
    front: "How does a program differ from a portfolio?",
    back: "A program groups related projects to gain benefits not available individually. A portfolio groups projects, programs, and operations to meet strategic objectives, and they need not be related.",
  },
];

export function cardsForAccess(hasVault: boolean): readonly Flashcard[] {
  return hasVault ? FLASHCARDS : FLASHCARDS.filter((card) => card.free);
}

export const FLASHCARD_IDS = new Set(FLASHCARDS.map((card) => card.id));
