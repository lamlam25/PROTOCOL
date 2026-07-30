-- PROTOCOL36 core schema.
-- Enums are text + CHECK constraints (not native Postgres enums) so adding a
-- new status/category later is a plain migration, not an ALTER TYPE dance.

-- ============================================================================
-- profiles (1:1 with auth.users)
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'citizen' check (role in ('citizen', 'admin')),
  full_name text,
  phone text,
  district text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'role is never client-settable: no client UPDATE/INSERT policy exists for it. '
  'New rows are created only by handle_new_user() below.';

-- Auto-create a profile row (role always defaults to citizen) when a new
-- auth user signs up. SECURITY DEFINER so it can write despite RLS.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Generic updated_at maintenance, reused by a few tables below.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- victims (martyrs & injured)
-- ============================================================================

create table public.victims (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  full_name_bn text,
  status text not null check (status in ('martyr', 'injured')),
  age int,
  gender text,
  district text,
  upazila text,
  incident_date date,
  incident_location text,
  incident_location_bn text,
  story_summary text,
  story_summary_bn text,
  photo_ipfs_cid text,
  photo_url text,
  is_published boolean not null default false,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'flagged')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index victims_public_listing_idx
  on public.victims (status, district)
  where is_published and verification_status = 'verified';

create trigger victims_set_updated_at
  before update on public.victims
  for each row execute function public.set_updated_at();

-- ============================================================================
-- lawyers (admin-managed directory, not a login role)
-- ============================================================================

create table public.lawyers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  full_name_bn text,
  bar_registration_no text,
  specialization text[] not null default '{}',
  contact_email text,
  contact_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- cases + case_updates (public case tracker)
-- ============================================================================

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  case_number text unique,
  title text not null,
  title_bn text,
  description text,
  description_bn text,
  case_type text not null
    check (case_type in ('criminal_prosecution', 'rehabilitation', 'compensation')),
  status text not null default 'filed'
    check (status in ('filed', 'investigation', 'under_trial', 'verdict', 'closed')),
  victim_id uuid references public.victims (id),
  assigned_lawyer_id uuid references public.lawyers (id),
  court_name text,
  filed_date date,
  is_published boolean not null default false,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cases_public_listing_idx on public.cases (status) where is_published;

create trigger cases_set_updated_at
  before update on public.cases
  for each row execute function public.set_updated_at();

create table public.case_updates (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  update_text text not null,
  update_text_bn text,
  milestone_type text not null default 'other'
    check (milestone_type in ('filed', 'hearing', 'evidence_submitted', 'verdict', 'other')),
  update_date date not null default current_date,
  attachment_ipfs_cid text,
  is_published boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index case_updates_case_id_idx on public.case_updates (case_id, update_date desc);

-- ============================================================================
-- false_case_evidence (alibi evidence for fabricated-charge victims)
-- Public intake is handled by a rate-limited service-role Route Handler.
-- Evidence remains private and is never exposed through an anonymous policy.
-- ============================================================================

create table public.false_case_evidence (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid references public.profiles (id),
  accused_full_name text not null,
  accused_full_name_bn text,
  case_reference_number text,
  district text,
  description text,
  alibi_timestamp timestamptz,
  evidence_files jsonb not null default '[]'::jsonb,
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'verified', 'rejected')),
  reviewed_by uuid references public.profiles (id),
  review_notes text,
  contact_email text,
  contact_phone text,
  submitter_relationship text not null default 'self'
    check (submitter_relationship in ('self', 'representative')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index false_case_evidence_submitted_by_idx on public.false_case_evidence (submitted_by);

create trigger false_case_evidence_set_updated_at
  before update on public.false_case_evidence
  for each row execute function public.set_updated_at();

-- ============================================================================
-- budget_allocations + budget_transactions (full public transparency)
-- ============================================================================

create table public.budget_allocations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_bn text,
  category text not null
    check (category in ('medical', 'education', 'housing', 'legal_aid', 'livelihood', 'memorial', 'other')),
  allocated_amount numeric(14, 2) not null check (allocated_amount >= 0),
  currency text not null default 'BDT',
  source text,
  fiscal_period text,
  description text,
  description_bn text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.budget_transactions (
  id uuid primary key default gen_random_uuid(),
  allocation_id uuid references public.budget_allocations (id),
  victim_id uuid references public.victims (id),
  recipient_name text,
  recipient_name_bn text,
  amount numeric(14, 2) not null check (amount >= 0),
  transaction_type text not null default 'disbursement'
    check (transaction_type in ('disbursement', 'refund', 'adjustment')),
  disbursement_date date not null default current_date,
  description text,
  description_bn text,
  onchain_tx_hash text,
  ipfs_receipt_cid text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index budget_transactions_allocation_idx on public.budget_transactions (allocation_id);
create index budget_transactions_date_idx on public.budget_transactions (disbursement_date desc);

-- ============================================================================
-- volunteers + volunteer_tasks
-- ============================================================================

create table public.volunteers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id),
  full_name text not null,
  full_name_bn text,
  email text,
  phone text,
  district text,
  upazila text,
  skillsets text[] not null default '{}',
  availability text,
  motivation text,
  status text not null default 'applied'
    check (status in ('applied', 'reviewed', 'approved', 'rejected', 'inactive')),
  reviewed_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.volunteer_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_bn text,
  description text,
  description_bn text,
  task_type text not null
    check (task_type in ('field_verification', 'distribution', 'documentation', 'outreach', 'event_support', 'other')),
  district text,
  upazila text,
  geo_lat numeric,
  geo_lng numeric,
  status text not null default 'open'
    check (status in ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_volunteer_id uuid references public.volunteers (id),
  due_date date,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- archive_items (JulyStories) + timeline_events
-- ============================================================================

create table public.archive_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_bn text,
  item_type text not null
    check (item_type in ('book', 'story', 'video', 'image', 'news_clipping', 'document')),
  description text,
  description_bn text,
  content_body text,
  content_body_bn text,
  source_citation text,
  source_url text,
  media_ipfs_cid text,
  media_url text,
  thumbnail_url text,
  published_date date,
  is_published boolean not null default false,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index archive_items_public_listing_idx
  on public.archive_items (item_type)
  where is_published and verification_status = 'verified';

create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  event_time time,
  title text not null,
  title_bn text,
  description text,
  description_bn text,
  category text not null
    check (category in ('protest', 'crackdown', 'casualty', 'political', 'international', 'other')),
  related_archive_item_id uuid references public.archive_items (id),
  source_citation text,
  is_published boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index timeline_events_date_idx on public.timeline_events (event_date) where is_published;

-- ============================================================================
-- forensic_checks (ELA / pHash / OCR results, one row per uploaded file)
-- Written only by server-side Route Handlers using the service-role client.
-- ============================================================================

create table public.forensic_checks (
  id uuid primary key default gen_random_uuid(),
  related_table text not null
    check (related_table in ('victims', 'false_case_evidence', 'archive_items', 'budget_transactions')),
  related_id uuid not null,
  file_name text,
  file_type text,
  file_kind text
    check (file_kind in ('image', 'pdf', 'video', 'document', 'audio')),
  file_sha256 text not null,
  ela_score numeric,
  ela_heatmap_ipfs_cid text,
  phash text,
  phash_matches jsonb not null default '[]'::jsonb,
  ocr_raw_text text,
  ocr_extracted_fields jsonb not null default '{}'::jsonb,
  analysis_metadata jsonb not null default '{}'::jsonb,
  risk_flag text not null default 'none' check (risk_flag in ('none', 'low', 'medium', 'high')),
  reviewed_by uuid references public.profiles (id),
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  review_notes text,
  onchain_tx_hash text,
  onchain_contract_address text,
  ipfs_cid text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index forensic_checks_phash_idx on public.forensic_checks (phash);
create index forensic_checks_related_idx on public.forensic_checks (related_table, related_id);
create index forensic_checks_queue_idx on public.forensic_checks (risk_flag, review_status) where risk_flag <> 'none';

-- ============================================================================
-- submission_throttle (lightweight IP-based abuse guard, no external service)
-- ============================================================================

create table public.submission_throttle (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  route text not null,
  day date not null default current_date,
  count int not null default 1,
  unique (ip_hash, route, day)
);
