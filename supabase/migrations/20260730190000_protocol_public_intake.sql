-- Historical migration: this initially enabled account-free submissions.
-- The later PROTOCOL36 migration restores authenticated citizen ownership.

alter table public.false_case_evidence
  alter column submitted_by drop not null;

drop policy if exists "authenticated users can submit evidence"
  on public.false_case_evidence;

comment on column public.false_case_evidence.submitted_by is
  'Nullable only for legacy account-free submissions; PROTOCOL36 intake records an authenticated owner.';
