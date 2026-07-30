-- Row Level Security is the platform's real access-control boundary — every
-- table access from the app goes through supabase-js, which forwards the
-- caller's JWT, so these policies are the actual enforcement point (not app
-- code). See CLAUDE.md.

-- ============================================================================
-- Role helper
-- Reads the `role` claim that custom_access_token_hook (below) injects into
-- app_metadata on every issued JWT — no per-row profiles join needed.
-- ============================================================================

create function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- ============================================================================
-- Custom Access Token Hook
-- Injects the caller's profiles.role into app_metadata.role on the issued JWT.
-- Wiring this up also requires a ONE-TIME manual step in the Supabase
-- Dashboard: Authentication -> Hooks -> "Customize Access Token (JWT) Claims
-- hook" -> select public.custom_access_token_hook. Until that's done, every
-- JWT has no role claim and is_admin() safely defaults to false.
-- ============================================================================

create function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role text;
begin
  select role into user_role from public.profiles where id = (event ->> 'user_id')::uuid;

  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(
    claims,
    '{app_metadata}',
    coalesce(claims -> 'app_metadata', '{}'::jsonb) || jsonb_build_object('role', coalesce(user_role, 'citizen'))
  );

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- The Auth service calls this as `supabase_auth_admin`, which needs explicit
-- execute + read access — it does not inherit RLS-bypassing superuser rights.
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

grant usage on schema public to supabase_auth_admin;
grant select on public.profiles to supabase_auth_admin;

create policy "auth admin can read profiles for the access token hook"
  on public.profiles
  as permissive
  for select
  to supabase_auth_admin
  using (true);

-- ============================================================================
-- profiles
-- No client INSERT policy: rows are created only by handle_new_user().
-- No client UPDATE policy for now: self-service profile editing and admin
-- role management are both out of scope for this phase; role changes happen
-- via the service-role key until an admin UI for it exists.
-- ============================================================================

alter table public.profiles enable row level security;

create policy "users can read their own profile" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- ============================================================================
-- victims
-- ============================================================================

alter table public.victims enable row level security;

create policy "public can read verified published victims" on public.victims
  for select using (
    (is_published and verification_status = 'verified') or public.is_admin()
  );

create policy "admins manage victims" on public.victims
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- lawyers
-- ============================================================================

alter table public.lawyers enable row level security;

create policy "public can read active lawyers" on public.lawyers
  for select using (is_active or public.is_admin());

create policy "admins manage lawyers" on public.lawyers
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- cases + case_updates
-- ============================================================================

alter table public.cases enable row level security;

create policy "public can read published cases" on public.cases
  for select using (is_published or public.is_admin());

create policy "admins manage cases" on public.cases
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.case_updates enable row level security;

create policy "public can read published case updates" on public.case_updates
  for select using (
    is_published
    and exists (
      select 1 from public.cases c
      where c.id = case_updates.case_id and c.is_published
    )
    or public.is_admin()
  );

create policy "admins manage case updates" on public.case_updates
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- false_case_evidence
-- Never publicly readable. Submission requires an authenticated account (the
-- user decided this, since it's legally sensitive and submitters need to
-- track their own case) so the INSERT check ties the row to the caller.
-- ============================================================================

alter table public.false_case_evidence enable row level security;

create policy "submitters can read their own evidence" on public.false_case_evidence
  for select using (submitted_by = auth.uid() or public.is_admin());

create policy "authenticated users can submit evidence" on public.false_case_evidence
  for insert with check (submitted_by = auth.uid());

create policy "admins manage evidence review" on public.false_case_evidence
  for update using (public.is_admin()) with check (public.is_admin());

create policy "admins can delete evidence" on public.false_case_evidence
  for delete using (public.is_admin());

-- ============================================================================
-- budget_allocations + budget_transactions
-- Full public read, per the transparency mandate — no is_published gate.
-- ============================================================================

alter table public.budget_allocations enable row level security;

create policy "public can read budget allocations" on public.budget_allocations
  for select using (true);

create policy "admins manage budget allocations" on public.budget_allocations
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.budget_transactions enable row level security;

create policy "public can read budget transactions" on public.budget_transactions
  for select using (true);

create policy "admins manage budget transactions" on public.budget_transactions
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- volunteers
-- Anonymous applications are allowed (profile_id may be null) per the user's
-- decision to keep the volunteer form low-friction.
-- ============================================================================

alter table public.volunteers enable row level security;

create policy "applicants can read their own application" on public.volunteers
  for select using (
    (profile_id is not null and profile_id = auth.uid()) or public.is_admin()
  );

create policy "anyone can apply to volunteer" on public.volunteers
  for insert with check (profile_id is null or profile_id = auth.uid());

create policy "admins manage volunteers" on public.volunteers
  for update using (public.is_admin()) with check (public.is_admin());

create policy "admins can delete volunteers" on public.volunteers
  for delete using (public.is_admin());

-- ============================================================================
-- volunteer_tasks (admin-only for this phase — no volunteer-facing "my
-- tasks" view yet)
-- ============================================================================

alter table public.volunteer_tasks enable row level security;

create policy "admins manage volunteer tasks" on public.volunteer_tasks
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- archive_items + timeline_events (JulyStories)
-- ============================================================================

alter table public.archive_items enable row level security;

create policy "public can read verified published archive items" on public.archive_items
  for select using (
    (is_published and verification_status = 'verified') or public.is_admin()
  );

create policy "admins manage archive items" on public.archive_items
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.timeline_events enable row level security;

create policy "public can read published timeline events" on public.timeline_events
  for select using (is_published or public.is_admin());

create policy "admins manage timeline events" on public.timeline_events
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- forensic_checks + submission_throttle
-- No client policies beyond admin read/manage: these are written by
-- server-side Route Handlers using the service-role client, which bypasses
-- RLS entirely regardless of what's declared here.
-- ============================================================================

alter table public.forensic_checks enable row level security;

create policy "admins manage forensic checks" on public.forensic_checks
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.submission_throttle enable row level security;

create policy "admins can read submission throttle" on public.submission_throttle
  for select using (public.is_admin());
