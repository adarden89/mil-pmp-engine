/**
 * Third-party facts that change over time. Kept in one place with an as-of date
 * so they can be re-verified before each release. Sources: pmi.org, Navy COOL,
 * OPNAVINST 1540.56C, NAVADMIN 136/26.
 */

export const FACTS_AS_OF = "October 2026";

/** US exam fees in dollars. The PMP member fee changed in August 2026; confirm at pmi.org. */
export const EXAM_FEES = {
  CAPM: { member: 225, nonMember: 300 },
  PMP: { member: 445, nonMember: 675 },
} as const;

export const EDUCATION_HOURS = { CAPM: 23, PMP: 35 } as const;

/** Months of project leadership in the last 8 years, by education. */
export const PMP_EXPERIENCE_MONTHS = { secondary: 60, fourYearDegree: 36, gacDegree: 24 } as const;

export const NAVY_COOL = {
  portalUrl: "https://www.cool.osd.mil/usn/",
  formNumber: "OPNAV 1500/57",
  formTitle: "Certification & License Funding Request",
  formRevision: "01 May 2026",
  instruction: "OPNAVINST 1540.56C",
  /** Enlisted: EAOS must be more than this many months after Navy COOL receives the request. */
  minMonthsRemainingAtReceipt: 2,
  /** Credentialing activity must finish before this many days from separation (waivable to 30). */
  finishBeforeSeparationDays: 60,
  /** Navy COOL reported that its officer funding pilot concluded with no FY25 funding allocated. */
  officerFundingNote:
    "Navy COOL's officer funding pilot concluded and no officer funding was allocated for FY25. Confirm current-year officer funding with Navy COOL before planning around it.",
} as const;

export const BRANCH_PORTALS = {
  navy: { name: "Navy COOL", url: "https://www.cool.osd.mil/usn/" },
  army: { name: "Army IgnitED (Credentialing Assistance)", url: "https://www.armyignited.army.mil/" },
  air_force: { name: "Air Force COOL (via AFVEC)", url: "https://www.cool.osd.mil/usaf/" },
  marine_corps: { name: "Marine Corps COOL", url: "https://www.cool.osd.mil/usmc/" },
  coast_guard: { name: "Coast Guard COOL", url: "https://www.cool.osd.mil/uscg/" },
  space_force: {
    name: "Air Force COOL (Guardians: confirm with your education office)",
    url: "https://www.cool.osd.mil/usaf/",
  },
} as const;
