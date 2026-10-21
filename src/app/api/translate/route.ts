import { NextResponse } from "next/server";
import { analyzeAuditDensity, auditSourceFor, findJargon } from "@/lib/audit-density";
import { ConfigError, serverEnv } from "@/lib/env";
import { getEntitlements } from "@/lib/entitlements";
import { HttpError, parseJsonBody, toErrorResponse } from "@/lib/http";
import { translateLimiter } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/server";
import {
  EVAL_SOURCE_META,
  EVAL_SYSTEM_BY_BRANCH,
  NDJSON_CONTENT_TYPE,
  translateRequestSchema,
  type TranslateRequest,
  type TranslateResponse,
  type TranslateStreamEvent,
  type TranslationResult,
} from "@/lib/translation-schema";
import { translateMilitaryExperience } from "@/lib/translator";

export const maxDuration = 120;

const QUOTA_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

type Emit = (event: TranslateStreamEvent) => void;

interface PreparedTranslation {
  userId: string;
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"];
  input: TranslateRequest;
  reservationId: number;
  used: number;
  limit: number;
}

/** Auth, entitlement, rate limit, validation, and quota reservation. Throws HttpError before any streaming starts. */
async function prepare(request: Request): Promise<PreparedTranslation> {
  const { user, supabase } = await requireUser();

  const owned = await getEntitlements(supabase, user.id);
  if (!owned.includes("base_tool")) {
    throw new HttpError(402, "payment_required", "The Translation Studio is part of the MilToPMP Core Translator.");
  }

  const burst = translateLimiter.check(user.id);
  if (!burst.allowed) {
    throw new HttpError(429, "rate_limited", "Slow down a little. Try again in a minute.", undefined, {
      "Retry-After": String(burst.retryAfterSeconds),
    });
  }

  const input = await parseJsonBody(request, translateRequestSchema);
  const { ANTHROPIC_MODEL: model, TRANSLATION_LIMIT_PER_30_DAYS: limit } = serverEnv();
  const db = supabaseAdmin();

  // Reserve a usage row first, then count. Concurrent requests each see the
  // others' reservations, so the quota cannot be overrun by a burst.
  const { data: reservation, error: reserveError } = await db
    .from("translation_usage")
    .insert({ user_id: user.id, model })
    .select("id")
    .single();
  if (reserveError) throw new Error(`Failed to reserve usage: ${reserveError.message}`);

  const since = new Date(Date.now() - QUOTA_WINDOW_MS).toISOString();
  const { count, error: countError } = await db
    .from("translation_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if (countError) throw new Error(`Failed to count usage: ${countError.message}`);

  const used = count ?? 0;
  if (used > limit) {
    await db.from("translation_usage").delete().eq("id", reservation.id);
    throw new HttpError(429, "quota_exceeded", `You have used all ${limit} translations for this 30-day period.`);
  }
  return { userId: user.id, supabase, input, reservationId: reservation.id, used, limit };
}

function listTerms(terms: string[], max = 8): string {
  return terms.length > max ? `${terms.slice(0, max).join(", ")} +${terms.length - max} more` : terms.join(", ");
}

/** Server-side flags merged into the model's own, so the saved record carries them too. */
function auditFlagsFor(translation: TranslationResult, unsupported: string[], leftover: string[]): string[] {
  const flags = [...translation.auditFlags];
  for (const figure of unsupported) {
    flags.push(`"${figure}" does not appear in your bullets. Verify it from your records or remove it.`);
  }
  if (leftover.length > 0) {
    flags.push(`Military terms still in the summary: ${leftover.join(", ")}. Spell them out or replace them.`);
  }
  return flags;
}

async function saveTranslation(prepared: PreparedTranslation, translation: TranslationResult): Promise<string | null> {
  const { input } = prepared;
  const { data, error } = await prepared.supabase
    .from("saved_translations")
    .insert({
      user_id: prepared.userId,
      branch: input.branch,
      project_title: input.projectTitle,
      civilian_project_title: translation.civilianProjectTitle,
      start_month: input.startMonth,
      end_month: input.endMonth,
      input,
      translation,
    })
    .select("id")
    .single();
  if (error) {
    // The member still gets their translation; it just is not in their history.
    console.error("[api/translate] failed to save translation", error.message);
    return null;
  }
  return data.id;
}

async function runTranslation(
  prepared: PreparedTranslation,
  emit: Emit,
  signal: AbortSignal,
): Promise<TranslateResponse> {
  const { input } = prepared;
  const db = supabaseAdmin();
  try {
    emit({ type: "stage", stage: "scrub", status: "running", message: "Scrubbing military acronyms" });
    const found = findJargon(`${input.rawBullets}\n${input.jstCourses ?? ""}`);
    emit({
      type: "stage",
      stage: "scrub",
      status: "done",
      message: found.length
        ? `Found ${found.length} military term${found.length === 1 ? "" : "s"} to translate: ${listTerms(found)}`
        : "No military acronyms detected in your bullets",
    });

    const source = input.evalSource ? EVAL_SOURCE_META[input.evalSource].label : EVAL_SYSTEM_BY_BRANCH[input.branch];
    emit({
      type: "stage",
      stage: "map",
      status: "running",
      message: `Mapping ${source} bullets to PMI's five process groups`,
    });
    let drafting = false;
    const startDraft = () => {
      if (drafting) return;
      drafting = true;
      emit({ type: "stage", stage: "map", status: "done", message: "Evidence mapped to the project lifecycle" });
      emit({ type: "stage", stage: "draft", status: "running", message: "Drafting first-person PMI narrative" });
    };
    const result = await translateMilitaryExperience(input, {
      signal,
      onProgress: (progress) => {
        if (progress.kind === "waiting") {
          emit({ type: "log", stage: "map", message: `Analyzing your bullets (${progress.seconds}s)` });
        } else if (progress.kind === "first_token") {
          startDraft();
        } else {
          emit({
            type: "log",
            stage: "draft",
            message: `${progress.characters.toLocaleString("en-US")} characters drafted`,
          });
        }
      },
    });
    startDraft();
    emit({ type: "stage", stage: "draft", status: "done", message: "Draft complete" });

    emit({ type: "stage", stage: "audit", status: "running", message: "Running audit-safety checks" });
    const report = analyzeAuditDensity(result.translation, auditSourceFor(input));
    const leftover = findJargon(result.translation.applicationSummary);
    const translation = {
      ...result.translation,
      auditFlags: auditFlagsFor(result.translation, report.unsupportedFigures, leftover),
    };
    const covered = Object.values(translation.processGroups).filter((items) => items.length > 0).length;
    emit({
      type: "log",
      stage: "audit",
      message: `${report.wordCount} words · ${covered}/5 process groups · ${report.unsupportedFigures.length} unverified figure${report.unsupportedFigures.length === 1 ? "" : "s"} · ${leftover.length} leftover term${leftover.length === 1 ? "" : "s"}`,
    });
    emit({ type: "stage", stage: "audit", status: "done", message: `${report.gradeLabel} (${report.score}/100)` });

    await db
      .from("translation_usage")
      .update({ model: result.model, input_tokens: result.inputTokens, output_tokens: result.outputTokens })
      .eq("id", prepared.reservationId);
    const savedId = await saveTranslation(prepared, translation);

    return {
      translation,
      usage: { remaining: Math.max(0, prepared.limit - prepared.used), limit: prepared.limit },
      savedId,
    };
  } catch (error) {
    // Failed translations do not count against the member's quota.
    await db.from("translation_usage").delete().eq("id", prepared.reservationId);
    throw error;
  }
}

function streamError(error: unknown): { code: string; message: string } {
  if (error instanceof HttpError) return { code: error.code, message: error.message };
  if (error instanceof ConfigError) {
    console.error(`[api/translate] ${error.message}`);
    return { code: "not_configured", message: "This feature is not configured on the server yet." };
  }
  console.error("[api/translate] unexpected error", error);
  return { code: "internal_error", message: "Something went wrong on our side. Please try again." };
}

/**
 * POST /api/translate
 *
 * JSON by default. With `Accept: application/x-ndjson` the response streams
 * one progress event per line (see TranslateStreamEvent) and ends with a
 * `result` or `error` event. Errors found before work starts (auth, payment,
 * validation, quota) are always plain JSON with the matching status code.
 */
export async function POST(request: Request) {
  let prepared: PreparedTranslation;
  try {
    prepared = await prepare(request);
  } catch (error) {
    return toErrorResponse(error, "api/translate");
  }

  if (!request.headers.get("accept")?.includes(NDJSON_CONTENT_TYPE)) {
    try {
      return NextResponse.json(await runTranslation(prepared, () => {}, request.signal));
    } catch (error) {
      return toErrorResponse(error, "api/translate");
    }
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit: Emit = (event) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // The client went away; the abort signal stops the model call.
        }
      };
      try {
        emit({ type: "result", data: await runTranslation(prepared, emit, request.signal) });
      } catch (error) {
        emit({ type: "error", error: streamError(error) });
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed by a disconnect.
        }
      }
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": `${NDJSON_CONTENT_TYPE}; charset=utf-8`,
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
