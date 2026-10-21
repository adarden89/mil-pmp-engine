import { connection, NextResponse } from "next/server";
import { z } from "zod";
import { eligibilityInputSchema, type EligibilityInput } from "@/lib/eligibility";
import { parseJsonBody, toErrorResponse } from "@/lib/http";
import { requireUser } from "@/lib/supabase/server";

export interface PlanPayload {
  input: EligibilityInput | null;
  completed: string[];
  mapper: { dutyId: string; months: number }[];
  updatedAt: string | null;
}

export interface PlanResponse {
  plan: PlanPayload | null;
}

const planSchema = z.object({
  input: eligibilityInputSchema.nullable(),
  completed: z.array(z.string().max(64)).max(100),
  mapper: z.array(z.object({ dutyId: z.string().max(64), months: z.number().int().min(0).max(600) })).max(30),
  updatedAt: z.iso.datetime().nullable(),
});

export async function GET() {
  await connection();
  try {
    const { user, supabase } = await requireUser();
    const { data, error } = await supabase
      .from("member_plans")
      .select("input, completed, mapper, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw new Error(`Failed to load plan: ${error.message}`);
    const parsed = data
      ? planSchema.safeParse({
          input: data.input,
          completed: data.completed,
          mapper: data.mapper,
          updatedAt: new Date(data.updated_at).toISOString(),
        })
      : null;
    return NextResponse.json<PlanResponse>(
      { plan: parsed?.success ? parsed.data : null },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return toErrorResponse(error, "api/plan GET");
  }
}

export async function PUT(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const plan = await parseJsonBody(request, planSchema);
    const { error } = await supabase.from("member_plans").upsert(
      {
        user_id: user.id,
        input: plan.input,
        completed: plan.completed,
        mapper: plan.mapper,
        updated_at: plan.updatedAt ?? new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(`Failed to save plan: ${error.message}`);
    return NextResponse.json({ saved: true });
  } catch (error) {
    return toErrorResponse(error, "api/plan PUT");
  }
}
