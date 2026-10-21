import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { getEntitlements } from "@/lib/entitlements";
import { HttpError, parseJsonBody, toErrorResponse } from "@/lib/http";
import { translateLimiter } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/server";
import { translateRequestSchema, type TranslateResponse } from "@/lib/translation-schema";
import { translateMilitaryExperience } from "@/lib/translator";

export const maxDuration = 120;

const QUOTA_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
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

    try {
      const result = await translateMilitaryExperience(input);
      await db
        .from("translation_usage")
        .update({ model: result.model, input_tokens: result.inputTokens, output_tokens: result.outputTokens })
        .eq("id", reservation.id);
      const body: TranslateResponse = {
        translation: result.translation,
        usage: { remaining: Math.max(0, limit - used), limit },
      };
      return NextResponse.json(body);
    } catch (error) {
      // Failed translations do not count against the member's quota.
      await db.from("translation_usage").delete().eq("id", reservation.id);
      throw error;
    }
  } catch (error) {
    return toErrorResponse(error, "api/translate");
  }
}
