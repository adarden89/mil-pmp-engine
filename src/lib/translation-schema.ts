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
  air_force: "EPB / OPB",
  marine_corps: "FITREP / ProMark",
  coast_guard: "EER / OER",
  space_force: "EPB / OPB",
};

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export const translateRequestSchema = z
  .object({
    branch: z.enum(BRANCHES),
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
}

export interface ApiErrorBody {
  error: { code: string; message: string; fieldErrors?: Record<string, string[]> };
}
