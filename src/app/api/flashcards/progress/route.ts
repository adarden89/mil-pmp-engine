import { connection, NextResponse } from "next/server";
import { z } from "zod";
import { FLASHCARD_IDS } from "@/lib/flashcards";
import { HttpError, parseJsonBody, toErrorResponse } from "@/lib/http";
import { MAX_BOX, type ProgressMap } from "@/lib/leitner";
import { requireUser } from "@/lib/supabase/server";

export interface ProgressResponse {
  progress: ProgressMap;
}

const progressEntrySchema = z.object({
  cardId: z.string().refine((id) => FLASHCARD_IDS.has(id), "Unknown card."),
  box: z.number().int().min(1).max(MAX_BOX),
  correct: z.number().int().min(0).max(100_000),
  incorrect: z.number().int().min(0).max(100_000),
  lastReviewedAt: z.iso.datetime(),
  dueAt: z.iso.datetime(),
});

const progressUpdateSchema = z.object({
  entries: z.array(progressEntrySchema).min(1).max(200),
});

export async function GET() {
  await connection();
  try {
    const { user, supabase } = await requireUser();
    const { data, error } = await supabase
      .from("flashcard_progress")
      .select("card_id, box, correct, incorrect, last_reviewed_at, due_at")
      .eq("user_id", user.id);
    if (error) throw new Error(`Failed to load progress: ${error.message}`);

    const progress: ProgressMap = {};
    for (const row of data) {
      progress[row.card_id] = {
        cardId: row.card_id,
        box: row.box,
        correct: row.correct,
        incorrect: row.incorrect,
        lastReviewedAt: new Date(row.last_reviewed_at).toISOString(),
        dueAt: new Date(row.due_at).toISOString(),
      };
    }
    return NextResponse.json<ProgressResponse>({ progress }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return toErrorResponse(error, "api/flashcards/progress GET");
  }
}

export async function PUT(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const { entries } = await parseJsonBody(request, progressUpdateSchema);
    const now = Date.now();
    if (entries.some((entry) => Date.parse(entry.lastReviewedAt) > now + 5 * 60_000)) {
      throw new HttpError(400, "invalid_timestamp", "Review timestamps cannot be in the future.");
    }

    // Runs as the user, so RLS guarantees rows can only be written for them.
    const { error } = await supabase.from("flashcard_progress").upsert(
      entries.map((entry) => ({
        user_id: user.id,
        card_id: entry.cardId,
        box: entry.box,
        correct: entry.correct,
        incorrect: entry.incorrect,
        last_reviewed_at: entry.lastReviewedAt,
        due_at: entry.dueAt,
      })),
      { onConflict: "user_id,card_id" },
    );
    if (error) throw new Error(`Failed to save progress: ${error.message}`);
    return NextResponse.json({ saved: entries.length });
  } catch (error) {
    return toErrorResponse(error, "api/flashcards/progress PUT");
  }
}
