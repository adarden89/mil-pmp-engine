-- MilToPMP Enterprise: saved translations, expert review product, landing attribution
--
-- saved_translations is user-owned (RLS: own rows only). The other changes
-- extend existing server-only tables.

-- ---------------------------------------------------------------------------
-- Saved translations: every successful Translation Studio run, so members can
-- reopen a draft and build a supervisor verification packet from it. Rows are
-- immutable records of what was submitted and returned, so there is no update
-- policy; members can delete their own rows.
-- ---------------------------------------------------------------------------
create table public.saved_translations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  branch text not null
    check (branch in ('navy', 'army', 'air_force', 'marine_corps', 'coast_guard', 'space_force')),
  project_title text not null check (char_length(project_title) between 1 and 160),
  civilian_project_title text not null check (char_length(civilian_project_title) between 1 and 300),
  start_month text not null check (start_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  end_month text not null check (end_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  input jsonb not null,
  translation jsonb not null,
  created_at timestamptz not null default now()
);

create index saved_translations_user_idx on public.saved_translations (user_id, created_at desc);

alter table public.saved_translations enable row level security;

create policy "saved translations: read own" on public.saved_translations
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "saved translations: insert own" on public.saved_translations
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "saved translations: delete own" on public.saved_translations
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Human expert application review: a fourth product, sold only when
-- EXPERT_REVIEW_ENABLED is set on the server.
-- ---------------------------------------------------------------------------
alter table public.purchases drop constraint purchases_product_id_check;
alter table public.purchases add constraint purchases_product_id_check
  check (product_id in ('base_tool', 'cool_fast_track', 'exam_vault', 'expert_review'));

alter table public.entitlements drop constraint entitlements_product_id_check;
alter table public.entitlements add constraint entitlements_product_id_check
  check (product_id in ('base_tool', 'cool_fast_track', 'exam_vault', 'expert_review'));

-- ---------------------------------------------------------------------------
-- Landing context captured at checkout (server-only, like the rest of the
-- attribution row): the branch landing page the buyer came from and the pay
-- grade band they chose. Coarse by design; never a name, rank, or unit.
-- ---------------------------------------------------------------------------
alter table public.checkout_attribution
  add column branch text
    check (branch is null or branch in ('navy', 'army', 'air_force', 'marine_corps', 'coast_guard', 'space_force')),
  add column paygrade_group text
    check (paygrade_group is null or paygrade_group in ('E1_E4', 'E5_E6', 'E7_E9', 'W1_W5', 'O1_O3', 'O4_PLUS')),
  add column landing_path text check (landing_path is null or char_length(landing_path) <= 200);
