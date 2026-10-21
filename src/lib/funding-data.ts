/**
 * Branch funding workflows for CAPM / PMP exam fees. Program rules change
 * every fiscal year, so each workflow links to the official site and the UI
 * tells members to confirm details with their Education Services Officer.
 * Durations are typical ranges, not guarantees.
 */

import type { Branch } from "./translation-schema";

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
  /** Prepaid programs pay the vendor; reimbursement programs pay you back after an approved authorization. */
  paymentModel: "prepaid" | "reimbursement";
  paymentNote: string;
  eligibilityHighlights: string[];
  steps: FundingStep[];
  watchOuts: string[];
}

export const FUNDING_WARNING =
  "CRITICAL: Do NOT schedule or pay for the exam before you receive your service's approved voucher or funding authorization. No COOL program reimburses expenses taken on before approval.";

/** Space Force Guardians use the Air Force program. */
export function fundingProgramFor(branch: Branch): FundingProgramId {
  return branch === "space_force" ? "air_force" : branch;
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
    paymentModel: "prepaid",
    paymentNote: "Navy COOL pays the credentialing body directly. You never pay the exam fee yourself.",
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
    portalName: "ArmyIgnitED Credentialing Assistance (CA)",
    officialUrl: "https://www.cool.osd.mil/army/",
    portalUrl: "https://www.armyignited.army.mil/",
    paymentModel: "prepaid",
    paymentNote: "Army CA pays the vendor through ArmyIgnitED. You never pay the exam fee yourself.",
    eligibilityHighlights: [
      "CAPM or PMP appears on Army COOL",
      "First-time CA users: complete MILGEARS, then CA 101 with the CA Virtual Counseling Cell, before requesting a CA goal",
      "Request at least 45 days before the exam or course start date, and no more than 90 days ahead",
      "The request must include the exam. Training-only requests are not funded",
      "Funding depends on fiscal-year availability and the current per-year limits",
    ],
    steps: [
      {
        id: "army-cool",
        title: "Find the credential on Army COOL",
        owner: "You",
        typicalDuration: "15 minutes",
        detail:
          "Confirm CAPM or PMP is listed and note any training CA can fund toward your 23 or 35 education hours, since the exam has to be part of the same request.",
        documents: ["Army COOL credential page"],
      },
      {
        id: "army-counsel",
        title: "MILGEARS, CA 101, and your CA goal",
        owner: "Education Office",
        typicalDuration: "1 to 7 days",
        detail:
          "First-time users complete a MILGEARS profile, then CA 101 with the CA Virtual Counseling Cell. That unlocks a CA goal in ArmyIgnitED for the credential.",
        documents: ["MILGEARS profile", "CA 101 completion"],
      },
      PMI_APPLICATION_STEP,
      {
        id: "army-request",
        title: "Submit the CA request in ArmyIgnitED",
        owner: "You",
        typicalDuration: "45 to 90 days before the start date",
        detail:
          "Request the exam (plus any training) at least 45 days before the start date and no more than 90 days ahead. Pick an exam date first, but do not book or pay for it.",
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
      "The 45-day lead time is the most common reason requests bounce. Count back from your exam date.",
      "Per-year CA limits and the number of credentials you can fund per year have changed between fiscal years. Confirm the current rules on Army COOL.",
      "Starting an exam before approval means you pay out of pocket.",
    ],
  },
  air_force: {
    id: "air_force",
    name: "Air Force COOL (Air Force and Space Force)",
    shortName: "AF COOL",
    portalName: "Air Force Virtual Education Center (AFVEC)",
    officialUrl: "https://www.cool.osd.mil/usaf/",
    portalUrl: "https://afvec.us.af.mil/",
    paymentModel: "prepaid",
    paymentNote: "AF COOL pays the vendor against your approved funding request. You never pay the exam fee yourself.",
    eligibilityHighlights: [
      "Enlisted Airmen and Guardians (officers: confirm eligibility with your education office)",
      "Active duty: 5-skill level in your primary AFSC, no UIF or control roster, current fitness assessment",
      "An approved credentialing goal in AFVEC with supervisor approval",
      "Lifetime cap of $4,500 per member",
      "The credential must be completed while you are on active duty",
    ],
    steps: [
      {
        id: "af-cool",
        title: "Check AF COOL for your AFSC",
        owner: "You",
        typicalDuration: "15 minutes",
        detail:
          "Confirm CAPM or PMP is fundable for your AFSC or category and note how much of your $4,500 lifetime cap is left.",
        documents: ["AF COOL credential page"],
      },
      PMI_APPLICATION_STEP,
      {
        id: "af-goal",
        title: "Create your credentialing goal in AFVEC",
        owner: "You",
        typicalDuration: "20 minutes",
        detail: "Set up the CAPM or PMP goal in AFVEC and upload the supporting documents it asks for.",
        documents: ["PMI eligibility details", "Supporting documents AFVEC requests"],
      },
      {
        id: "af-supervisor",
        title: "Supervisor approves the goal",
        owner: "Command",
        typicalDuration: "Several days",
        detail: "Your supervisor approves the goal in AFVEC. Funding requests unlock after approval.",
        documents: ["Goal approval"],
      },
      {
        id: "af-funding",
        title: "Submit one funding request per item",
        owner: "You",
        typicalDuration: "Processed first in, first out",
        detail:
          "Create a separate funding request for each item (the exam, and books if you want them), each matching the price quote you uploaded.",
        documents: ["Price quote for each item"],
      },
      SCHEDULE_STEP,
      {
        id: "af-report",
        title: "Report your result within 120 days",
        owner: "You",
        typicalDuration: "Within 120 days of the exam",
        detail: "Submit your score report or certificate to the AF COOL office to close the funding record.",
        documents: ["Exam score report or certificate"],
      },
    ],
    watchOuts: [
      "If you fail the exam, you repay the cost. Book the exam only when your practice scores are consistently passing.",
      "Results not submitted within 120 days of the test can be recouped.",
      "There is no separate Space Force program: Guardians use AF COOL.",
    ],
  },
  marine_corps: {
    id: "marine_corps",
    name: "Marine Corps COOL",
    shortName: "MC COOL",
    portalName: "Marine Corps COOL pre-paid voucher request",
    officialUrl: "https://www.cool.osd.mil/usmc/",
    portalUrl: "https://www.cool.osd.mil/usmc/",
    paymentModel: "prepaid",
    paymentNote: "Marine Corps COOL issues a pre-paid voucher. It never reimburses an exam fee you paid yourself.",
    eligibilityHighlights: [
      "Enlisted Marines (officers: confirm eligibility with your education office)",
      "Six months or more left on your enlistment when the voucher is issued",
      "An approved voucher before you start, schedule, or pay for anything",
      "Exam taken within 60 days of the voucher being funded",
      "Marines do not use the Navy's OPNAV 1500/57",
    ],
    steps: [
      {
        id: "usmc-cool",
        title: "Confirm eligibility on Marine Corps COOL",
        owner: "You",
        typicalDuration: "15 minutes",
        detail: "Find CAPM or PMP and confirm it is fundable for your MOS or category.",
        documents: ["MC COOL credential page"],
      },
      PMI_APPLICATION_STEP,
      {
        id: "usmc-provider",
        title: "Confirm the exam provider accepts the voucher",
        owner: "You",
        typicalDuration: "1 day",
        detail: "Check with PMI's exam provider that you can test with an MC COOL voucher in the next 60 days.",
        documents: ["Target exam window"],
      },
      {
        id: "usmc-request",
        title: "Submit the MC COOL voucher request form",
        owner: "You",
        typicalDuration: "20 minutes",
        detail:
          "Download the current voucher request form from Marine Corps COOL, fill it in, and send it to the Credentials Program Office at the address printed on the form.",
        documents: ["MC COOL voucher request form", "PMI eligibility details"],
      },
      {
        id: "usmc-approve",
        title: "Credentials Program Office approves the voucher",
        owner: "COOL Office",
        typicalDuration: "Varies, first come, first served",
        detail: "Do not schedule until the approved voucher arrives. Funding is first come, first served.",
        documents: ["Approved voucher"],
      },
      { ...SCHEDULE_STEP, typicalDuration: "Within 60 days of funding" },
      {
        id: "usmc-report",
        title: "Report your result, pass or fail",
        owner: "You",
        typicalDuration: "Right after the exam",
        detail: "Send your result to the MC COOL mailbox, your supervisor, and your Local Approving Official.",
        documents: ["Exam score report or certificate"],
      },
    ],
    watchOuts: [
      "The voucher covers exam, recertification, and maintenance fees only, not training or study materials.",
      "Report your result even if you fail. Unreported results block future funding.",
    ],
  },
  coast_guard: {
    id: "coast_guard",
    name: "Coast Guard Credentialing Assistance",
    shortName: "CG COOL",
    portalName: "MyCG Ed (ETQC Credentialing Assistance Authorization)",
    officialUrl: "https://www.cool.osd.mil/uscg/",
    portalUrl:
      "https://forcecom.uscg.mil/Our-Organization/FORCECOM-UNITS/ETQC/Coast-Guard-Credentialing-Online-COOL/-Steps-to-Apply",
    paymentModel: "reimbursement",
    paymentNote:
      "Coast Guard Credentialing Assistance reimburses you. Pay the fee only after ETQC issues your CA Authorization, then claim it back with your receipt and an OF-1164 within 30 days.",
    eligibilityHighlights: [
      "At least 6 months left on your service obligation",
      "Not marked Not Recommended on your most recent evaluation",
      "Apply in MyCG Ed at least 14 days before the exam or any fee (the program recommends 30)",
      "Up to $4,500 per fiscal year, first come, first served",
      "One application per year, so include every fee for the credential",
    ],
    steps: [
      {
        id: "uscg-cool",
        title: "Confirm the credential on CG COOL",
        owner: "You",
        typicalDuration: "15 minutes",
        detail: "Find CAPM or PMP on Coast Guard COOL and note every fee you will need in the one application.",
        documents: ["CG COOL credential page"],
      },
      PMI_APPLICATION_STEP,
      {
        id: "uscg-apply",
        title: "Apply for Credentialing Assistance in MyCG Ed",
        owner: "You",
        typicalDuration: "30 days before the exam",
        detail:
          "Submit the application with every fee for the credential at least 14 days, ideally 30, before the exam.",
        documents: ["PMI eligibility details", "Fee amounts"],
      },
      {
        id: "uscg-eso",
        title: "Education Services Officer approval",
        owner: "Education Office",
        typicalDuration: "Several days",
        detail: "Your ESO approves the application for your command.",
        documents: ["ESO approval"],
      },
      {
        id: "uscg-authorization",
        title: "ETQC issues your CA Authorization",
        owner: "COOL Office",
        typicalDuration: "Varies",
        detail: "ETQC reviews the application and issues the Credentialing Assistance Authorization in MyCG Ed.",
        documents: ["CA Authorization"],
      },
      {
        id: "uscg-pay",
        title: "Pay and schedule, only after authorization",
        owner: "You",
        typicalDuration: "Within the authorized window",
        detail:
          "With the CA Authorization in hand, pay PMI and book the exam. Keep the receipt: you need it for reimbursement.",
        documents: ["Payment receipt"],
      },
      {
        id: "uscg-reimburse",
        title: "Claim reimbursement within 30 days",
        owner: "You",
        typicalDuration: "Within 30 days of paying",
        detail:
          "Upload the receipt and an electronically endorsed OF-1164 (printed from your authorized application) to MyCG Ed.",
        documents: ["Receipt", "OF-1164"],
      },
      {
        id: "uscg-report",
        title: "Report your result",
        owner: "You",
        typicalDuration: "Within 90 days of authorization",
        detail:
          "Report pass or fail within 90 days of the authorization, and upload the credential within 30 days of earning it.",
        documents: ["Exam score report", "Credential copy"],
      },
    ],
    watchOuts: [
      "Paying before the CA Authorization is issued means the fee is not reimbursed.",
      "Miss the 30-day OF-1164 deadline and you lose the reimbursement.",
      "If you fail after being reimbursed, you cannot request CA for the same credential the next fiscal year.",
      "The published guidance (COMDTINST 1540.10) dates from 2022. Confirm current limits with ETQC.",
    ],
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
