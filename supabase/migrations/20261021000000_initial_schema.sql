-- MilToPMP Enterprise: initial schema
--
-- Security model
-- * Every table has row-level security enabled.
-- * Signed-in users can read their own rows. They can write only their own
--   profile and flashcard progress.
-- * Purchases, entitlements, Stripe customers, Stripe events, and translation
--   usage are written exclusively by the server with the secret (service role)
--   key, which bypasses RLS. A user can never grant themselves a product.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  branch text check (branch in ('navy', 'army', 'air_force', 'marine_corps', 'coast_guard', 'space_force')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Stripe customers (server-only)
-- ---------------------------------------------------------------------------
create table public.stripe_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  -- Card saved with the customer's consent at checkout, used for 1-click add-ons.
  default_payment_method_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stripe_customers enable row level security;
-- No policies: only the service role can read or write.

-- ---------------------------------------------------------------------------
-- Purchases and entitlements (server-only writes)
-- ---------------------------------------------------------------------------
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null check (product_id in ('base_tool', 'cool_fast_track', 'exam_vault')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  source text not null check (source in ('checkout', 'upsell')),
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  created_at timestamptz not null default now(),
  -- Idempotency: replayed webhooks and the success-page verifier can race
  -- without double-recording a purchase.
  constraint purchases_payment_product_unique unique (stripe_payment_intent_id, product_id),
  constraint purchases_session_product_unique unique (stripe_checkout_session_id, product_id)
);

create index purchases_user_idx on public.purchases (user_id, created_at desc);

alter table public.purchases enable row level security;

create policy "purchases: read own" on public.purchases
  for select to authenticated using ((select auth.uid()) = user_id);

create table public.entitlements (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null check (product_id in ('base_tool', 'cool_fast_track', 'exam_vault')),
  purchase_id uuid references public.purchases (id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (user_id, product_id)
);

alter table public.entitlements enable row level security;

create policy "entitlements: read own" on public.entitlements
  for select to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Stripe webhook ledger (server-only)
-- ---------------------------------------------------------------------------
create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.stripe_events enable row level security;

-- ---------------------------------------------------------------------------
-- Flashcard progress (user-owned)
-- ---------------------------------------------------------------------------
create table public.flashcard_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id text not null,
  box smallint not null check (box between 1 and 5),
  correct integer not null default 0 check (correct >= 0),
  incorrect integer not null default 0 check (incorrect >= 0),
  last_reviewed_at timestamptz not null,
  due_at timestamptz not null,
  primary key (user_id, card_id)
);

alter table public.flashcard_progress enable row level security;

create policy "flashcards: read own" on public.flashcard_progress
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "flashcards: insert own" on public.flashcard_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "flashcards: update own" on public.flashcard_progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Translation usage ledger (server-only writes; backs the 30-day quota)
-- ---------------------------------------------------------------------------
create table public.translation_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  model text not null,
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now()
);

create index translation_usage_user_idx on public.translation_usage (user_id, created_at desc);

alter table public.translation_usage enable row level security;

create policy "translation usage: read own" on public.translation_usage
  for select to authenticated using ((select auth.uid()) = user_id);
