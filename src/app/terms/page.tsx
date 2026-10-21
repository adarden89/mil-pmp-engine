import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_DISCLAIMER, PMI_TRADEMARK_NOTICE, SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="October 2026">
      <section>
        <h2>What you are buying</h2>
        <p>
          {SITE.name} sells study and preparation software. One-time purchases unlock the features described on the
          pricing page for your account. Exam fees are separate: they are paid to PMI, typically by your service&apos;s
          credentialing program once your request is approved.
        </p>
      </section>
      <section>
        <h2>No guarantees of approval or funding</h2>
        <p>
          We cannot guarantee that PMI will approve your application, that your application will pass an audit, or that
          any COOL or credentialing program will fund your exam. Only PMI and your service make those decisions. You are
          responsible for the accuracy of everything you submit to them, including text produced with the Translation
          Studio.
        </p>
      </section>
      <section>
        <h2>Funding rules</h2>
        <p>
          Do not pay out of pocket or schedule your exam before your voucher or funding is approved. Programs do not
          reimburse unapproved expenses, and we are not responsible for fees you pay yourself.
        </p>
      </section>
      <section>
        <h2>Refunds</h2>
        <p>
          [Set your refund policy here.] Refunds revoke access to the refunded products. Contact {SITE.supportEmail}.
        </p>
      </section>
      <section>
        <h2>Independence and trademarks</h2>
        <p>{LEGAL_DISCLAIMER}</p>
        <p className="mt-3">{PMI_TRADEMARK_NOTICE}</p>
      </section>
    </LegalPage>
  );
}
