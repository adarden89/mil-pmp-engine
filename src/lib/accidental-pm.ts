/**
 * "Accidental PM" Military Experience Mapper.
 *
 * PMI counts projects: temporary efforts with a defined start, finish, and
 * unique outcome. Plenty of military duties are ongoing operations instead, so
 * each entry says honestly whether the duty itself is a project and, if not,
 * what the project inside it looks like.
 */

import { PMP_EXPERIENCE_WINDOW_YEARS } from "./pmi-facts";
import type { Branch, ProcessGroupKey } from "./translation-schema";

export interface MilitaryDuty {
  id: string;
  label: string;
  examples: string;
  isProject: boolean;
  /** How to frame it as a project PMI will accept. */
  projectFraming: string;
  processGroups: Record<ProcessGroupKey, string[]>;
  pmiTerms: string[];
  /** Branches where this duty is typical. Omitted when it is common to every branch. */
  branches?: readonly Branch[];
}

export const MILITARY_DUTIES: readonly MilitaryDuty[] = [
  {
    id: "ftx-planning",
    branches: ["army", "marine_corps"],
    label: "Field exercise (FTX) planning",
    examples: "FTX, CPX, unit training exercise",
    isProject: true,
    projectFraming:
      "A single exercise is a textbook project: fixed dates, a defined objective, and a hand-off afterwards.",
    processGroups: {
      initiating: ["Defined exercise objectives with the commander", "Identified participating units and stakeholders"],
      planning: ["Built the exercise schedule and resource plan", "Developed a risk assessment and mitigation plan"],
      executing: ["Led the planning team and coordinated support elements", "Executed the training schedule"],
      monitoringControlling: [
        "Tracked readiness and resource status daily",
        "Adjusted the plan when conditions changed",
      ],
      closing: ["Ran the after-action review", "Documented lessons learned for the next iteration"],
    },
    pmiTerms: ["Project charter", "Schedule", "Risk register", "Lessons learned"],
  },
  {
    id: "deployment-logistics",
    label: "Deployment or unit move logistics",
    examples: "Deployment, redeployment, PCS of a unit, equipment movement",
    isProject: true,
    projectFraming: "A move has a start, an end, and a measurable result: people and equipment in place on time.",
    processGroups: {
      initiating: [
        "Confirmed movement requirements and timelines",
        "Identified carriers, units, and receiving stakeholders",
      ],
      planning: ["Built load plans and movement schedule", "Planned procurement of packing materials and transport"],
      executing: ["Led load-out teams", "Coordinated transportation with external agencies"],
      monitoringControlling: ["Tracked equipment status against the schedule", "Resolved discrepancies in manifests"],
      closing: ["Reconciled all equipment at destination", "Closed out transportation documents"],
    },
    pmiTerms: ["Procurement", "Schedule baseline", "Stakeholder engagement"],
  },
  {
    id: "inspection-prep",
    label: "Inspection or certification prep",
    examples: "INSURV, IG, Command Inspection, certification events",
    isProject: true,
    projectFraming: "Preparing for one inspection is a project with a hard deadline and a pass/fail outcome.",
    processGroups: {
      initiating: ["Defined the inspection scope and readiness criteria"],
      planning: [
        "Built a deficiency tracking plan and preparation schedule",
        "Assigned responsibilities across work centers",
      ],
      executing: ["Led correction of deficiencies"],
      monitoringControlling: ["Tracked deficiency closure rates", "Reported status to leadership"],
      closing: ["Completed the inspection and documented results", "Captured lessons learned"],
    },
    pmiTerms: ["Quality management", "Scope", "Status reporting"],
  },
  {
    id: "range-safety",
    branches: ["army", "marine_corps"],
    label: "Range day or range safety officer",
    examples: "Qualification range, live-fire event",
    isProject: true,
    projectFraming:
      "Each range event you planned end to end is a small project. Standing RSO duty on someone else's event is support, not project leadership.",
    processGroups: {
      initiating: ["Defined qualification goals and throughput for the event"],
      planning: ["Built the range schedule, safety plan, and resource requests"],
      executing: ["Ran the range and directed safety personnel"],
      monitoringControlling: ["Monitored safety compliance and throughput"],
      closing: ["Reported qualification results and closed out the range"],
    },
    pmiTerms: ["Risk management", "Resource management", "Compliance"],
  },
  {
    id: "system-install",
    label: "Equipment or IT system installation",
    examples: "Network refresh, new radio fielding, software rollout",
    isProject: true,
    projectFraming: "An installation or fielding with a target date and an end state is a project.",
    processGroups: {
      initiating: ["Confirmed the installation scope with stakeholders"],
      planning: ["Developed the installation schedule and cutover plan"],
      executing: ["Led the installation team", "Coordinated vendor or engineering support"],
      monitoringControlling: ["Tracked defects and schedule variance"],
      closing: ["Trained users and transferred to operations", "Wrote turnover documentation"],
    },
    pmiTerms: ["Work breakdown structure", "Cutover", "Transition to operations"],
  },
  {
    id: "event-ceremony",
    label: "Ceremony or major event",
    examples: "Change of command, ball, community event",
    isProject: true,
    projectFraming: "A one-time event with a budget, a date, and many stakeholders is a project.",
    processGroups: {
      initiating: ["Defined the event objectives and guest list with leadership"],
      planning: ["Built the budget, timeline, and task assignments"],
      executing: ["Led the event committee", "Managed vendors and logistics"],
      monitoringControlling: ["Tracked spending and task completion"],
      closing: ["Reconciled the budget and captured feedback"],
    },
    pmiTerms: ["Budget", "Stakeholder management", "Communications plan"],
  },
  {
    id: "training-program",
    label: "Standing up a training or qualification program",
    examples: "New qualification syllabus, training pipeline redesign",
    isProject: true,
    projectFraming: "Building the program is the project. Running it afterwards is operations.",
    processGroups: {
      initiating: ["Identified the capability gap and success measures"],
      planning: ["Designed the curriculum and rollout plan"],
      executing: ["Developed materials and trained instructors"],
      monitoringControlling: ["Measured qualification rates against targets"],
      closing: ["Handed the program to its owner with documentation"],
    },
    pmiTerms: ["Requirements", "Deliverables", "Transition"],
  },
  {
    id: "motor-pool",
    branches: ["army", "marine_corps"],
    label: "Motor pool or maintenance management",
    examples: "PMCS, services, maintenance scheduling",
    isProject: false,
    projectFraming:
      "Day-to-day maintenance is operations. The project inside it is a time-bound push, such as clearing a services backlog or raising fleet readiness to a target by a date.",
    processGroups: {
      initiating: ["Defined a readiness target and deadline with leadership"],
      planning: ["Built a services schedule and parts plan to hit the target"],
      executing: ["Led mechanics and coordinated parts support"],
      monitoringControlling: ["Tracked readiness rate and backlog weekly"],
      closing: ["Reported the readiness gain and handed off to routine maintenance"],
    },
    pmiTerms: ["Operations vs. projects", "Resource leveling", "Performance measurement"],
  },
  {
    id: "watchbill",
    branches: ["navy", "coast_guard"],
    label: "Watchbill or duty roster management",
    examples: "Watchbill, duty roster, staffing schedules",
    isProject: false,
    projectFraming:
      "Maintaining a watchbill is operations and does not count. Redesigning the watch rotation or qualification structure, with a start and finish, does.",
    processGroups: {
      initiating: ["Identified the staffing problem and goals for a new rotation"],
      planning: ["Designed the new rotation and qualification plan"],
      executing: ["Implemented the rotation and briefed watchstanders"],
      monitoringControlling: ["Measured coverage gaps and fatigue indicators"],
      closing: ["Transitioned the new rotation to routine use"],
    },
    pmiTerms: ["Resource management", "Change management"],
  },
  {
    id: "supply-inventory",
    label: "Supply, inventory, or property accountability",
    examples: "100% inventory, equipment turn-in, budget execution",
    isProject: false,
    projectFraming:
      "Routine accountability is operations. A one-time wall-to-wall inventory, turn-in, or reconciliation with a deadline is a project.",
    processGroups: {
      initiating: ["Defined the inventory scope and deadline"],
      planning: ["Planned teams, sequence, and reconciliation method"],
      executing: ["Led inventory teams"],
      monitoringControlling: ["Tracked discrepancies to resolution"],
      closing: ["Reconciled records and reported results"],
    },
    pmiTerms: ["Scope", "Quality control", "Reconciliation"],
  },
  {
    id: "readiness-exercise",
    branches: ["air_force", "space_force"],
    label: "Readiness exercise or generation event",
    examples: "Wing readiness exercise, Agile Combat Employment exercise, mobility or generation exercise",
    isProject: true,
    projectFraming:
      "A single readiness exercise has a start date, a scenario, an objective, and a graded result, so it is a project. Day-to-day readiness reporting is operations.",
    processGroups: {
      initiating: ["Defined exercise objectives and success criteria with leadership"],
      planning: ["Built the exercise timeline, scenario plan, and resource requirements"],
      executing: ["Led the exercise control team and coordinated participating units"],
      monitoringControlling: ["Tracked timelines and readiness measures against the objectives"],
      closing: ["Delivered the out-brief and tracked corrective actions to closure"],
    },
    pmiTerms: ["Success criteria", "Stakeholder engagement", "Lessons learned"],
  },
  {
    id: "sar-program",
    branches: ["coast_guard"],
    label: "Search and rescue (SAR) exercise or program",
    examples: "SAREX planning, boat crew qualification program, SAR readiness push",
    isProject: false,
    projectFraming:
      "Standing SAR duty and individual cases are operations, and PMI will not count them. Planning a SAR exercise or standing up a qualification program, with a start and finish, is a project.",
    processGroups: {
      initiating: ["Defined the exercise or program goals with the command and partner agencies"],
      planning: ["Planned scenarios, crews, assets, and the safety plan"],
      executing: ["Led crews and coordinated with partner agencies"],
      monitoringControlling: ["Tracked qualification progress and exercise timelines"],
      closing: ["Ran the debrief and documented lessons learned"],
    },
    pmiTerms: ["Stakeholder engagement", "Risk management", "Lessons learned"],
  },
];

export interface MapperSelection {
  dutyId: string;
  months: number;
}

/** Duties typical for the member's branch first, then those common to every branch, then the rest. */
export function dutiesFor(branch: Branch | null): MilitaryDuty[] {
  const rank = (duty: MilitaryDuty) => (!duty.branches ? 1 : branch && duty.branches.includes(branch) ? 0 : 2);
  return [...MILITARY_DUTIES].sort((a, b) => rank(a) - rank(b));
}

export function coverageFor(selections: readonly MapperSelection[]): Record<ProcessGroupKey, number> {
  const coverage: Record<ProcessGroupKey, number> = {
    initiating: 0,
    planning: 0,
    executing: 0,
    monitoringControlling: 0,
    closing: 0,
  };
  for (const selection of selections) {
    const duty = MILITARY_DUTIES.find((item) => item.id === selection.dutyId);
    if (!duty) continue;
    for (const key of Object.keys(coverage) as ProcessGroupKey[]) {
      if (duty.processGroups[key].length > 0) coverage[key] += 1;
    }
  }
  return coverage;
}

/**
 * Sum of months entered, capped at PMI's 10-year window. Overlapping months
 * count once with PMI, so the UI tells members to enter non-overlapping time.
 */
export function totalMapperMonths(
  selections: readonly MapperSelection[],
  windowMonths = PMP_EXPERIENCE_WINDOW_YEARS * 12,
): number {
  const total = selections.reduce((sum, selection) => sum + Math.max(0, Math.floor(selection.months)), 0);
  return Math.min(total, windowMonths);
}
