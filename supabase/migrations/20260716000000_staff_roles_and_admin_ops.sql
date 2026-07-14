-- Milestone 3: staff, roles & admin ops.
-- Adds staff_invites (link-based invitations, no Edge Function/email
-- provider needed), notifications, audit_logs, system_logs, plus real
-- audit-trail triggers on the tables actions already happen against.
--
-- Idempotent throughout, matching every migration so far.
--
-- See:
--   DentVerseDocs/04-database/database-schema.md
--   DentVerseDocs/05-api/api-documentation.md
--   DentVerseDocs/12-milestones/development-milestones.md

-- ============================================================
-- profiles: admins can manage other staff rows in their tenant
-- (status, role, title, name) — profiles_update_own_row (M0) only
-- lets someone update their own row, which was correct until there
-- was any notion of an admin managing a directory of other staff.
-- Postgres OR's multiple permissive policies for the same command,
-- so this is additive, not a replacement.
-- ============================================================
drop policy if exists "profiles_update_admin_same_tenant" on public.profiles;
create policy "profiles_update_admin_same_tenant"
  on public.profiles for update
  to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_role() = 'admin')
  with check (tenant_id = public.current_tenant_id() and public.current_role() = 'admin');

-- ============================================================
-- clinics: new Clinic Settings fields. `name` and `address` already
-- existed (Milestone 0); phone and the AI automation toggles are new.
-- Nothing reads the toggles yet (the AI receptionist doesn't exist
-- until Milestone 5) — they're real, persisted settings a future
-- milestone will honor, not fake switches.
-- ============================================================
alter table public.clinics add column if not exists phone text;
alter table public.clinics add column if not exists ai_booking_enabled boolean not null default true;
alter table public.clinics add column if not exists ai_reminders_enabled boolean not null default true;
alter table public.clinics add column if not exists ai_auto_escalate_enabled boolean not null default true;

-- ============================================================
-- staff_invites
-- Link-based invitations: an admin creates a row, gets back a token,
-- and shares the resulting /join?invite=<token> link themselves
-- (WhatsApp, email, however) — deliberately not an automatic email
-- send, which would need a Supabase Edge Function + SMTP/email
-- provider this project hasn't set up. See
-- DentVerseDocs/05-api/api-documentation.md for the full reasoning.
-- ============================================================
create table if not exists public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  email text not null,
  role public.staff_role not null,
  name text not null,
  invited_by uuid references public.profiles (id) on delete set null,
  token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked boolean not null default false
);

create index if not exists staff_invites_tenant_id_idx on public.staff_invites (tenant_id);

-- Only one active (unaccepted, unrevoked, unexpired-by-clock but we
-- don't bother excluding expired here) pending invite per email per
-- tenant at a time — re-inviting after a revoke or acceptance is fine.
create unique index if not exists staff_invites_active_email_idx
  on public.staff_invites (tenant_id, lower(email))
  where accepted_at is null and revoked = false;

alter table public.staff_invites enable row level security;
grant select, insert, update on public.staff_invites to authenticated;

drop policy if exists "staff_invites_admin_only" on public.staff_invites;
create policy "staff_invites_admin_only"
  on public.staff_invites for all
  to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_role() = 'admin')
  with check (tenant_id = public.current_tenant_id() and public.current_role() = 'admin');

-- Callable by a not-yet-signed-up visitor (anon) who just has the link,
-- so it only ever reveals what the token itself already grants access
-- to — clinic name, role, invited email — never the tenant's real data.
create or replace function public.get_staff_invite(p_token uuid)
returns table (clinic_name text, role public.staff_role, email text, name text, valid boolean)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.name as clinic_name,
    si.role,
    si.email,
    si.name,
    (si.accepted_at is null and si.revoked = false and si.expires_at > now()) as valid
  from public.staff_invites si
  join public.clinics c on c.id = si.tenant_id
  where si.token = p_token;
$$;

grant execute on function public.get_staff_invite(uuid) to anon, authenticated;

-- ============================================================
-- notifications
-- Staff-facing only. Addressed to a specific person (target_user_id)
-- or broadcast to everyone with a role (target_role) — a role-target
-- notification's `read` flag is shared across everyone holding that
-- role (e.g. one receptionist marking it read marks it read for all
-- receptionists). A known simplification: correct for the realistic
-- case of one or two people per role per clinic, revisit with a
-- per-recipient read-state join table if that stops being true.
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  target_role public.staff_role,
  target_user_id uuid references public.profiles (id) on delete cascade,
  type text not null default 'system'
    check (type in ('request', 'reschedule', 'payment', 'ai', 'cancellation', 'system')),
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_target_check check (target_role is not null or target_user_id is not null)
);

create index if not exists notifications_tenant_id_idx on public.notifications (tenant_id);

alter table public.notifications enable row level security;
grant select, update on public.notifications to authenticated;
-- No insert grant — every row is written by a SECURITY DEFINER
-- function/trigger, same trust boundary as audit_logs below.

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (target_user_id = auth.uid() or target_role = public.current_role())
  );

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (target_user_id = auth.uid() or target_role = public.current_role())
  )
  with check (
    tenant_id = public.current_tenant_id()
    and (target_user_id = auth.uid() or target_role = public.current_role())
  );

-- ============================================================
-- audit_logs / system_logs — admin-only, read-only from the client.
-- No insert grant to `authenticated` for either: audit_logs is fed by
-- SECURITY DEFINER triggers below (a client can't fabricate entries),
-- system_logs stays genuinely empty until a real integration
-- (WhatsApp Milestone 4, Sarvam AI Milestone 7, ...) starts writing to
-- it — no seeded fake rows.
-- ============================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  actor_name text not null,
  action text not null,
  target text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_tenant_id_idx on public.audit_logs (tenant_id);

alter table public.audit_logs enable row level security;
grant select on public.audit_logs to authenticated;

drop policy if exists "audit_logs_admin_only" on public.audit_logs;
create policy "audit_logs_admin_only"
  on public.audit_logs for select
  to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_role() = 'admin');

create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  level text not null default 'info' check (level in ('info', 'warning', 'error')),
  message text not null,
  source text not null,
  created_at timestamptz not null default now()
);

create index if not exists system_logs_tenant_id_idx on public.system_logs (tenant_id);

alter table public.system_logs enable row level security;
grant select on public.system_logs to authenticated;

drop policy if exists "system_logs_admin_only" on public.system_logs;
create policy "system_logs_admin_only"
  on public.system_logs for select
  to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_role() = 'admin');

-- ============================================================
-- accept_staff_invite. Mirrors create_clinic_and_admin_profile's
-- shape exactly: the new user has already called supabase.auth.signUp()
-- and (after confirming their email and signing in) is calling this
-- with a real session, but still has no profile row and therefore no
-- tenant/role — this function is the trust boundary, same reasoning
-- as clinic self-signup.
-- ============================================================
create or replace function public.accept_staff_invite(p_token uuid, p_name text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.staff_invites;
  new_profile public.profiles;
  initials text;
  name_parts text[];
begin
  if auth.uid() is null then
    raise exception 'Must be authenticated to accept an invite';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'This account already has a profile';
  end if;

  select * into inv from public.staff_invites where token = p_token;

  if inv.id is null then
    raise exception 'Invite not found';
  end if;
  if inv.revoked then
    raise exception 'This invite has been revoked';
  end if;
  if inv.accepted_at is not null then
    raise exception 'This invite has already been used';
  end if;
  if inv.expires_at <= now() then
    raise exception 'This invite has expired';
  end if;
  if lower(inv.email) <> lower(auth.email()) then
    raise exception 'This invite was sent to a different email address';
  end if;

  name_parts := regexp_split_to_array(trim(p_name), '\s+');
  initials := upper(
    coalesce(left(name_parts[1], 1), '') ||
    coalesce(left(name_parts[array_length(name_parts, 1)], 1), '')
  );

  insert into public.profiles (id, tenant_id, role, name, email, avatar_initials)
  values (auth.uid(), inv.tenant_id, inv.role, p_name, auth.email(), initials)
  returning * into new_profile;

  update public.staff_invites set accepted_at = now() where id = inv.id;

  insert into public.notifications (tenant_id, target_role, type, title, message)
  values (
    inv.tenant_id,
    'admin',
    'system',
    'New staff member joined',
    p_name || ' has joined as ' || inv.role::text || '.'
  );

  insert into public.audit_logs (tenant_id, actor_name, action, target)
  values (inv.tenant_id, p_name, 'Joined as staff', initcap(inv.role::text));

  return new_profile;
end;
$$;

grant execute on function public.accept_staff_invite(uuid, text) to authenticated;

-- ============================================================
-- Audit trail — real triggers, not a manual insert scattered across
-- the frontend. `log_audit` is the shared writer; it has no grant to
-- `authenticated` on purpose, so only these SECURITY DEFINER trigger
-- functions (which run as the function owner regardless of grants,
-- the same mechanism create_clinic_and_admin_profile already relies
-- on) can ever create an audit_logs row.
-- ============================================================
create or replace function public.current_actor_name()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select name from public.profiles where id = auth.uid();
$$;

grant execute on function public.current_actor_name() to authenticated;

create or replace function public.log_audit(p_tenant_id uuid, p_action text, p_target text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_logs (tenant_id, actor_name, action, target)
  values (p_tenant_id, coalesce(public.current_actor_name(), 'System'), p_action, p_target);
$$;

revoke execute on function public.log_audit(uuid, text, text) from public;

-- appointments: confirmed / cancelled / completed / checked in
create or replace function public.audit_appointments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p_name text;
begin
  select name into p_name from public.patients where id = new.patient_id;

  if new.status is distinct from old.status then
    if new.status = 'confirmed' then
      perform public.log_audit(new.tenant_id, 'Confirmed appointment', p_name);
    elsif new.status = 'cancelled' then
      perform public.log_audit(new.tenant_id, 'Cancelled appointment', p_name);
    elsif new.status = 'completed' then
      perform public.log_audit(new.tenant_id, 'Completed appointment', p_name);
    end if;
  end if;

  if new.check_in_status is distinct from old.check_in_status and new.check_in_status = 'Checked In' then
    perform public.log_audit(new.tenant_id, 'Checked in patient', p_name);
  end if;

  return new;
end;
$$;

drop trigger if exists audit_appointments_trigger on public.appointments;
create trigger audit_appointments_trigger
  after update on public.appointments
  for each row execute function public.audit_appointments();

-- reschedule_requests / cancellation_requests: approved
create or replace function public.audit_reschedule_requests()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p_name text;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    select name into p_name from public.patients where id = new.patient_id;
    perform public.log_audit(new.tenant_id, 'Approved reschedule request', p_name);
  end if;
  return new;
end;
$$;

drop trigger if exists audit_reschedule_requests_trigger on public.reschedule_requests;
create trigger audit_reschedule_requests_trigger
  after update on public.reschedule_requests
  for each row execute function public.audit_reschedule_requests();

create or replace function public.audit_cancellation_requests()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p_name text;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    select name into p_name from public.patients where id = new.patient_id;
    perform public.log_audit(new.tenant_id, 'Approved cancellation request', p_name);
  end if;
  return new;
end;
$$;

drop trigger if exists audit_cancellation_requests_trigger on public.cancellation_requests;
create trigger audit_cancellation_requests_trigger
  after update on public.cancellation_requests
  for each row execute function public.audit_cancellation_requests();

-- treatment_plans: created / approved
create or replace function public.audit_treatment_plans()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p_name text;
begin
  select name into p_name from public.patients where id = new.patient_id;

  if tg_op = 'INSERT' then
    perform public.log_audit(new.tenant_id, 'Created treatment plan', p_name || ' — ' || new.title);
  elsif new.status = 'Approved' and old.status is distinct from 'Approved' then
    perform public.log_audit(new.tenant_id, 'Approved treatment plan', p_name || ' — ' || new.title);
  end if;

  return new;
end;
$$;

drop trigger if exists audit_treatment_plans_insert_trigger on public.treatment_plans;
create trigger audit_treatment_plans_insert_trigger
  after insert on public.treatment_plans
  for each row execute function public.audit_treatment_plans();

drop trigger if exists audit_treatment_plans_update_trigger on public.treatment_plans;
create trigger audit_treatment_plans_update_trigger
  after update on public.treatment_plans
  for each row execute function public.audit_treatment_plans();

-- prescriptions: signed / sent — both an INSERT (created already
-- signed/sent) and an UPDATE (edited into that state later) can be
-- how a prescription gets there, so both are covered.
create or replace function public.audit_prescriptions_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p_name text;
begin
  select name into p_name from public.patients where id = new.patient_id;
  if new.signed = true then
    perform public.log_audit(new.tenant_id, 'Digitally signed prescription', p_name);
  end if;
  if new.status = 'Sent to Patient' then
    perform public.log_audit(new.tenant_id, 'Sent prescription', p_name);
  end if;
  return new;
end;
$$;

drop trigger if exists audit_prescriptions_insert_trigger on public.prescriptions;
create trigger audit_prescriptions_insert_trigger
  after insert on public.prescriptions
  for each row execute function public.audit_prescriptions_insert();

create or replace function public.audit_prescriptions_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p_name text;
begin
  select name into p_name from public.patients where id = new.patient_id;
  if new.signed = true and old.signed is distinct from true then
    perform public.log_audit(new.tenant_id, 'Digitally signed prescription', p_name);
  end if;
  if new.status = 'Sent to Patient' and old.status is distinct from 'Sent to Patient' then
    perform public.log_audit(new.tenant_id, 'Sent prescription', p_name);
  end if;
  return new;
end;
$$;

drop trigger if exists audit_prescriptions_update_trigger on public.prescriptions;
create trigger audit_prescriptions_update_trigger
  after update on public.prescriptions
  for each row execute function public.audit_prescriptions_update();

-- invoices: created / marked paid
create or replace function public.audit_invoices_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p_name text;
begin
  select name into p_name from public.patients where id = new.patient_id;
  perform public.log_audit(new.tenant_id, 'Created invoice', p_name || ' — ₹' || new.amount::text);
  return new;
end;
$$;

drop trigger if exists audit_invoices_insert_trigger on public.invoices;
create trigger audit_invoices_insert_trigger
  after insert on public.invoices
  for each row execute function public.audit_invoices_insert();

create or replace function public.audit_invoices_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p_name text;
begin
  if new.status = 'Paid' and old.status is distinct from 'Paid' then
    select name into p_name from public.patients where id = new.patient_id;
    perform public.log_audit(new.tenant_id, 'Marked invoice paid', p_name || ' — ₹' || new.amount::text);
  end if;
  return new;
end;
$$;

drop trigger if exists audit_invoices_update_trigger on public.invoices;
create trigger audit_invoices_update_trigger
  after update on public.invoices
  for each row execute function public.audit_invoices_update();

-- patients: registered
create or replace function public.audit_patients_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.log_audit(new.tenant_id, 'Registered patient', new.name);
  return new;
end;
$$;

drop trigger if exists audit_patients_insert_trigger on public.patients;
create trigger audit_patients_insert_trigger
  after insert on public.patients
  for each row execute function public.audit_patients_insert();

-- clinics: settings updated (clinics.id is the tenant_id itself)
create or replace function public.audit_clinics_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.log_audit(new.id, 'Updated clinic settings', new.name);
  return new;
end;
$$;

drop trigger if exists audit_clinics_update_trigger on public.clinics;
create trigger audit_clinics_update_trigger
  after update on public.clinics
  for each row execute function public.audit_clinics_update();
