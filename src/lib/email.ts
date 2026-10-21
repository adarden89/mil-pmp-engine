import "server-only";
import { Resend } from "resend";
import { requireEnv } from "@/lib/env";

/** Transactional email through Resend. */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  tags?: { name: string; value: string }[];
}

export class EmailDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

let client: Resend | undefined;

function resend(): Resend {
  client ??= new Resend(requireEnv("RESEND_API_KEY"));
  return client;
}

/**
 * Send one email. `idempotencyKey` makes Resend drop duplicates of the same
 * logical message for 24 hours, a second guard behind our own ledger.
 */
export async function sendEmail(message: EmailMessage, idempotencyKey: string): Promise<{ id: string }> {
  const { data, error } = await resend().emails.send(
    {
      from: requireEnv("RESEND_FROM_EMAIL"),
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      tags: message.tags,
    },
    { idempotencyKey },
  );
  if (error || !data) {
    throw new EmailDeliveryError(error?.message ?? "Resend returned no message id");
  }
  return { id: data.id };
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** j***@gmail.com: enough for a buyer to recognize their address, not enough to leak it. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "your email";
  return `${local[0]}${"*".repeat(Math.max(2, Math.min(local.length - 1, 6)))}@${domain}`;
}
