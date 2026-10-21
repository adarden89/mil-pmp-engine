/**
 * Trainer and study-tool directory. One list feeds both the funding page's
 * education section and the Study Vault, so details never drift apart.
 * No affiliate links. Course details change often; each entry says what to
 * confirm before paying.
 */

export type ResourceCategory = "course" | "practice" | "official" | "reference" | "military";
export type ResourceSurface = "education" | "vault";

export interface StudyResource {
  id: string;
  name: string;
  provider: string;
  category: ResourceCategory;
  featuredIn: readonly ResourceSurface[];
  url: string;
  cost: string;
  bestFor: string;
  breakdown: string[];
  /** Short highlight shown as a badge, e.g. "#1 exam simulator". */
  highlight?: string;
  caution?: string;
}

export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  course: "Contact-hour courses",
  practice: "Practice exams",
  official: "Official PMI",
  reference: "Reference",
  military: "Military programs",
};

export const RESOURCES: readonly StudyResource[] = [
  {
    id: "ramdayal-udemy",
    name: "PMP Certification Exam Prep Course (35 Contact Hours)",
    provider: "Andrew Ramdayal · TIA Education on Udemy",
    category: "course",
    featuredIn: ["education", "vault"],
    url: "https://www.udemy.com/courses/search/?q=andrew%20ramdayal%20pmp",
    cost: "Low cost during frequent Udemy sales",
    bestFor: "Earning the 35 contact hours and learning the PMP mindset",
    highlight: "35 contact hour certificate",
    breakdown: [
      "Issues a certificate for the 35 contact hours the PMP application requires.",
      "Known for teaching the situational 'PMP mindset' behind most exam questions.",
      "Pair it with a simulator; the course alone is not enough practice.",
    ],
    caution: "Confirm the course version targets the exam launched July 9, 2026 before enrolling.",
  },
  {
    id: "phillips-udemy",
    name: "PMP Exam Prep Seminar: Complete Exam Coverage with 35 PDUs",
    provider: "Joseph Phillips on Udemy",
    category: "course",
    featuredIn: ["education", "vault"],
    url: "https://www.udemy.com/courses/search/?q=joseph%20phillips%20pmp%20exam%20prep%20seminar",
    cost: "Low cost during frequent Udemy sales",
    bestFor: "A structured, lecture-style walk through every exam topic",
    highlight: "35 contact hours",
    breakdown: [
      "Long-running, widely used seminar-style course from a veteran PM author.",
      "Completing every assignment is required to claim the 35 contact hours.",
      "Good second perspective if one instructor's style does not click.",
    ],
    caution: "Some listings still reference older exam outlines. Check the last-updated date on Udemy.",
  },
  {
    id: "onward-to-opportunity",
    name: "Onward to Opportunity (O2O)",
    provider: "Syracuse University IVMF",
    category: "military",
    featuredIn: ["education", "vault"],
    url: "https://ivmf.syracuse.edu/",
    cost: "Free for eligible service members, veterans, and spouses",
    bestFor: "Transitioning members who want structured, no-cost training",
    highlight: "Free military pathway",
    breakdown: [
      "Career training tracks that have included project management certification prep.",
      "Check the current catalog and your eligibility window before you enroll.",
    ],
  },
  {
    id: "pmi-study-hall",
    name: "PMI Study Hall (Essentials / Plus)",
    provider: "PMI",
    category: "practice",
    featuredIn: ["vault"],
    url: "https://www.pmi.org/shop",
    cost: "Paid 3-month subscription",
    bestFor: "Practice questions written by the organization that writes the exam",
    highlight: "#1 recommended exam simulator",
    breakdown: [
      "Full-length timed practice exams plus mini-exams and extra question banks.",
      "Plus adds more full exams and mini-exams than Essentials.",
      "Take at least one full exam under real timing about two weeks before test day.",
    ],
    caution: "Buy the version aligned to the July 2026 exam; some product pages still describe the previous exam.",
  },
  {
    id: "pocket-prep",
    name: "Pocket Prep (PMP & CAPM)",
    provider: "Pocket Prep",
    category: "practice",
    featuredIn: ["vault"],
    url: "https://www.pocketprep.com/",
    cost: "Free tier, paid premium",
    bestFor: "Ten-minute drills on watch, in the field, or in the barracks",
    highlight: "Best mobile study tool",
    breakdown: [
      "Mobile question banks for both the PMP and the CAPM, with explanations.",
      "Use its weak-area reports alongside the Study Vault retention tracker.",
      "Great for daily reps; weaker for full-length endurance practice.",
    ],
  },
  {
    id: "pmbok-8",
    name: "PMBOK Guide, Eighth Edition",
    provider: "PMI",
    category: "reference",
    featuredIn: ["vault"],
    url: "https://www.pmi.org/pmbok-guide",
    cost: "Free digital copy with PMI membership",
    bestFor: "Authoritative definitions and principles",
    breakdown: [
      "Published November 2025; it supersedes the Seventh Edition.",
      "Use it as a reference, not a cover-to-cover study plan.",
    ],
  },
  {
    id: "pmi-eco",
    name: "Exam Content Outlines (PMP and CAPM)",
    provider: "PMI",
    category: "official",
    featuredIn: ["vault"],
    url: "https://www.pmi.org/certifications",
    cost: "Free",
    bestFor: "Knowing exactly what is tested",
    breakdown: [
      "PMP (July 2026): People ~33%, Process ~41%, Business Environment ~26%.",
      "CAPM: Fundamentals 36%, Predictive 17%, Agile 20%, Business Analysis 27%.",
    ],
  },
  {
    id: "pmi-membership",
    name: "PMI membership",
    provider: "PMI",
    category: "official",
    featuredIn: ["vault"],
    url: "https://www.pmi.org/membership",
    cost: "Annual fee",
    bestFor: "Lowering the exam fee your voucher has to cover",
    breakdown: [
      "Members pay a lower exam fee, especially for the PMP.",
      "Check whether your COOL program will fund the member or the non-member fee.",
    ],
  },
];

export function resourcesFor(surface: ResourceSurface): readonly StudyResource[] {
  return RESOURCES.filter((resource) => resource.featuredIn.includes(surface));
}
