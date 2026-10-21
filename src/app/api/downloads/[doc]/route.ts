import type { NextRequest } from "next/server";
import {
  buildCoolDocument,
  COOL_DOCUMENT_META,
  isCoolDocumentId,
  packetPersonalizationSchema,
} from "@/lib/documents/cool-packet";
import { getEntitlements } from "@/lib/entitlements";
import { HttpError, parseJsonBody, toErrorResponse } from "@/lib/http";
import { requireUser } from "@/lib/supabase/server";

/**
 * POST so personal details travel in the body, never in URLs that end up in
 * logs, browser history, or referrers.
 */
export async function POST(request: NextRequest, context: RouteContext<"/api/downloads/[doc]">) {
  try {
    const { doc } = await context.params;
    if (!isCoolDocumentId(doc)) {
      throw new HttpError(404, "not_found", "Unknown document.");
    }

    const { user, supabase } = await requireUser();
    const owned = await getEntitlements(supabase, user.id);
    if (!owned.includes("cool_fast_track")) {
      throw new HttpError(
        402,
        "payment_required",
        "Pre-filled COOL documents are part of the Navy COOL Fast-Track Guide.",
      );
    }

    const personalization = await parseJsonBody(request, packetPersonalizationSchema);
    if (COOL_DOCUMENT_META[doc].navyOnly && personalization.branch !== "navy") {
      throw new HttpError(400, "navy_only", "The OPNAV 1500/57 prep packet is for Navy members.");
    }

    const pdf = buildCoolDocument(doc, personalization);
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${COOL_DOCUMENT_META[doc].filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error, "api/downloads");
  }
}
