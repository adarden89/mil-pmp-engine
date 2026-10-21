import { NextResponse } from "next/server";
import { z } from "zod";
import { maskEmail } from "@/lib/email";
import { HttpError, parseJsonBody, toErrorResponse } from "@/lib/http";
import { productsOf, sendAccessEmail } from "@/lib/provisioning";
import { RateLimiter } from "@/lib/rate-limit";
import { stripe } from "@/lib/stripe";

const bodySchema = z.object({ sessionId: z.string().regex(/^cs_[A-Za-z0-9_]+$/) });
const resendLimiter = new RateLimiter(3, 60 * 60 * 1000);

/** Sends a fresh sign-in link for a paid checkout. At most once per 10 minutes per purchase. */
export async function POST(request: Request) {
  try {
    const { sessionId } = await parseJsonBody(request, bodySchema);
    const limit = resendLimiter.check(sessionId);
    if (!limit.allowed) {
      throw new HttpError(
        429,
        "rate_limited",
        "We already sent a few links. Check your spam folder, or try again later.",
        undefined,
        {
          "Retry-After": String(limit.retryAfterSeconds),
        },
      );
    }

    const session = await stripe().checkout.sessions.retrieve(sessionId);
    const email = session.customer_details?.email;
    if (session.payment_status !== "paid" || !email) {
      throw new HttpError(409, "not_paid", "This checkout is not complete yet.");
    }

    const bucket = Math.floor(Date.now() / (10 * 60 * 1000));
    const result = await sendAccessEmail(`access:${session.id}:resend:${bucket}`, email, productsOf(session));
    if (result === "failed") {
      throw new HttpError(502, "email_failed", "We could not send the email right now. Please try again in a minute.");
    }
    return NextResponse.json({ sent: true, emailHint: maskEmail(email) });
  } catch (error) {
    return toErrorResponse(error, "api/checkout/resend-access");
  }
}
