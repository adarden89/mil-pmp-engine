-- MilToPMP Enterprise: onboarding plans, ad attribution, conversion and email ledgers
--
-- member_plans is user-owned (RLS: own rows only). Every other table here is
-- server-only: RLS is enabled with no policies, so only the secret key can
-- read or write it.

-- ---------------------------------------------------------------------------
-- Onboarding plan: quiz answers, roadmap progress, Accidental PM mapper
-- ---------------------------------------------------------------------------
create table public.member_plans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  input jsonb,
  completed text[] not null default '{}',
  mapper jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.member_plans enable row level security;

create policy "plans: read own" on public.member_plans
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "plans: insert own" on public.member_plans
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "plans: update own" on public.member_plans
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Checkout attribution (server-only). Captured when a Checkout Session is
-- created so the webhook can send server-side conversions with the browser's
-- click ids. Holds IP and user agent: purge rows older than 90 days.
-- ---------------------------------------------------------------------------
create table public.checkout_attribution (
  checkout_session_id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  fbp text,
  fbc text,
  ttclid text,
  ttp text,
  client_ip text,
  user_agent text,
  event_source_url text,
  consent text not null default 'unknown' check (consent in ('granted', 'denied', 'unknown')),
  created_at timestamptz not null default now()
);

create index checkout_attribution_created_idx on public.checkout_attribution (created_at);

alter table public.checkout_attribution enable row level security;

-- ---------------------------------------------------------------------------
-- Conversion event ledger (server-only): one row per platform/event so Stripe
-- webhook retries never double-report a purchase.
-- ---------------------------------------------------------------------------
create table public.conversion_events (
  id bigint generated always as identity primary key,
  platform text not null check (platform in ('meta', 'tiktok')),
  event_name text not null,
  event_id text not null,
  status text not null check (status in ('pending', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  response_code integer,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversion_events_unique unique (platform, event_name, event_id)
);

alter table public.conversion_events enable row level security;

-- ---------------------------------------------------------------------------
-- Transactional email ledger (server-only): dedupes access emails per purchase.
-- ---------------------------------------------------------------------------
create table public.email_deliveries (
  id bigint generated always as identity primary key,
  dedupe_key text not null unique,
  kind text not null,
  to_email text not null,
  provider_message_id text,
  status text not null check (status in ('pending', 'sent', 'failed')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.email_deliveries enable row level security;
