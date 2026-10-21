# MilToPMP Enterprise

A self-service portal that takes service members (E-1 to E-9 and officers, every branch) with zero project management background to a CAPM or PMP, with the exam funded through Navy COOL, Army IgnitED Credentialing Assistance, or Air Force COOL at $0 out of pocket.

Next.js 16 (App Router, Cache Components) · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui on Radix · Framer Motion · Lucide · Supabase (Postgres + RLS) · Stripe · Anthropic Claude · Resend · Meta Conversions API · TikTok Events API.

> **Not affiliated with DoD, any military service, Navy COOL, or PMI.** Only a member's COOL/CA office and command approve funding; only PMI approves applications. PMI, PMP, CAPM, and PMBOK are registered marks of the Project Management Institute.

## Modules

| #   | Module                                                                                         | Route                                    | Access                                |
| --- | ---------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------- |
| 1   | Zero-knowledge onboarding: 3-step quiz, Beginner-to-Certified roadmap, Accidental PM Mapper    | `/eligibility`                           | Free                                  |
| 2   | $0 out-of-pocket funding fast-track: unskippable COOL warning, workflows, education directory  | `/funding`                               | Free                                  |
| 2   | OPNAV 1500/57 prep packet, JST checklist, funding worksheet (PDF)                              | `/funding#opnav-1500-57`                 | $9.99 Navy COOL Fast-Track Guide      |
| 3   | AI Military-to-PMI Translation Studio with Audit Risk Meter, copy, PDF export                  | `/translate`                             | $24.99 Core Translator (sample free)  |
| 4   | Zero-knowledge Study Vault (78 cards, 5 categories) and trainer/tool directory                 | `/vault`                                 | 10-card sample free, full deck $19.99 |
| 5   | Stripe checkout and 1-click upsells, guest provisioning, access email, server-side ad tracking | `/#pricing`, `/api/webhooks/stripe`, ... | n/a                                   |

### 1. Onboarding and eligibility (`src/lib/eligibility.ts`, `roadmap.ts`, `accidental-pm.ts`)

The quiz asks branch, pay grade, education, and **months spent leading projects in the last 8 years**. PMI counts leadership months, not time in service, so asking for service months would route members to an application they cannot pass. Routing:

- Under PMI's bar → **CAPM** (23 contact hours, no experience).
- High school / associate + 60 months → **PMP**. Bachelor's + 36 months → **PMP**. GAC-accredited degree + 24 months → **PMP**.
- **E-1 to E-4 → CAPM first** even if the numbers meet the bar on paper, with an explanation (most junior time is supporting work, which fails audits).
- Every result carries the critical do-not-pay-out-of-pocket warning; Navy officers are warned that Navy COOL's officer funding pilot ended.

The result generates a six-phase roadmap (foundation → contact hours → PMI application → funding → study → exam) with checkbox progress stored on the device and synced to `member_plans` when signed in. The **Accidental PM Mapper** translates duties (FTX planning, deployment logistics, inspection prep, range days, installs, events, motor pool, watchbill, supply) into the five process groups and says honestly which are projects and which are operations PMI will not count.

### 2. Funding fast-track (`src/components/funding/*`, `src/lib/navy-cool.ts`)

- **NavyCoolWarning**: a persistent critical banner plus a blocking dialog that cannot be dismissed until the member ticks an acknowledgement. The tools behind it are `inert` until then.
- **OpnavFormGenerator**: collects what the OPNAV 1500/57 "Certification & License Funding Request" (Rev. 01 May 2026) asks for, checks Navy COOL's timing rules (EAOS more than 2 months after receipt; exam done 60 days before separation), and generates a **prep packet**: field-by-field data, routing checklist, and a memo to the approving official. It does not reproduce the official form; members transfer the data onto the current form from Navy COOL. SSN and DoD ID are never collected. Other branches get a JST checklist and funding worksheet.
- **Education directory**: Andrew Ramdayal (TIA Education) and Joseph Phillips 35-hour Udemy courses, Onward to Opportunity, and links to Navy COOL, Army IgnitED, and AF COOL.

### 3. Translation Studio (`src/lib/translator.ts`, `/api/translate`)

Multi-step form (branch, rate/MOS/AFSC, billet, project frame, raw NCOER/EPR/EPB/EVAL/FITREP bullets, optional JST training). The route checks auth, entitlement, a burst limit, and a durable 30-day quota, then calls Claude with structured outputs, `effort: "medium"`, a cached system prompt, and server-side refusal fallbacks. The prompt translates jargon (S-3, FTX, NCOIC, COA, ...) and maps work to the five process groups, and forbids inventing numbers or responsibilities: nothing is "audit-proof", so the goal is that every claim is verifiable. The **Audit Risk Meter** scores length, lifecycle coverage, quantified outcomes, leftover jargon, first-person ownership, and required elements.

### 4. Study Vault (`src/lib/flashcards.ts`, `resources.ts`)

Categories: PM Fundamentals, Agile / Scrum, Predictive / Waterfall, Hybrid, Business Analysis (four are the CAPM exam domains, weighted 36/20/17/27%). Flip and swipe cards move through five Leitner boxes; progress syncs for vault owners. Directory: PMI Study Hall (the #1 recommended simulator), Pocket Prep, Ramdayal, Phillips, O2O, PMBOK 8th Edition, exam outlines.

### 5. Monetization and growth engine

**Pricing** (`src/lib/catalog.ts`): $24.99 Core Translator, +$9.99 Navy COOL Fast-Track Guide, +$19.99 Study Vault. There is intentionally **no crossed-out "$99.99" anchor**: a former price the product never sold at is a fictitious reference price under the FTC Guides Against Deceptive Pricing (16 CFR 233.1). The pricing section anchors on the real exam fees COOL funding covers instead.

```
Ad click (fbclid / ttclid) ─► first-party cookies (consent permitting)
        │
Pricing ─► POST /api/checkout ──► Stripe Checkout (guests welcome; card saved for 1-click add-ons)
        │      └─ after(): save checkout_attribution + server InitiateCheckout
        ▼
Stripe ─► POST /api/webhooks/stripe (signature-verified, stripe_events ledger)
        ├─ fulfill: provision Supabase user from the Stripe email if guest, grant entitlements
        └─ after(): runPostPurchase
              ├─ Resend access email with a one-time sign-in link (email_deliveries ledger)
              └─ Purchase → Meta CAPI + TikTok Events (hashed email, IP, UA, fbp/fbc, ttclid/ttp,
                 actual amount_total; conversion_events ledger; event_id = Checkout Session id)
/checkout/success ─► verify (same idempotent steps) ─► browser pixel Purchase with the same event id
```

- **Order values** come from Stripe's `amount_total` ($24.99, $34.98, $44.98, or $54.97 before promotions), not hardcoded numbers.
- **`/api/tracking/meta-capi` and `/api/tracking/tiktok-events`** relay browser funnel events (`ViewContent`, `InitiateCheckout`) server-side. They reject `Purchase`, foreign origins, and bursts, so nobody can inject fake revenue into your ad accounts. Purchases are only ever reported from the webhook.
- **Idempotency**: Stripe retries, the success-page verifier, and the webhook can all run the same steps; purchases, emails, and conversions each have a unique ledger key.
- **Sign-in links** point to `/auth/confirm`, which requires a click before the token is used, so mail scanners (common on `.mil`) cannot burn it. There are no passwords to email.
- **Privacy**: Global Privacy Control is honored, a consent banner and a "Do Not Sell or Share" control are built in, and `TRACKING_CONSENT_MODE` switches between US opt-out and opt-in. Checkout attribution holds IP/UA: purge rows older than 90 days.

### Ad creative generator

```bash
npm run generate-ads -- --tiktok 6 --instagram 4 --out ad-creatives
```

`scripts/generate-ad-creatives.ts` asks Claude for TikTok UGC scripts (hook, pain point, solution, CTA, shots, on-screen text, caption) and Instagram feed, carousel, and story copy, then writes `ad-creatives.md`, `tiktok-scripts.csv`, `instagram-ads.csv`, and `batch.json`. The prompt and an automated screen (`src/lib/ad-creatives.ts`) flag implied DoD/PMI endorsement, uniforms, guarantees, fake urgency, and "free" claims that hide the product price. **Output is drafts: a person must review before anything runs.** Nothing is auto-published.

## Requested structure → this repo

| Requested                           | Location                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `app/page.tsx`                      | `src/app/page.tsx`                                                              |
| `app/eligibility/page.tsx`          | `src/app/eligibility/page.tsx`                                                  |
| `app/dashboard/page.tsx`            | `src/app/dashboard/page.tsx`                                                    |
| `app/api/translate/route.ts`        | `src/app/api/translate/route.ts`                                                |
| `app/api/webhooks/stripe/route.ts`  | `src/app/api/webhooks/stripe/route.ts`                                          |
| `/api/tracking/*`                   | `src/app/api/tracking/meta-capi`, `.../tiktok-events`                           |
| `components/NavyCoolWarning.tsx`    | `src/components/funding/navy-cool-warning.tsx`                                  |
| `components/OpnavFormGenerator.tsx` | `src/components/funding/opnav-form-generator.tsx`                               |
| `components/FlashcardDeck.tsx`      | `src/components/vault/flashcard-engine.tsx`                                     |
| `components/TranslationStudio.tsx`  | `src/components/translate/translation-studio.tsx`                               |
| `lib/anthropic.ts`                  | `src/lib/translator.ts`                                                         |
| `lib/stripe.ts`                     | `src/lib/stripe.ts`, `src/lib/billing.ts`                                       |
| `lib/supabase.ts`                   | `src/lib/supabase/{server,client,admin,proxy}.ts`, `supabase/migrations/`       |
| `lib/email.ts`                      | `src/lib/email.ts`, `src/lib/emails/access-email.ts`, `src/lib/provisioning.ts` |
| `scripts/generate-ad-creatives.ts`  | `scripts/generate-ad-creatives.ts`                                              |

## Getting started

Requirements: Node.js 20.9 or later.

```bash
npm install
cp .env.example .env.local   # everything is optional at boot
npm run dev
```

`GET /api/health` reports which integrations are configured.

1. **Supabase**: create a project, set the URL and keys, apply both files in `supabase/migrations/` (SQL editor or `supabase db push`). Under Authentication → URL Configuration, set the Site URL and add `http://localhost:3000/**` and `https://<your-domain>/**` as redirect URLs.
2. **Stripe**: set `STRIPE_SECRET_KEY`. Create a webhook endpoint at `/api/webhooks/stripe` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `payment_intent.succeeded`, and `charge.refunded`. Locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
3. **Anthropic**: set `ANTHROPIC_API_KEY`.
4. **Resend**: verify a sending domain, set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
5. **Meta / TikTok**: create the pixels and access tokens, set the four variables, and use the `*_TEST_EVENT_CODE` variables to confirm events and deduplication in each Events Manager before going live.
6. **Legal**: `/privacy` and `/terms` are templates. Have counsel review them, your refund policy, and the consent mode before running ads.

## Scripts

| Command                | What it does                                |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Development server                          |
| `npm run build`        | Production build                            |
| `npm run typecheck`    | Generate route types and run `tsc --noEmit` |
| `npm run lint`         | ESLint                                      |
| `npm run test`         | Vitest unit tests                           |
| `npm run format`       | Prettier (with Tailwind class sorting)      |
| `npm run check`        | Typecheck, lint, format check, and tests    |
| `npm run generate-ads` | Draft TikTok and Instagram ad creatives     |

## Security notes

- Secrets are server-only and validated with Zod (`src/lib/env.ts`). The Supabase secret key is used only in `src/lib/supabase/admin.ts`.
- Every user-data route verifies the session server-side. RLS: users read their own rows and write only their profile, plan, and flashcard progress.
- Guest buyers are provisioned as confirmed users from the email they gave Stripe; the account is reachable only through sign-in links sent to that inbox.
- The in-memory burst limiter is per instance; quotas that must hold globally live in Postgres. Use Redis or similar for strict global rate limits.
- Evaluation bullets are sent to Anthropic. The studio tells members to strip classified, CUI, and personal information first.

## Known gaps

- The OPNAV 1500/57 prep packet is built from the form's published requirements; the official PDF itself could not be retrieved from the build environment. Map its exact fields before advertising "pre-filled form" language.
- The 78-card deck is a solid beginner base, not a full question bank; members still need PMI Study Hall or Pocket Prep.
- COOL rules and PMI fees change; re-verify `src/lib/pmi-facts.ts` and `src/lib/funding-data.ts` each fiscal year.
- No end-to-end tests against live Stripe, Supabase, Resend, Meta, or TikTok yet; unit tests cover the logic, payload shapes, and documents.
