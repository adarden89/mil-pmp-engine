import { NextResponse } from "next/server";
import { z } from "zod";
import { chargeUpsell, type UpsellResult } from "@/lib/billing";
import { ADDON_IDS, PRODUCT_IDS, PRODUCTS } from "@/lib/catalog";
import { getEntitlements } from "@/lib/entitlements";
import { HttpError, parseJsonBody, toErrorResponse } from "@/lib/http";
import { checkoutLimiter } from "@/lib/rate-limit";
import { requireUser } from "@/lib/supabase/server";

const upsellRequestSchema = z.object({ productId: z.enum(PRODUCT_IDS) });

export type UpsellResponse = UpsellResult;

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const limit = checkoutLimiter.check(`upsell:${user.id}`);
    if (!limit.allowed) {
      throw new HttpError(429, "rate_limited", "Too many purchase attempts. Try again shortly.", undefined, {
        "Retry-After": String(limit.retryAfterSeconds),
      });
    }

    const { productId } = await parseJsonBody(request, upsellRequestSchema);
    if (!ADDON_IDS.includes(productId)) {
      throw new HttpError(400, "not_an_addon", "Only add-ons can be purchased in one click.");
    }

    const owned = await getEntitlements(supabase, user.id);
    if (!owned.includes("base_tool")) {
      throw new HttpError(409, "base_required", "Add-ons require the MilToPMP Base Tool.");
    }
    if (owned.includes(productId)) {
      throw new HttpError(409, "already_owned", `You already own ${PRODUCTS[productId].name}.`);
    }

    const result = await chargeUpsell(user, productId);
    return NextResponse.json<UpsellResponse>(result);
  } catch (error) {
    return toErrorResponse(error, "api/upsell");
  }
}
