import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { PrivacyChoices } from "@/components/tracking/tracking-provider";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 2026">
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Account: your email address, used to sign you in with one-time links.</li>
          <li>
            Purchases: products bought and amounts. Card details are handled by Stripe and never reach our servers.
          </li>
          <li>
            Translation Studio: the evaluation bullets, billet details, and training you submit. They are sent to
            Anthropic to generate your translation. Do not submit classified, CUI, or personally identifying information
            about others.
          </li>
          <li>Study and planning data: flashcard progress and roadmap checkmarks, if you are signed in.</li>
          <li>
            Funding packet details you type in are used only to generate your PDFs and are not stored. We never ask for
            your SSN or DoD ID.
          </li>
        </ul>
      </section>
      <section>
        <h2>Advertising and measurement</h2>
        <p>
          When you arrive from an ad, we store the ad click identifier in a first-party cookie. When you start checkout
          or complete a purchase, our server sends Meta and TikTok an event containing a SHA-256 hash of your email,
          your IP address, your browser user agent, those click identifiers, and the order value. We also load the Meta
          and TikTok pixels. This lets the platforms measure which ads lead to purchases. Under some US state laws, this
          counts as &ldquo;sharing&rdquo; personal information for cross-context behavioral advertising.
        </p>
        <p className="mt-3">
          Checkout attribution records (IP address, user agent, click identifiers) are deleted after 90 days.
        </p>
      </section>
      <section id="choices" className="scroll-mt-24">
        <h2>Your choices: Do Not Sell or Share</h2>
        <p className="mb-4">
          You can opt out at any time. We also honor the Global Privacy Control (GPC) browser signal as an opt-out.
          Opting out stops the pixels and server-side ad events for this browser.
        </p>
        <PrivacyChoices />
      </section>
      <section>
        <h2>Service providers</h2>
        <ul>
          <li>Stripe (payments)</li>
          <li>Supabase (accounts and database)</li>
          <li>Anthropic (AI translation)</li>
          <li>Resend (transactional email)</li>
          <li>Meta and TikTok (ad measurement, unless you opt out)</li>
        </ul>
      </section>
      <section>
        <h2>Contact and requests</h2>
        <p>
          To access, correct, or delete your data, email {SITE.supportEmail}. We do not sell data to brokers, and we are
          not affiliated with the Department of Defense or any military service.
        </p>
      </section>
    </LegalPage>
  );
}
