import { PRODUCTS, type ProductId } from "@/lib/catalog";
import { escapeHtml } from "@/lib/email";
import { NAVY_COOL } from "@/lib/pmi-facts";
import { LEGAL_DISCLAIMER, SITE } from "@/lib/site";

export interface AccessEmailInput {
  loginUrl: string;
  products: readonly ProductId[];
  siteUrl: string;
}

const PRODUCT_START: Record<ProductId, { label: string; path: string }> = {
  base_tool: { label: "Open the AI Translation Studio", path: "/translate" },
  cool_fast_track: { label: `Build your ${NAVY_COOL.formNumber} prep packet`, path: "/funding#opnav-1500-57" },
  exam_vault: { label: "Start the Study Vault", path: "/vault" },
};

const WARNING =
  "Do NOT pay out of pocket or schedule your exam before your Navy COOL / Army IgnitED / COOL voucher is approved. Unapproved expenses are not reimbursed.";

/**
 * Post-purchase access email. There are no passwords to send: the sign-in
 * link is the credential, and members can request a fresh one any time at
 * /login with the same email.
 */
export function renderAccessEmail({ loginUrl, products, siteUrl }: AccessEmailInput) {
  const subject = `Your ${SITE.shortName} access is ready`;
  const rows = products
    .map((id) => {
      const start = PRODUCT_START[id];
      return `<tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0">
        <div style="font-weight:600;color:#0b1220">${escapeHtml(PRODUCTS[id].name)}</div>
        <a href="${escapeHtml(siteUrl + start.path)}" style="color:#2563eb;font-size:14px">${escapeHtml(start.label)} &rarr;</a>
      </td></tr>`;
    })
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#f6f8fc;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px">
    <tr><td style="font-size:12px;letter-spacing:2px;color:#2563eb;font-weight:700">MILTOPMP ENTERPRISE</td></tr>
    <tr><td style="padding-top:12px;font-size:24px;font-weight:700;color:#0b1220">Your access is ready.</td></tr>
    <tr><td style="padding-top:8px;font-size:15px;line-height:1.6;color:#536079">Payment confirmed. Use the button below to sign in. No password needed: this secure link signs you in and expires in about an hour. Request a new one any time at ${escapeHtml(siteUrl)}/login with this email.</td></tr>
    <tr><td style="padding:24px 0"><a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:10px">Sign in to your dashboard</a></td></tr>
    <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>
    <tr><td style="padding-top:24px"><div style="border:2px solid #dc2626;background:#fef2f2;border-radius:10px;padding:14px;font-size:14px;line-height:1.5;color:#7f1d1d"><strong>CRITICAL:</strong> ${escapeHtml(WARNING)}</div></td></tr>
    <tr><td style="padding-top:24px;font-size:12px;line-height:1.5;color:#8792a8">Questions? Reply to ${escapeHtml(SITE.supportEmail)}. Your Stripe receipt arrives separately.<br><br>${escapeHtml(LEGAL_DISCLAIMER)}</td></tr>
  </table></td></tr></table></body></html>`;

  const text = [
    "Your MilToPMP access is ready.",
    "",
    `Sign in (no password, link expires in about an hour): ${loginUrl}`,
    `Need a new link later? ${siteUrl}/login`,
    "",
    ...products.map((id) => `- ${PRODUCTS[id].name}: ${siteUrl}${PRODUCT_START[id].path}`),
    "",
    `CRITICAL: ${WARNING}`,
    "",
    `Questions: ${SITE.supportEmail}`,
  ].join("\n");

  return { subject, html, text };
}
