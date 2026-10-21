# MilToPMP Enterprise

A guided portal that takes junior service members (E-1 to E-6, NCOs, junior officers) from no project management background to a CAPM or PMP, with the exam funded through their service's COOL or credentialing assistance program.

Built with Next.js 16 (App Router, Cache Components), TypeScript (strict), Tailwind CSS v4, Framer Motion, Lucide, Supabase, Stripe, and the Anthropic API.

> **Not affiliated with DoD, any military service, or PMI.** Funding approvals come only from a member's COOL or CA office and command; application approvals come only from PMI. PMI, PMP, CAPM, and PMBOK are registered marks of the Project Management Institute.

## Modules

| Module                                               | Route                | Access                                            |
| ---------------------------------------------------- | -------------------- | ------------------------------------------------- |
| Hero, eligibility calculator, pricing                | `/`                  | Free                                              |
| COOL funding engine (workflow map)                   | `/funding`           | Free                                              |
| Pre-filled JST checklist and voucher worksheet (PDF) | `/funding#downloads` | $12 COOL Voucher Fast-Track                       |
| AI Military-to-PMI Translation Studio                | `/translate`         | $27 Base Tool (sample output free)                |
| Flashcards and resource directory                    | `/vault`             | 9-card sample free, full deck with $17 Exam Vault |
| Dashboard with 1-click add-ons                       | `/dashboard`         | Signed in                                         |

### Eligibility calculator

`src/lib/eligibility.ts` turns three answers (pay grade, time in service, education) into a CAPM / CAPM-then-PMP / PMP recommendation. PMI counts **months spent leading projects in the last eight years**, not rank, so the estimate is deliberately conservative: it uses the low end of each service band and a rank-based share of that time. Thresholds: 36 months with a bachelor's degree, 60 months with a high school diploma or associate degree, 24 months with a GAC-accredited degree, plus 35 contact hours (an active CAPM satisfies this). The CAPM requires 23 contact hours and no experience.

### Funding engine

`src/lib/funding-data.ts` holds step-by-step workflows for Navy COOL, Army Credentialing Assistance (ArmyIgnitED), Air Force COOL (AFVEC), Marine Corps COOL, and Coast Guard COOL. Each step shows who owns it and a typical duration. Progress is saved per device. The $12 add-on generates two personalized PDFs server-side (`/api/downloads/[doc]`). They are planning aids, not official government forms.

### Translation Studio

`POST /api/translate` validates the request with Zod, checks the Base Tool entitlement, applies a per-user burst limit and a durable 30-day quota, then calls Claude with structured outputs (`src/lib/translator.ts`). The model returns:

- a 200 to 500 word, first-person application summary (objective, role, responsibilities, deliverables, outcome)
- task statements mapped to the five process groups (Initiating, Planning, Executing, Monitoring and Controlling, Closing)
- a military-to-civilian jargon glossary, audit flags to resolve, and a suggested verifier role

The system prompt forbids inventing numbers or responsibilities: PMI audits applications and a supervisor must sign off on every line. The client computes an **audit-density score** (`src/lib/audit-density.ts`) from length, lifecycle coverage, quantified outcomes, leftover jargon, first-person ownership, and required elements. Results support one-click copy and PDF export.

Note on the "5 domains" framing: Initiating through Closing are PMBOK process groups. PMI's current application asks for a project description (objective, outcome, role, responsibilities, deliverables), so the studio produces that narrative and uses the process groups as supporting evidence.

### Study Vault

38 cards tagged by exam domain (People 33%, Process 41%, Business Environment 26% under the July 2026 exam outline) and by approach (predictive, agile, hybrid). Cards flip and swipe; answers move them through five Leitner boxes. Progress lives in `localStorage` and syncs to Supabase for Exam Vault owners. The resource directory covers PMI Study Hall, Pocket Prep, Andrew Ramdayal's Udemy course, the PMBOK Guide Eighth Edition (which superseded the Seventh in November 2025), and military-specific programs.

## Payments

```
Pricing page ──► POST /api/checkout ──► Stripe Checkout (card saved with consent, setup_future_usage=off_session)
                                              │
            ┌─────────────────────────────────┴──────────────────────────────┐
            ▼                                                                ▼
 /checkout/success → GET /api/checkout/verify                POST /api/webhooks/stripe
 (fulfills from Stripe's record, then redirects               (signature-verified, ledgered in
  into /dashboard?welcome=…)                                    stripe_events, retried on failure)
            └───────────── both call the same idempotent fulfillment ────────┘

Dashboard / Vault / Funding "1-click" ──► POST /api/upsell
   └─ off-session PaymentIntent on the saved card → instant unlock
   └─ no saved card, or the bank requires authentication → falls back to Checkout
```

- Prices live in `src/lib/catalog.ts` (single source of truth; Checkout uses inline `price_data`).
- Fulfillment (`src/lib/entitlements.ts`) is idempotent through unique `(payment, product)` constraints, so the webhook and the success-page verifier can race safely. A replayed webhook after a refund does not re-grant access.
- `charge.refunded` (full refund) revokes the matching entitlements.
- Add-ons require the Base Tool, either already owned or in the same cart.

## Getting started

Requirements: Node.js 20.9 or later.

```bash
npm install
cp .env.example .env.local   # fill in what you have; everything is optional at boot
npm run dev
```

The site runs with no keys. Purchases, sign-in, and live translations return a clear "not configured" error until their integration is set up. `GET /api/health` reports which integrations are configured (never their values).

### Supabase

1. Create a project and copy the URL, publishable key, and secret key into `.env.local`.
2. Apply `supabase/migrations/20261021000000_initial_schema.sql` (SQL editor, or `supabase db push` with the CLI).
3. Under **Authentication → URL Configuration**, set the Site URL and add `http://localhost:3000/**` and `https://<your-domain>/**` as redirect URLs (the callback carries a `?next=` query, so use the wildcard form). Sign-in uses email magic links.

All tables have row-level security. Users can read their own rows and write only their profile and flashcard progress; purchases, entitlements, Stripe state, and the usage ledger are written by the server with the secret key.

### Stripe

1. Put your secret key in `STRIPE_SECRET_KEY`.
2. Create a webhook endpoint at `https://<your-domain>/api/webhooks/stripe` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `payment_intent.succeeded`, and `charge.refunded`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
3. Locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

### Anthropic

Set `ANTHROPIC_API_KEY`. The default model is `claude-opus-5-5` (override with `ANTHROPIC_MODEL`). Requests use structured outputs, `effort: "medium"`, a cached system prompt, and server-side refusal fallbacks (`fallbacks: "default"`).

## Scripts

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Development server                              |
| `npm run build`     | Production build                                |
| `npm run typecheck` | Generate route types and run `tsc --noEmit`     |
| `npm run lint`      | ESLint (Next.js core-web-vitals and TypeScript) |
| `npm run test`      | Vitest unit tests                               |
| `npm run format`    | Prettier (with Tailwind class sorting)          |
| `npm run check`     | Typecheck, lint, format check, and tests        |

## Repository layout

```
supabase/migrations/          Schema, RLS policies, signup trigger
src/proxy.ts                  Supabase session refresh (Next 16 replacement for middleware)
src/app/                      Routes: pages plus api/ route handlers
  api/translate               Claude translation (auth, entitlement, rate limit, quota)
  api/checkout, checkout/verify, upsell, webhooks/stripe   Payments
  api/downloads/[doc]         Gated PDF generation
  api/entitlements, flashcards/progress, health
  auth/callback, auth/signout Magic-link session exchange and sign-out
src/components/               UI by module (home, eligibility, pricing, funding, translate, vault, dashboard, ui)
src/lib/                      Domain logic, integrations, content data (unit-tested where pure)
```

## Security and data handling

- Secrets are read only on the server (`src/lib/env.ts` validates them with Zod). The Supabase secret key is used only in `src/lib/supabase/admin.ts`.
- Every route that touches user data verifies the session server-side; client-side gating is for display only.
- The burst rate limiter is in process memory. On multi-instance hosting it is per instance; the 30-day translation quota is enforced in Postgres and holds across instances. Move the limiter to Redis or similar if you need strict global limits.
- Evaluation bullets are sent to the Anthropic API. The studio tells members to remove classified, CUI, and sensitive personal information first. Review this against your own data-handling obligations before launch.

## Known gaps

- The flashcard deck has 38 cards. A $17 vault needs several hundred to compete with existing apps.
- COOL and CA program rules change by fiscal year; `src/lib/funding-data.ts` needs periodic review against the official sites.
- No end-to-end tests against live Stripe or Supabase yet; unit tests cover the pure logic and PDF generation.
