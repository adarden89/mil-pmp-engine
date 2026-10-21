import { connection, NextResponse } from "next/server";
import { z } from "zod";
import { HttpError, toErrorResponse } from "@/lib/http";
import { requireUser } from "@/lib/supabase/server";
import { translateRequestSchema, translationResultSchema, type SavedTranslation } from "@/lib/translation-schema";

export interface SavedTranslationResponse {
  translation: SavedTranslation;
}

const idSchema = z.uuid();

function parseId(raw: string): string {
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) throw new HttpError(404, "not_found", "That translation does not exist.");
  return parsed.data;
}

/** One saved translation with its original inputs. Rows that no longer match the schema are treated as missing. */
export async function GET(_request: Request, ctx: RouteContext<"/api/translations/[id]">) {
  await connection();
  try {
    const { user, supabase } = await requireUser();
    const id = parseId((await ctx.params).id);
    const { data, error } = await supabase
      .from("saved_translations")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw new Error(`Failed to load translation: ${error.message}`);
    if (!data) throw new HttpError(404, "not_found", "That translation does not exist.");

    const input = translateRequestSchema.safeParse(data.input);
    const translation = translationResultSchema.safeParse(data.translation);
    if (!input.success || !translation.success) {
      console.error("[api/translations] stored row failed validation", id);
      throw new HttpError(404, "not_found", "That translation can no longer be opened.");
    }
    return NextResponse.json<SavedTranslationResponse>(
      {
        translation: {
          id: data.id,
          branch: data.branch,
          projectTitle: data.project_title,
          civilianProjectTitle: data.civilian_project_title,
          startMonth: data.start_month,
          endMonth: data.end_month,
          createdAt: data.created_at,
          input: input.data,
          translation: translation.data,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return toErrorResponse(error, "api/translations/[id] GET");
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/translations/[id]">) {
  try {
    const { user, supabase } = await requireUser();
    const id = parseId((await ctx.params).id);
    const { error, count } = await supabase
      .from("saved_translations")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw new Error(`Failed to delete translation: ${error.message}`);
    if (!count) throw new HttpError(404, "not_found", "That translation does not exist.");
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error, "api/translations/[id] DELETE");
  }
}
