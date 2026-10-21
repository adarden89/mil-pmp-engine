-- MilToPMP Enterprise: experience evidence vault, saved pathway answers, usage kinds
--
-- experience_entries is user-owned (RLS: own rows only). Each row keeps the
-- member's own words, the latest AI resume draft, and the member's edited
-- version separately, so generated wording is never mistaken for evidence.

create table public.experience_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  role text check (role is null or char_length(role) <= 160),
  start_month text check (start_month is null or start_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  end_month text check (end_month is null or end_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  -- The member's own call: a temporary effort with a defined objective, start, and finish.
  is_project boolean,
  -- The member's own call: they led or directed it (what PMI counts), rather than supported it.
  led boolean,
  objective text check (objective is null or char_length(objective) <= 2000),
  responsibilities text check (responsibilities is null or char_length(responsibilities) <= 4000),
  deliverables text check (deliverables is null or char_length(deliverables) <= 2000),
  stakeholders text check (stakeholders is null or char_length(stakeholders) <= 1000),
  outcomes text check (outcomes is null or char_length(outcomes) <= 2000),
  -- Which records back it up (evaluation period, award, after-action report). Descriptions only, no uploads.
  evidence_notes text check (evidence_notes is null or char_length(evidence_notes) <= 2000),
  verifier_role text check (verifier_role is null or char_length(verifier_role) <= 160),
  -- Reported by the member; the app cannot verify it.
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'supervisor_reviewed')),
  verification_note text check (verification_note is null or char_length(verification_note) <= 500),
  resume_draft jsonb,
  resume_final jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experience_entries_dates check (start_month is null or end_month is null or start_month <= end_month)
);

create index experience_entries_user_idx on public.experience_entries (user_id, updated_at desc);

alter table public.experience_entries enable row level security;

create policy "experience: read own" on public.experience_entries
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "experience: insert own" on public.experience_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "experience: update own" on public.experience_entries
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "experience: delete own" on public.experience_entries
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Pathway assessment answers, synced with the onboarding plan.
alter table public.member_plans add column pathway jsonb;

-- Resume translations get their own free allowance, so usage rows record which tool ran.
alter table public.translation_usage
  add column kind text not null default 'pmi_narrative' check (kind in ('pmi_narrative', 'resume_bullets'));
