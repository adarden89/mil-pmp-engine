import type { TranslateRequest, TranslationResult } from "./translation-schema";

/** Example input/output pair shown in the studio so members can see the format before using a credit. */
export const SAMPLE_REQUEST: TranslateRequest = {
  branch: "navy",
  rateOrMos: "IT2 / Information Systems Technician",
  billet: "Leading Petty Officer, Network Operations Work Center",
  projectTitle: "CANES network refresh",
  startMonth: "2024-02",
  endMonth: "2024-09",
  teamSize: 12,
  rawBullets: [
    "- LPO for 12-Sailor work center; led CANES network refresh across 3 departments, 220 workstations",
    "- Developed POA&M and phased cutover schedule; coordinated with DHs and NAVWAR ISEA tech reps",
    "- Briefed progress daily via SITREP to CO/XO; tracked 14 hardware deficiencies to resolution via CASREP",
    "- Completed migration 3 weeks ahead of INSURV with zero mission degradation; trouble tickets down 42%",
    "- Managed $180K in OPTAR spares and consumables",
    "- Trained 9 junior Sailors on new baseline; authored turnover binder adopted by ISIC",
  ].join("\n"),
};

export const SAMPLE_TRANSLATION: TranslationResult = {
  civilianProjectTitle: "Network Infrastructure Modernization (220 Workstations)",
  objective:
    "Migrate 220 workstations across three departments to a new network baseline without interrupting round-the-clock operations, ahead of a scheduled external inspection.",
  role: "Project lead and supervisor of a 12-person technical team",
  deliverables: [
    "Project action plan and phased cutover schedule",
    "220 workstations migrated to the new network baseline",
    "Deficiency log with 14 hardware issues tracked to resolution",
    "Training for 9 junior technicians and a turnover guide adopted by the parent organization",
  ],
  outcome:
    "Finished 3 weeks ahead of the inspection deadline with no loss of operational capability; network trouble tickets fell 42% after cutover.",
  applicationSummary: [
    "As project lead for a 12-person technical team, I directed the migration of 220 workstations across three departments to a new network baseline. The objective was to complete the cutover without interrupting round-the-clock operations and to finish before a scheduled external inspection.",
    "I initiated the project by coordinating scope and timing with the department heads of the three affected departments and with the external engineering support team that owned the technical baseline.",
    "I developed the project action plan and a phased cutover schedule that sequenced the migration department by department, and I assigned work across the team for each phase.",
    "During execution I led the team through the migration, coordinated the external engineering representatives on site, and managed $180,000 in spare parts and materials for the effort.",
    "I monitored progress through daily status reports to senior leadership and tracked 14 hardware deficiencies through formal equipment-failure reporting until each one was resolved.",
    "To close the project, I trained 9 junior technicians on the new baseline and wrote a turnover guide that our parent organization adopted for other teams.",
    "The migration finished 3 weeks ahead of the inspection deadline with no loss of operational capability, and network trouble tickets fell 42% after cutover.",
    "Key deliverables were the action plan and cutover schedule, 220 migrated workstations, the resolved deficiency log, and the training and turnover package.",
  ].join(" "),
  processGroups: {
    initiating: [
      "Coordinated scope and timing with the heads of three departments",
      "Engaged the external engineering support team as a key stakeholder",
    ],
    planning: [
      "Developed the project action plan and phased cutover schedule",
      "Assigned team members to each migration phase",
    ],
    executing: [
      "Led a 12-person team through the migration of 220 workstations",
      "Managed $180,000 in spare parts and materials",
      "Coordinated on-site external engineering representatives",
    ],
    monitoringControlling: [
      "Reported progress daily to senior leadership",
      "Tracked 14 hardware deficiencies through formal failure reporting to resolution",
    ],
    closing: [
      "Trained 9 junior technicians on the new baseline",
      "Wrote a turnover guide adopted by the parent organization",
    ],
  },
  jargonTranslations: [
    { military: "LPO (Leading Petty Officer)", civilian: "Team lead / first-line supervisor" },
    { military: "CANES", civilian: "Shipboard network infrastructure" },
    { military: "POA&M", civilian: "Project action plan" },
    { military: "DH", civilian: "Department head" },
    { military: "NAVWAR ISEA tech reps", civilian: "External engineering support team" },
    { military: "SITREP to CO/XO", civilian: "Daily status report to senior leadership" },
    { military: "CASREP", civilian: "Formal equipment-failure report" },
    { military: "INSURV", civilian: "External material inspection" },
    { military: "OPTAR", civilian: "Operating budget" },
    { military: "ISIC", civilian: "Parent organization" },
  ],
  auditFlags: [
    "Confirm your former supervisor can verify the 42% reduction in trouble tickets, or soften it to 'significantly reduced'.",
    "Clarify whether you controlled the $180,000 as a budget or accounted for it as materials; reviewers may ask.",
    "Make sure the project dates match what your verifier will remember (February to September 2024).",
  ],
  suggestedVerifier: "Department head who directly supervised the work at the time",
};
