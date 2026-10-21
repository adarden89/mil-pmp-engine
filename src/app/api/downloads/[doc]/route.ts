import { connection, type NextRequest } from "next/server";
import {
  buildCoolDocument,
  COOL_DOCUMENT_META,
  isCoolDocumentId,
  packetPersonalizationSchema,
} from "@/lib/documents/cool-packet";
import { getEntitlements } from "@/lib/entitlements";
import { HttpError, toErrorResponse } from "@/lib/http";
import { requireUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest, context: RouteContext<"/api/downloads/[doc]">) {
  await connection();
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
        "Pre-filled COOL documents are part of the COOL Voucher Fast-Track.",
      );
    }

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = packetPersonalizationSchema.safeParse(params);
    if (!parsed.success) {
      throw new HttpError(400, "validation_failed", "Check the personalization fields and try again.");
    }

    const pdf = buildCoolDocument(doc, parsed.data);
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
