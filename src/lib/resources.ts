export type ResourceCategory = "official" | "practice" | "course" | "reference" | "military";

export interface StudyResource {
  id: string;
  name: string;
  provider: string;
  category: ResourceCategory;
  url: string;
  cost: string;
  bestFor: string;
  breakdown: string[];
  caution?: string;
}

export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  official: "Official PMI",
  practice: "Practice exams",
  course: "35-hour courses",
  reference: "Reference",
  military: "Military programs",
};

export const RESOURCES: readonly StudyResource[] = [
  {
    id: "pmi-eco",
    name: "PMP Examination Content Outline",
    provider: "PMI",
    category: "official",
    url: "https://www.pmi.org/certifications/project-management-pmp",
    cost: "Free",
    bestFor: "Knowing exactly what is tested",
    breakdown: [
      "The exam blueprint: domains, tasks, and enablers.",
      "The July 2026 outline weights People ~33%, Process ~41%, Business Environment ~26%.",
      "Read it first, then map every other resource back to it.",
    ],
  },
  {
    id: "pmi-study-hall",
    name: "PMI Study Hall",
    provider: "PMI",
    category: "practice",
    url: "https://www.pmi.org/shop",
    cost: "Paid subscription (Essentials or Plus tiers)",
    bestFor: "Question style closest to the real exam",
    breakdown: [
      "Full-length practice exams plus mini-exams and extra practice questions.",
      "Plus adds more full exams and mini-exams than Essentials.",
      "Take one full exam under timed conditions about two weeks out.",
    ],
    caution:
      "Make sure the version you buy is aligned to the exam launched July 9, 2026. Some product pages still describe prep for the older exam.",
  },
  {
    id: "pocket-prep",
    name: "Pocket Prep PMP",
    provider: "Pocket Prep",
    category: "practice",
    url: "https://www.pocketprep.com/",
    cost: "Free tier, paid premium",
    bestFor: "Short drills on watch, in the field, or between formations",
    breakdown: [
      "Mobile question bank with explanations.",
      "Use its weak-area reports alongside the Exam Vault retention tracker.",
      "Good for daily reps, weaker for full-length endurance practice.",
    ],
  },
  {
    id: "ramdayal-udemy",
    name: "Andrew Ramdayal PMP course",
    provider: "Udemy / TIA Education",
    category: "course",
    url: "https://www.udemy.com/courses/search/?q=andrew%20ramdayal%20pmp",
    cost: "Low cost on frequent Udemy sales",
    bestFor: "Earning the 35 contact hours and learning the PMI mindset",
    breakdown: [
      "Widely used course that issues a 35 contact hour certificate for the PMI application.",
      "Strong on the situational 'PMI mindset' that drives most questions.",
      "Check that the edition you enroll in targets the current exam outline.",
    ],
    caution: "Confirm with your service's COOL or CA office whether course costs are fundable before paying.",
  },
  {
    id: "pmbok-8",
    name: "PMBOK Guide, Eighth Edition",
    provider: "PMI",
    category: "reference",
    url: "https://www.pmi.org/pmbok-guide",
    cost: "Free digital copy with PMI membership",
    bestFor: "Authoritative definitions and principles",
    breakdown: [
      "Published November 2025; it supersedes the Seventh Edition.",
      "Use it as a reference, not a cover-to-cover study plan.",
      "Pair it with the Agile Practice Guide for adaptive topics.",
    ],
  },
  {
    id: "pmi-membership",
    name: "PMI membership",
    provider: "PMI",
    category: "official",
    url: "https://www.pmi.org/membership",
    cost: "Annual fee",
    bestFor: "Lowering the exam fee and getting PMI standards free",
    breakdown: [
      "Members pay a reduced exam fee, which often offsets the membership cost.",
      "Includes digital access to PMI standards.",
      "Check whether your COOL program will fund the member or non-member fee.",
    ],
  },
  {
    id: "onward-to-opportunity",
    name: "Onward to Opportunity (O2O)",
    provider: "Syracuse University IVMF",
    category: "military",
    url: "https://ivmf.syracuse.edu/",
    cost: "Free for eligible service members, veterans, and spouses",
    bestFor: "Transitioning members who want structured, no-cost training",
    breakdown: [
      "Career training tracks that have included project management certification prep.",
      "Check the current catalog and eligibility window before you enroll.",
    ],
  },
  {
    id: "dod-cool",
    name: "DoD COOL",
    provider: "Department of Defense",
    category: "military",
    url: "https://www.cool.osd.mil/",
    cost: "Free",
    bestFor: "Confirming credential mapping and funding rules for your service",
    breakdown: ["Hub for every service's COOL program.", "Shows which credentials map to your rating, MOS, or AFSC."],
  },
];
