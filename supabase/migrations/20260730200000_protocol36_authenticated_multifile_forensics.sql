-- PROTOCOL36: authenticated, victim-first evidence intake with one forensic
-- record per uploaded file.

alter table public.false_case_evidence
  add column submitter_relationship text not null default 'self'
    check (submitter_relationship in ('self', 'representative'));

alter table public.forensic_checks
  add column file_name text,
  add column file_type text,
  add column file_kind text
    check (file_kind in ('image', 'pdf', 'video', 'document', 'audio')),
  add column analysis_metadata jsonb not null default '{}'::jsonb;

comment on column public.false_case_evidence.submitter_relationship is
  'Whether the signed-in citizen is the affected person or is submitting for someone else.';

comment on column public.forensic_checks.analysis_metadata is
  'Per-file applicability and provenance signals. AI-video results are risk indicators for human review, not authenticity verdicts.';
