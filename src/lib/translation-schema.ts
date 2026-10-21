import { z } from "zod";

export const BRANCHES = ["navy", "army", "air_force", "marine_corps", "coast_guard", "space_force"] as const;
export type Branch = (typeof BRANCHES)[number];

export const BRANCH_LABELS: Record<Branch, string> = {
  navy: "U.S. Navy",
  army: "U.S. Army",
  air_force: "U.S. Air Force",
  marine_corps: "U.S. Marine Corps",
  coast_guard: "U.S. Coast Guard",
  space_force: "U.S. Space Force",
};

export const EVAL_SYSTEM_BY_BRANCH: Record<Branch, string> = {
  navy: "EVAL / FITREP",
  army: "NCOER / OER",
  air_force: "EPB / EPR / OPB",
  marine_corps: "FITREP / ProMark",
  coast_guard: "EER / OER",
  space_force: "EPB / OPB",
};

/**
 * The evaluation document the bullets came from. The Joint Services Transcript
 * is deliberately not here: it records training, which PMI never counts as
 * project experience, so it has its own optional context field.
 */
export const EVAL_SOURCES = [
  "navy_eval_fitrep",
  "army_ncoer",
  "army_oer",
  "af_epb_epr",
  "af_opb_opr",
  "usmc_fitrep",
  "uscg_eer",
  "uscg_oer",
  "award_citation",
  "other",
] as const;
export type EvalSource = (typeof EVAL_SOURCES)[number];

export const EVAL_SOURCE_META: Record<EvalSource, { label: string; hint: string; branches: readonly Branch[] | null }> =
  {
    navy_eval_fitrep: {
      label: "Navy EVAL / FITREP",
      hint: "Block 43 comments on performance",
      branches: ["navy"],
    },
    army_ncoer: { label: "Army NCOER", hint: "Rater and senior rater bullets", branches: ["army"] },
    army_oer: { label: "Army OER", hint: "Rater and senior rater narrative", branches: ["army"] },
    af_epb_epr: {
      label: "EPB / EPR",
      hint: "Performance statements or bullets",
      branches: ["air_force", "space_force"],
    },
    af_opb_opr: {
      label: "OPB / OPR",
      hint: "Performance statements or bullets",
      branches: ["air_force", "space_force"],
    },
    usmc_fitrep: { label: "Marine Corps FitRep", hint: "Section I comments", branches: ["marine_corps"] },
    uscg_eer: { label: "Coast Guard EER", hint: "Supervisor and marking official comments", branches: ["coast_guard"] },
    uscg_oer: { label: "Coast Guard OER", hint: "Reported-on officer comments", branches: ["coast_guard"] },
    award_citation: { label: "Award citation", hint: "NAM, ARCOM, AFAM, or similar write-up", branches: null },
    other: { label: "Other notes", hint: "Position description, memo, or your own notes", branches: null },
  };

/** Sources offered for a branch: its own evaluation forms first, then the cross-service ones. */
export function evalSourcesFor(branch: Branch): EvalSource[] {
  return EVAL_SOURCES.filter((source) => {
    const branches = EVAL_SOURCE_META[source].branches;
    return branches === null || branches.includes(branch);
  });
}

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export const translateRequestSchema = z
  .object({
    branch: z.enum(BRANCHES),
    evalSource: z.enum(EVAL_SOURCES).optional(),
    rateOrMos: z.string().trim().min(2, "Enter your rate, MOS, or AFSC.").max(120),
    billet: z.string().trim().min(2, "Enter your billet or duty title.").max(160),
    projectTitle: z.string().trim().min(3, "Give the project a working title.").max(160),
    startMonth: z.string().regex(monthPattern, "Use YYYY-MM."),
    endMonth: z.string().regex(monthPattern, "Use YYYY-MM."),
    teamSize: z.number().int().min(1).max(10000).optional(),
    rawBullets: z
      .string()
      .trim()
      .min(40, "Paste at least a few evaluation bullets (40+ characters).")
      .max(6000, "Keep raw bullets under 6,000 characters per project."),
    jstCourses: z.string().trim().max(2000, "Keep JST entries under 2,000 characters.").optional(),
  })
  .refine((value) => value.startMonth <= value.endMonth, {
    message: "End month must be on or after the start month.",
    path: ["endMonth"],
  });

export type TranslateRequest = z.infer<typeof translateRequestSchema>;

/**
 * Structured output Claude must return. Kept free of length/format constraints
 * so it stays inside the subset structured outputs supports; lengths are
 * enforced by the prompt and checked by the audit-density analyzer.
 */
export const translationResultSchema = z.object({
  civilianProjectTitle: z.string(),
  objective: z.string(),
  role: z.string(),
  deliverables: z.array(z.string()),
  outcome: z.string(),
  applicationSummary: z.string(),
  processGroups: z.object({
    initiating: z.array(z.string()),
    planning: z.array(z.string()),
    executing: z.array(z.string()),
    monitoringControlling: z.array(z.string()),
    closing: z.array(z.string()),
  }),
  jargonTranslations: z.array(z.object({ military: z.string(), civilian: z.string() })),
  auditFlags: z.array(z.string()),
  suggestedVerifier: z.string(),
});

export type TranslationResult = z.infer<typeof translationResultSchema>;

export type ProcessGroupKey = keyof TranslationResult["processGroups"];

export const PROCESS_GROUP_LABELS: Record<ProcessGroupKey, string> = {
  initiating: "Initiating",
  planning: "Planning",
  executing: "Executing",
  monitoringControlling: "Monitoring & Controlling",
  closing: "Closing",
};

export interface TranslateResponse {
  translation: TranslationResult;
  usage: { remaining: number; limit: number };
  /** Row id in saved_translations, or null when saving failed. */
  savedId: string | null;
}

/**
 * Progress protocol for POST /api/translate with `Accept: application/x-ndjson`.
 * Each line is one event. Stages report real work, so the terminal log in the
 * studio never shows a step the server has not started.
 */
export const TRANSLATE_STAGES = ["scrub", "map", "draft", "audit"] as const;
export type TranslateStage = (typeof TRANSLATE_STAGES)[number];

export type TranslateStreamEvent =
  | { type: "stage"; stage: TranslateStage; status: "running" | "done"; message: string }
  | { type: "log"; stage: TranslateStage; message: string }
  | { type: "result"; data: TranslateResponse }
  | { type: "error"; error: { code: string; message: string } };

export const NDJSON_CONTENT_TYPE = "application/x-ndjson";

export interface SavedTranslationSummary {
  id: string;
  projectTitle: string;
  civilianProjectTitle: string;
  branch: Branch;
  startMonth: string;
  endMonth: string;
  createdAt: string;
}

export interface SavedTranslation extends SavedTranslationSummary {
  input: TranslateRequest;
  translation: TranslationResult;
}

export interface ApiErrorBody {
  error: { code: string; message: string; fieldErrors?: Record<string, string[]> };
}
