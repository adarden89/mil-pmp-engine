import { connection, NextResponse } from "next/server";
import { integrationStatus } from "@/lib/env";
import { toErrorResponse } from "@/lib/http";

/** Liveness plus which integrations are configured. Never exposes values. */
export async function GET() {
  await connection();
  try {
    return NextResponse.json(
      { status: "ok", integrations: integrationStatus() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return toErrorResponse(error, "api/health");
  }
}
