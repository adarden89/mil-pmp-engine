/**
 * Flashcard deck for members starting from zero.
 *
 * Categories: PM Fundamentals, Agile / Scrum, Predictive / Waterfall, Hybrid,
 * and Business Analysis. Four of these are the CAPM exam's domains (weights
 * below); Hybrid covers the tailoring the PMP tests heavily. Cards that map to
 * a PMP domain (People, Process, Business Environment) carry that tag too.
 *
 * Cards in FREE_SAMPLE are public; the rest unlock with the Study Vault.
 */

export const CATEGORIES = ["fundamentals", "agile", "predictive", "hybrid", "business_analysis"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  fundamentals: "PM Fundamentals",
  agile: "Agile / Scrum",
  predictive: "Predictive / Waterfall",
  hybrid: "Hybrid",
  business_analysis: "Business Analysis",
};

/** CAPM exam content outline weights. Hybrid is not a separate CAPM domain. */
export const CAPM_WEIGHT: Partial<Record<Category, number>> = {
  fundamentals: 36,
  predictive: 17,
  agile: 20,
  business_analysis: 27,
};

export const DOMAINS = ["people", "process", "business_environment"] as const;
export type Domain = (typeof DOMAINS)[number];

export const DOMAIN_LABELS: Record<Domain, string> = {
  people: "People",
  process: "Process",
  business_environment: "Business Environment",
};

interface CardSeed {
  id: string;
  category: Category;
  domain?: Domain;
  front: string;
  back: string;
  /** Optional bridge from a military concept the member already knows. */
  fieldNote?: string;
}

export interface Flashcard extends CardSeed {
  free: boolean;
}

const CORE_CARDS: readonly CardSeed[] = [
  // People
  {
    id: "p-servant-leadership",
    domain: "people",
    category: "agile",
    front: "On an agile team, what is the primary job of a servant leader?",
    back: "Remove impediments, shield the team from distractions, and create the conditions for the team to self-organize. They lead by serving the team, not by assigning tasks.",
    fieldNote: "Closer to a good LPO clearing obstacles for the work center than a supervisor handing out tasks.",
  },
  {
    id: "p-conflict-collaborate",
    domain: "people",
    category: "hybrid",
    front: "Which conflict resolution technique most often produces a lasting, win-win result?",
    back: "Collaborating (problem solving): bring multiple viewpoints together, address the root cause, and reach consensus and commitment.",
  },
  {
    id: "p-tuckman",
    domain: "people",
    category: "predictive",
    front: "Name Tuckman's five stages of team development in order.",
    back: "Forming, Storming, Norming, Performing, Adjourning.",
    fieldNote: "A new crew after a turnover goes through the same cycle.",
  },
  {
    id: "p-raci",
    domain: "people",
    category: "predictive",
    front: "What does a RACI chart define, and what is its key rule?",
    back: "For each activity: who is Responsible, Accountable, Consulted, and Informed. Exactly one person is Accountable per activity.",
    fieldNote: "Like a watch bill: one name owns each station.",
  },
  {
    id: "p-disengaged",
    domain: "people",
    category: "hybrid",
    front: "A normally strong team member has become disengaged. What should you do first?",
    back: "Meet privately to understand the root cause before escalating, reassigning work, or involving their manager.",
  },
  {
    id: "p-engagement-matrix",
    domain: "people",
    category: "predictive",
    front: "Which tool compares stakeholders' current and desired engagement levels?",
    back: "The stakeholder engagement assessment matrix: Unaware, Resistant, Neutral, Supportive, Leading, with C marking current and D marking desired.",
  },
  {
    id: "p-power-interest",
    domain: "people",
    category: "predictive",
    front: "A stakeholder has high power but low interest. What is the strategy?",
    back: "Keep satisfied: meet their needs and keep them informed enough that they do not become an unexpected blocker.",
  },
  {
    id: "p-psych-safety",
    domain: "people",
    category: "agile",
    front: "Why does psychological safety matter on an agile team?",
    back: "People raise risks, mistakes, and ideas early without fear of blame, which keeps feedback fast and makes continuous improvement possible.",
  },
  {
    id: "p-distributed",
    domain: "people",
    category: "hybrid",
    front: "Your team is spread across four time zones. What is the best first step?",
    back: "Create a team charter or working agreements: communication norms, core overlap hours, tools, and response expectations.",
  },
  {
    id: "p-team-charter",
    domain: "people",
    category: "agile",
    front: "What belongs in a team charter?",
    back: "Team values, working agreements, ground rules, how decisions are made, how conflict is handled, and meeting norms.",
  },
  {
    id: "p-skill-gap",
    domain: "people",
    category: "agile",
    front: "A team member lacks a skill the current iteration depends on. What do you do first?",
    back: "Assess the gap and arrange development through pairing, mentoring, or targeted training rather than replacing the person.",
  },
  // Process
  {
    id: "pr-critical-path",
    domain: "process",
    category: "predictive",
    front: "What is the critical path?",
    back: "The longest path through the schedule network. It sets the shortest possible project duration, and its activities normally have zero total float.",
    fieldNote: "The chain of events in an OPORD timeline where any slip delays H-hour.",
  },
  {
    id: "pr-cpi",
    domain: "process",
    category: "predictive",
    front: "CPI is 0.8. What does that tell you?",
    back: "CPI = EV / AC. You earn $0.80 of planned value for every $1.00 spent, so the project is over budget.",
  },
  {
    id: "pr-spi",
    domain: "process",
    category: "predictive",
    front: "What is the SPI formula, and what does an SPI above 1.0 mean?",
    back: "SPI = EV / PV. Above 1.0 means you are ahead of schedule.",
  },
  {
    id: "pr-eac-typical",
    domain: "process",
    category: "predictive",
    front: "What is EAC when current cost variances are expected to continue?",
    back: "EAC = BAC / CPI.",
  },
  {
    id: "pr-change-request",
    domain: "process",
    category: "predictive",
    front: "On a predictive project, a senior stakeholder asks for a scope change. What comes first?",
    back: "Analyze the impact on scope, schedule, cost, and risk, then submit a formal change request through integrated change control. Never implement it first.",
  },
  {
    id: "pr-backlog-owner",
    domain: "process",
    category: "agile",
    front: "Who owns and orders the product backlog?",
    back: "The product owner, ordering items by business value and risk.",
  },
  {
    id: "pr-dod-vs-ac",
    domain: "process",
    category: "agile",
    front: "How does the Definition of Done differ from acceptance criteria?",
    back: "The Definition of Done is a team-wide quality checklist applied to every item. Acceptance criteria are specific to one user story.",
  },
  {
    id: "pr-threat-responses",
    domain: "process",
    category: "predictive",
    front: "List the five response strategies for negative risks (threats).",
    back: "Escalate, Avoid, Transfer, Mitigate, Accept.",
  },
  {
    id: "pr-opportunity-responses",
    domain: "process",
    category: "predictive",
    front: "List the five response strategies for positive risks (opportunities).",
    back: "Escalate, Exploit, Share, Enhance, Accept.",
  },
  {
    id: "pr-work-package",
    domain: "process",
    category: "predictive",
    front: "What is the lowest level of the WBS called, and what is the 100% rule?",
    back: "The work package. The WBS contains all of the project's work and only the project's work.",
  },
  {
    id: "pr-velocity",
    domain: "process",
    category: "agile",
    front: "What is velocity for, and what is it not for?",
    back: "It helps a team forecast how much it can finish per iteration. It is not a metric for comparing teams or judging individuals.",
  },
  {
    id: "pr-flat-burndown",
    domain: "process",
    category: "agile",
    front: "The burndown chart has been flat for three days mid-iteration. What do you do?",
    back: "Investigate at the daily standup, identify the impediment, and work with the team to remove it.",
  },
  {
    id: "pr-hybrid-tailoring",
    domain: "process",
    category: "hybrid",
    front: "When is a hybrid approach most appropriate?",
    back: "When some deliverables have stable, well-understood requirements and others are uncertain. Tailor the approach per deliverable, for example predictive for construction and agile for software.",
  },
  {
    id: "pr-cost-of-quality",
    domain: "process",
    category: "predictive",
    front: "What are the two halves of the cost of quality?",
    back: "Cost of conformance (prevention and appraisal) and cost of nonconformance (internal and external failure). Prevention is the cheapest place to spend.",
  },
  {
    id: "pr-ffp",
    domain: "process",
    category: "predictive",
    front: "Which contract type puts the most cost risk on the seller?",
    back: "Firm fixed price (FFP).",
  },
  {
    id: "pr-retrospective",
    domain: "process",
    category: "agile",
    front: "What is the purpose of a retrospective?",
    back: "The team inspects how it worked and commits to specific improvements for the next iteration.",
    fieldNote: "An after-action review that produces action items, not blame.",
  },
  {
    id: "pr-mvp",
    domain: "process",
    category: "agile",
    front: "What is a minimum viable product (MVP)?",
    back: "The smallest release that delivers value to real users and generates validated learning.",
  },
  {
    id: "pr-lessons-learned",
    domain: "process",
    category: "hybrid",
    front: "When should lessons learned be captured?",
    back: "Throughout the project, not just at the end. Record them in the lessons learned register and transfer them to organizational process assets at closure.",
  },
  {
    id: "pr-closing",
    domain: "process",
    category: "predictive",
    front: "What must happen before you release the team at project closure?",
    back: "Obtain formal acceptance of deliverables, close procurements, archive records, and finalize lessons learned. Then release resources.",
  },
  // Business Environment
  {
    id: "be-benefits-plan",
    domain: "business_environment",
    category: "hybrid",
    front: "What does a benefits management plan describe?",
    back: "How and when the project's benefits will be delivered and measured, tying the work to business value.",
  },
  {
    id: "be-regulation",
    domain: "business_environment",
    category: "hybrid",
    front: "A new regulation affects your project mid-execution. What do you do first?",
    back: "Assess the impact on scope, schedule, cost, and compliance, engage the compliance or legal function, and process any change through governance.",
  },
  {
    id: "be-business-case",
    domain: "business_environment",
    category: "predictive",
    front: "What does the business case justify?",
    back: "Why the project is worth the investment: the business need, the options considered, and the expected benefits. It is used to authorize the project and is revisited to confirm it is still worth doing.",
  },
  {
    id: "be-org-change",
    domain: "business_environment",
    category: "hybrid",
    front: "Your deliverable changes how another department works. What must you plan for?",
    back: "Organizational change management: stakeholder readiness, training, communication, and transition support so the change is actually adopted.",
  },
  {
    id: "be-governance",
    domain: "business_environment",
    category: "hybrid",
    front: "What is project governance?",
    back: "The framework of roles, decision rights, escalation paths, and oversight that guides the project and keeps it aligned with organizational strategy.",
    fieldNote: "The chain of command and approval authorities for the project.",
  },
  {
    id: "be-pestle",
    domain: "business_environment",
    category: "predictive",
    front: "What is a PESTLE analysis used for?",
    back: "Scanning Political, Economic, Social, Technological, Legal, and Environmental factors that could affect the project or its benefits.",
  },
  {
    id: "be-value-delivery",
    domain: "business_environment",
    category: "agile",
    front: "In an agile environment, when is value actually delivered?",
    back: "When working increments are accepted and put to use by the business. Outcomes matter more than outputs.",
  },
  {
    id: "be-program-portfolio",
    domain: "business_environment",
    category: "predictive",
    front: "How does a program differ from a portfolio?",
    back: "A program groups related projects to gain benefits not available individually. A portfolio groups projects, programs, and operations to meet strategic objectives, and they need not be related.",
  },
];

const BEGINNER_CARDS: readonly CardSeed[] = [
  // PM Fundamentals
  {
    id: "f-what-is-project",
    category: "fundamentals",
    front: "What makes something a project rather than ongoing operations?",
    back: "A project is temporary, with a defined start and end, and creates a unique product, service, or result. Operations are ongoing and repetitive.",
    fieldNote: "Planning one FTX is a project. Running the daily duty section is operations.",
  },
  {
    id: "f-triple-constraint",
    category: "fundamentals",
    front: "What are the classic competing constraints on a project?",
    back: "Scope, schedule, and cost, which together affect quality. Current guidance also weighs risk, resources, and stakeholder satisfaction.",
  },
  {
    id: "f-pm-role",
    category: "fundamentals",
    domain: "people",
    front: "What is the project manager's core responsibility?",
    back: "Leading the team to achieve the project's objectives: integrating the work, engaging stakeholders, and balancing competing constraints.",
  },
  {
    id: "f-stakeholder",
    category: "fundamentals",
    domain: "people",
    front: "Who counts as a stakeholder?",
    back: "Any individual, group, or organization that may affect, be affected by, or perceive itself to be affected by the project.",
  },
  {
    id: "f-charter",
    category: "fundamentals",
    domain: "process",
    front: "What does a project charter do?",
    back: "It formally authorizes the project, names the project manager, and gives them authority to apply organizational resources. The sponsor issues it.",
    fieldNote: "Closest military analog: the order or tasking that stands up the effort and names who is in charge.",
  },
  {
    id: "f-sponsor",
    category: "fundamentals",
    domain: "business_environment",
    front: "What is the project sponsor's role?",
    back: "Provides resources and support, champions the project, and makes decisions beyond the project manager's authority.",
  },
  {
    id: "f-life-cycle",
    category: "fundamentals",
    front: "What is a project life cycle?",
    back: "The series of phases a project passes through from start to finish. It can be predictive, iterative, incremental, adaptive, or hybrid.",
  },
  {
    id: "f-process-groups",
    category: "fundamentals",
    domain: "process",
    front: "Name PMI's five process groups in order.",
    back: "Initiating, Planning, Executing, Monitoring and Controlling, Closing.",
  },
  {
    id: "f-scope-creep",
    category: "fundamentals",
    domain: "process",
    front: "What is scope creep?",
    back: "Uncontrolled growth in scope without matching adjustments to time, cost, and resources, usually through unapproved changes.",
  },
  {
    id: "f-org-structure",
    category: "fundamentals",
    domain: "business_environment",
    front: "In which organizational structure does the project manager have the most authority?",
    back: "A projectized (project-oriented) organization. In a functional organization, the functional manager holds most of the authority.",
  },
  {
    id: "f-milestone",
    category: "fundamentals",
    domain: "process",
    front: "What is a milestone?",
    back: "A significant point or event in the project, with zero duration, such as completing a phase or receiving an approval.",
  },
  {
    id: "f-pmo",
    category: "fundamentals",
    domain: "business_environment",
    front: "What is a PMO?",
    back: "A project management office: an organizational unit that standardizes project governance and shares resources, methods, tools, and techniques.",
  },
  {
    id: "f-comm-channels",
    category: "fundamentals",
    domain: "people",
    front: "How many communication channels does a team of 10 people have?",
    back: "45. The formula is n(n - 1) / 2, so 10 × 9 / 2 = 45.",
  },
  // Agile / Scrum
  {
    id: "s-scrum-roles",
    category: "agile",
    domain: "people",
    front: "What are the three Scrum accountabilities?",
    back: "Product Owner, Scrum Master, and Developers.",
  },
  {
    id: "s-sprint",
    category: "agile",
    domain: "process",
    front: "How long is a sprint?",
    back: "A fixed timebox of one month or less, commonly one to four weeks. The next sprint starts immediately after the previous one ends.",
  },
  {
    id: "s-events",
    category: "agile",
    domain: "process",
    front: "Name the Scrum events.",
    back: "The Sprint, Sprint Planning, Daily Scrum, Sprint Review, and Sprint Retrospective.",
  },
  {
    id: "s-artifacts",
    category: "agile",
    domain: "process",
    front: "Name the three Scrum artifacts.",
    back: "Product Backlog, Sprint Backlog, and Increment.",
  },
  {
    id: "s-daily-scrum",
    category: "agile",
    domain: "people",
    front: "What is the Daily Scrum for?",
    back: "A 15-minute event where Developers inspect progress toward the Sprint Goal and adapt the plan for the next day.",
    fieldNote: "Like a morning sync, but the team runs it for itself, not to brief a boss.",
  },
  {
    id: "s-wip",
    category: "agile",
    domain: "process",
    front: "What does a WIP limit do in Kanban?",
    back: "Caps how many items can sit in a workflow stage at once, which exposes bottlenecks and improves flow.",
  },
  {
    id: "s-manifesto",
    category: "agile",
    front: "What does the Agile Manifesto value over processes and tools?",
    back: "Individuals and interactions. It also values working software over comprehensive documentation, customer collaboration over contract negotiation, and responding to change over following a plan.",
  },
  {
    id: "s-story-points",
    category: "agile",
    domain: "process",
    front: "What are story points?",
    back: "A relative estimate of effort, complexity, and uncertainty for a backlog item. They are not hours.",
  },
  // Predictive / Waterfall
  {
    id: "pd-gantt",
    category: "predictive",
    domain: "process",
    front: "What does a Gantt chart show?",
    back: "Activities as bars on a timeline, with start and finish dates, durations, and often dependencies.",
  },
  {
    id: "pd-float",
    category: "predictive",
    domain: "process",
    front: "What is total float?",
    back: "How long an activity can slip without delaying the project's finish date.",
  },
  {
    id: "pd-baseline",
    category: "predictive",
    domain: "process",
    front: "What is a baseline?",
    back: "The approved version of the scope, schedule, or cost plan. It changes only through formal change control and is used to measure performance.",
  },
  {
    id: "pd-three-point",
    category: "predictive",
    domain: "process",
    front: "What is the three-point (PERT) estimate formula?",
    back: "(Optimistic + 4 × Most likely + Pessimistic) ÷ 6.",
  },
  {
    id: "pd-crash-fast-track",
    category: "predictive",
    domain: "process",
    front: "How do crashing and fast-tracking differ?",
    back: "Crashing adds resources to shorten critical-path activities and raises cost. Fast-tracking runs sequential activities in parallel and raises risk.",
  },
  // Hybrid
  {
    id: "h-rolling-wave",
    category: "hybrid",
    domain: "process",
    front: "What is rolling wave planning?",
    back: "Planning near-term work in detail and later work at a higher level, then refining it as information becomes available.",
  },
  {
    id: "h-tailoring",
    category: "hybrid",
    domain: "process",
    front: "What is tailoring?",
    back: "Deliberately adapting the approach, governance, and processes to fit the project's context, rather than applying one method everywhere.",
  },
  {
    id: "h-stage-gates",
    category: "hybrid",
    domain: "business_environment",
    front: "Leadership requires stage gates, but the team wants to work in sprints. What fits?",
    back: "Keep the gates and fixed milestones at the governance level while the team delivers in sprints inside each stage, reporting progress against both.",
  },
  // Business Analysis
  {
    id: "ba-requirement",
    category: "business_analysis",
    domain: "process",
    front: "What is a requirement?",
    back: "A condition or capability that must be present in a product, service, or result to satisfy a business need.",
  },
  {
    id: "ba-elicitation",
    category: "business_analysis",
    domain: "people",
    front: "Name common requirements elicitation techniques.",
    back: "Interviews, focus groups, facilitated workshops, observation, questionnaires, prototyping, and document analysis.",
  },
  {
    id: "ba-rtm",
    category: "business_analysis",
    domain: "process",
    front: "What does a requirements traceability matrix do?",
    back: "Links each requirement to its business objective and to the deliverables and tests that satisfy it, so nothing is missed or added without reason.",
  },
  {
    id: "ba-moscow",
    category: "business_analysis",
    domain: "process",
    front: "What does MoSCoW prioritization stand for?",
    back: "Must have, Should have, Could have, Won't have (this time).",
  },
  {
    id: "ba-needs-assessment",
    category: "business_analysis",
    domain: "business_environment",
    front: "What is a needs assessment, or gap analysis?",
    back: "Comparing the current state with the desired future state to define the gap the solution has to close.",
  },
  {
    id: "ba-stakeholder-analysis",
    category: "business_analysis",
    domain: "people",
    front: "Why do business analysts perform stakeholder analysis?",
    back: "To find who holds requirements and influence, so elicitation reaches the right people and conflicting needs surface early.",
  },
  {
    id: "ba-acceptance-criteria",
    category: "business_analysis",
    domain: "process",
    front: "What makes acceptance criteria useful?",
    back: "They are specific, testable conditions that define when a requirement or user story is satisfied.",
  },
  {
    id: "ba-solution-evaluation",
    category: "business_analysis",
    domain: "business_environment",
    front: "What is solution evaluation?",
    back: "Measuring whether the delivered solution actually produces the expected business value, and recommending changes if it does not.",
  },
  {
    id: "ba-user-story",
    category: "business_analysis",
    domain: "process",
    front: "What is the standard user story format?",
    back: "As a <role>, I want <capability>, so that <benefit>.",
  },
  {
    id: "ba-roadmap",
    category: "business_analysis",
    domain: "business_environment",
    front: "What does a product roadmap show?",
    back: "A high-level view of how the product is expected to evolve over time, linking planned releases to goals.",
  },
];

const FREE_SAMPLE = new Set([
  "f-what-is-project",
  "f-triple-constraint",
  "s-scrum-roles",
  "p-servant-leadership",
  "pd-gantt",
  "pr-critical-path",
  "h-rolling-wave",
  "pr-hybrid-tailoring",
  "ba-requirement",
  "ba-elicitation",
]);

export const FLASHCARDS: readonly Flashcard[] = [...BEGINNER_CARDS, ...CORE_CARDS].map((card) => ({
  ...card,
  free: FREE_SAMPLE.has(card.id),
}));

export function cardsForAccess(hasVault: boolean): readonly Flashcard[] {
  return hasVault ? FLASHCARDS : FLASHCARDS.filter((card) => card.free);
}

export const FLASHCARD_IDS = new Set(FLASHCARDS.map((card) => card.id));
