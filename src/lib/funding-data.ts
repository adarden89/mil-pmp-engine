/**
 * Branch funding workflows for CAPM / PMP exam fees. Program rules change
 * every fiscal year, so each workflow links to the official site and the UI
 * tells members to confirm details with their Education Services Officer.
 * Durations are typical ranges, not guarantees.
 */

export const FUNDING_PROGRAM_IDS = ["navy", "army", "air_force", "marine_corps", "coast_guard"] as const;
export type FundingProgramId = (typeof FUNDING_PROGRAM_IDS)[number];

export type StepOwner = "You" | "Command" | "Education Office" | "PMI" | "COOL Office";

export interface FundingStep {
  id: string;
  title: string;
  owner: StepOwner;
  typicalDuration: string;
  detail: string;
  documents: string[];
}

export interface FundingProgram {
  id: FundingProgramId;
  name: string;
  shortName: string;
  portalName: string;
  officialUrl: string;
  portalUrl: string;
  eligibilityHighlights: string[];
  steps: FundingStep[];
  watchOuts: string[];
}

const PMI_APPLICATION_STEP: FundingStep = {
  id: "pmi-application",
  title: "Submit your PMI application",
  owner: "You",
  typicalDuration: "5 business days for PMI review (longer if audited)",
  detail:
    "Create a PMI account, enter your education hours and (for PMP) your project experience. Use the Translation Studio so each project description is in civilian language with a named verifier. PMI's approval gives you the eligibility needed to schedule the exam.",
  documents: [
    "Certificate for 23 hours (CAPM) or 35 hours (PMP) of PM education",
    "Project descriptions with dates and a verifier for each (PMP)",
  ],
};

const SCHEDULE_STEP: FundingStep = {
  id: "schedule-exam",
  title: "Schedule and sit the exam",
  owner: "You",
  typicalDuration: "Book within the voucher's validity window",
  detail:
    "Schedule with PMI's exam provider using the funded payment. Vouchers and funded authorizations expire, so book a date you can keep before you request funding.",
  documents: ["PMI eligibility confirmation", "Government-issued ID matching your PMI profile"],
};

export const FUNDING_PROGRAMS: Record<FundingProgramId, FundingProgram> = {
  navy: {
    id: "navy",
    name: "Navy Credentialing Opportunities On-Line",
    shortName: "Navy COOL",
    portalName: "OPNAV 1500/57 (Certification & License Funding Request)",
    officialUrl: "https://www.cool.osd.mil/usn/",
    portalUrl: "https://www.cool.osd.mil/usn/",
    eligibilityHighlights: [
      "Credential is mapped to your rating, designator, collateral duty, or out-of-rate assignment",
      "Passed your most recent advancement exam and physical fitness assessment (or have a waiver)",
      "Enlisted: EAOS more than 2 months after Navy COOL receives your OPNAV 1500/57",
      "Exam and fees completed at least 60 days before separation (waivable to 30 days)",
      "Command approval of the OPNAV 1500/57 before you register for the exam or pay anything",
      "Officers: Navy COOL's officer funding pilot ended; confirm current-year funding first",
    ],
    steps: [
      {
        id: "navy-map",
        title: "Confirm PMP or CAPM is mapped to you",
        owner: "You",
        typicalDuration: "15 minutes",
        detail:
          "Search CAPM and PMP on Navy COOL and open your rating or designator page. Funding follows the mapping, so screenshot the page showing the credential is mapped to you.",
        documents: ["Navy COOL credential page screenshot"],
      },
      {
        id: "navy-jst",
        title: "Audit your Joint Services Transcript",
        owner: "You",
        typicalDuration: "30 minutes",
        detail:
          "Pull your JST and confirm your schools, leadership courses, and recommended credit are complete. Leadership and management courses support your PM education hours and your experience narrative.",
        documents: ["Current JST (PDF)", "Training completion certificates"],
      },
      PMI_APPLICATION_STEP,
      {
        id: "navy-request",
        title: "Complete OPNAV 1500/57",
        owner: "You",
        typicalDuration: "30 minutes",
        detail:
          "Download the current OPNAV 1500/57 (Rev. 01 May 2026) from Navy COOL and fill it in. The Fast-Track prep packet lists every piece of information to have ready. This form funds exam and license fees only, not courses.",
        documents: ["PMI eligibility details", "Exam fee amount", "Approving official's name and email"],
      },
      {
        id: "navy-approval",
        title: "Route it through your chain of command",
        owner: "Command",
        typicalDuration: "Several days to 2 weeks",
        detail:
          "Your approving official validates the form for completeness and confirms you are eligible and ready to test. The command then emails the approved form to the Navy COOL Program Office at the address printed on the current form. Funding is first-come, first-served and can run short late in the fiscal year.",
        documents: ["Command-approved OPNAV 1500/57"],
      },
      {
        id: "navy-voucher",
        title: "Navy COOL issues payment",
        owner: "COOL Office",
        typicalDuration: "Varies with request volume",
        detail:
          "Navy COOL pays the credentialing body directly. Watch your email for the voucher or payment confirmation and its expiration date.",
        documents: ["Voucher or payment confirmation"],
      },
      SCHEDULE_STEP,
      {
        id: "navy-report",
        title: "Report your result",
        owner: "You",
        typicalDuration: "Within the reporting window in your approval",
        detail:
          "Upload or report your exam result as your approval instructs. Unreported results can block future Navy COOL funding.",
        documents: ["Exam score report or certificate"],
      },
    ],
    watchOuts: [
      "Navy COOL does not reimburse out-of-pocket payments. Never pay the exam fee yourself, even to hold a seat.",
      "Requesting funding before PMI approves your application can expire the voucher.",
      "End-of-fiscal-year funding often runs short. Submit early in the year.",
    ],
  },
  army: {
    id: "army",
    name: "Army Credentialing Assistance",
    shortName: "Army CA",
    portalName: "ArmyIgnitED",
    officialUrl: "https://www.cool.osd.mil/army/",
    portalUrl: "https://www.armyignited.army.mil/",
    eligibilityHighlights: [
      "Credential appears on Army COOL",
      "Completed the CA prerequisites in ArmyIgnitED (counseling and required briefings)",
      "Supervisor approval of the request",
      "Within your annual TA/CA funding ceiling",
    ],
    steps: [
      {
        id: "army-cool",
        title: "Find the credential on Army COOL",
        owner: "You",
        typicalDuration: "15 minutes",
        detail:
          "Confirm CAPM or PMP is listed and note any training courses Army CA can also fund toward your education hours.",
        documents: ["Army COOL credential page"],
      },
      {
        id: "army-counsel",
        title: "Complete CA prerequisites in ArmyIgnitED",
        owner: "Education Office",
        typicalDuration: "1 to 7 days",
        detail:
          "Finish the required counseling and briefings with your Army Education Center before the request button unlocks.",
        documents: ["Education counseling record"],
      },
      PMI_APPLICATION_STEP,
      {
        id: "army-request",
        title: "Submit the CA request in ArmyIgnitED",
        owner: "You",
        typicalDuration: "Submit well before your exam date",
        detail:
          "Request the exam (and any training) in ArmyIgnitED. Requests need lead time before the start date, so do not schedule the exam first.",
        documents: ["Vendor quote or exam fee", "PMI eligibility details"],
      },
      {
        id: "army-approve",
        title: "Supervisor and Education Center approval",
        owner: "Command",
        typicalDuration: "Several days",
        detail: "Your supervisor approves, then the Education Center funds the request.",
        documents: ["Approval notification"],
      },
      SCHEDULE_STEP,
      {
        id: "army-close",
        title: "Close out the request",
        owner: "You",
        typicalDuration: "Within the close-out window",
        detail: "Upload your result in ArmyIgnitED. Failing to report can create a debt or block future CA.",
        documents: ["Exam score report or certificate"],
      },
    ],
    watchOuts: [
      "CA and Tuition Assistance share an annual ceiling. Confirm your remaining balance first.",
      "Starting an exam before approval usually means you pay out of pocket.",
    ],
  },
  air_force: {
    id: "air_force",
    name: "Air Force COOL",
    shortName: "AF COOL",
    portalName: "Air Force Virtual Education Center (AFVEC)",
    officialUrl: "https://www.cool.osd.mil/usaf/",
    portalUrl: "https://afvec.us.af.mil/",
    eligibilityHighlights: [
      "Credential is listed on AF COOL for your AFSC or an approved category",
      "Supervisor and education office approval",
      "Within the program's funding limits",
      "Space Force Guardians: confirm the current process with your education office",
    ],
    steps: [
      {
        id: "af-cool",
        title: "Check AF COOL for your AFSC",
        owner: "You",
        typicalDuration: "15 minutes",
        detail: "Confirm CAPM or PMP is fundable for your AFSC or category and note the funding limit.",
        documents: ["AF COOL credential page"],
      },
      PMI_APPLICATION_STEP,
      {
        id: "af-request",
        title: "Submit the AF COOL application in AFVEC",
        owner: "You",
        typicalDuration: "20 minutes to submit",
        detail: "Apply in AFVEC for exam funding. Attach your PMI eligibility details and the exam fee.",
        documents: ["PMI eligibility details", "Exam fee amount"],
      },
      {
        id: "af-approve",
        title: "Supervisor and education office approval",
        owner: "Education Office",
        typicalDuration: "Several days to 2 weeks",
        detail: "Your supervisor endorses and the education office approves funding.",
        documents: ["Approval notification"],
      },
      SCHEDULE_STEP,
      {
        id: "af-report",
        title: "Report your result in AFVEC",
        owner: "You",
        typicalDuration: "Within the reporting window",
        detail: "Upload your result to close the funding record.",
        documents: ["Exam score report or certificate"],
      },
    ],
    watchOuts: ["AF COOL has had lifetime funding limits. Confirm the current limit before choosing paid prep."],
  },
  marine_corps: {
    id: "marine_corps",
    name: "Marine Corps COOL",
    shortName: "USMC COOL",
    portalName: "Marine Corps COOL",
    officialUrl: "https://www.cool.osd.mil/usmc/",
    portalUrl: "https://www.cool.osd.mil/usmc/",
    eligibilityHighlights: [
      "Credential is related to your MOS or approved for leadership and professional development",
      "Command and education office approval",
      "Within current funding limits",
    ],
    steps: [
      {
        id: "usmc-cool",
        title: "Confirm eligibility on Marine Corps COOL",
        owner: "You",
        typicalDuration: "15 minutes",
        detail: "Find CAPM or PMP and confirm it is fundable for your MOS or category.",
        documents: ["USMC COOL credential page"],
      },
      PMI_APPLICATION_STEP,
      {
        id: "usmc-request",
        title: "Submit the voucher request",
        owner: "You",
        typicalDuration: "20 minutes",
        detail: "Submit the request through Marine Corps COOL with your PMI eligibility details.",
        documents: ["PMI eligibility details"],
      },
      {
        id: "usmc-approve",
        title: "Command and education office approval",
        owner: "Command",
        typicalDuration: "Several days to 2 weeks",
        detail: "Your command endorses and the program funds the exam.",
        documents: ["Approval notification"],
      },
      SCHEDULE_STEP,
    ],
    watchOuts: ["Confirm current rules with your Education Center. USMC COOL guidance changes by fiscal year."],
  },
  coast_guard: {
    id: "coast_guard",
    name: "Coast Guard COOL",
    shortName: "USCG COOL",
    portalName: "Coast Guard COOL",
    officialUrl: "https://www.cool.osd.mil/uscg/",
    portalUrl: "https://www.cool.osd.mil/uscg/",
    eligibilityHighlights: [
      "Credential is mapped to your rating or approved category",
      "Command endorsement",
      "Within current funding limits",
    ],
    steps: [
      {
        id: "uscg-cool",
        title: "Confirm the mapping on Coast Guard COOL",
        owner: "You",
        typicalDuration: "15 minutes",
        detail: "Find CAPM or PMP and confirm it is fundable for your rating.",
        documents: ["USCG COOL credential page"],
      },
      PMI_APPLICATION_STEP,
      {
        id: "uscg-request",
        title: "Submit the funding request",
        owner: "You",
        typicalDuration: "20 minutes",
        detail: "Submit through Coast Guard COOL with your command's endorsement.",
        documents: ["PMI eligibility details", "Command endorsement"],
      },
      SCHEDULE_STEP,
    ],
    watchOuts: ["Confirm current rules with your Education Services Officer."],
  },
};

export const SHARED_RESOURCES = [
  { label: "DoD COOL (all services)", href: "https://www.cool.osd.mil/" },
  { label: "Joint Services Transcript", href: "https://jst.doded.mil/" },
  { label: "PMI: PMP certification", href: "https://www.pmi.org/certifications/project-management-pmp" },
  { label: "PMI: CAPM certification", href: "https://www.pmi.org/certifications/certified-associate-capm" },
] as const;

export function isFundingProgramId(value: unknown): value is FundingProgramId {
  return typeof value === "string" && (FUNDING_PROGRAM_IDS as readonly string[]).includes(value);
}
