import { connection, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/http";
import { requireUser } from "@/lib/supabase/server";
import type { SavedTranslationSummary } from "@/lib/translation-schema";

export interface SavedTranslationsResponse {
  translations: SavedTranslationSummary[];
}

const LIST_LIMIT = 50;

/** The signed-in member's saved Translation Studio runs, newest first. RLS limits rows to their own. */
export async function GET() {
  await connection();
  try {
    const { user, supabase } = await requireUser();
    const { data, error } = await supabase
      .from("saved_translations")
      .select("id, branch, project_title, civilian_project_title, start_month, end_month, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT);
    if (error) throw new Error(`Failed to list translations: ${error.message}`);
    return NextResponse.json<SavedTranslationsResponse>(
      {
        translations: data.map((row) => ({
          id: row.id,
          branch: row.branch,
          projectTitle: row.project_title,
          civilianProjectTitle: row.civilian_project_title,
          startMonth: row.start_month,
          endMonth: row.end_month,
          createdAt: row.created_at,
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return toErrorResponse(error, "api/translations GET");
  }
}
