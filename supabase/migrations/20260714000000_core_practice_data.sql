-- Milestone 1: core practice data.
-- Adds patients, appointments, doctor availability, and reschedule/
-- cancellation requests — all tenant_id + RLS, following the exact
-- pattern established in 20260713000000_foundations.sql.
--
-- Idempotent by design: every statement is safe to re-run even if a
-- previous attempt got partway through (CREATE ... IF NOT EXISTS /
-- DROP ... IF EXISTS + CREATE for anything that doesn't natively
-- support IF NOT EXISTS, like policies and triggers). Re-running this
-- whole file is always safe.
--
-- See:
--   DentVerseDocs/04-database/database-schema.md
--   DentVerseDocs/12-milestones/development-milestones.md

-- ============================================================
-- patients
-- ============================================================
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  name text not null,
  phone text not null,
  age integer,
  gender text check (gender in ('Male', 'Female')),
  email text,
  tags text[] not null default '{}',
  allergies text[] not null default '{}',
  medical_history jsonb not null default '{"conditions":[],"medications":[],"notes":""}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, phone)
);

comment on table public.patients is
  'Core patient record. "Member since" is created_at; last/next visit are derived from appointments, not stored, to avoid drift. balance_due is not stored — computed from invoices once that table exists in Milestone 2.';

create index if not exists patients_tenant_id_idx on public.patients (tenant_id);

drop trigger if exists set_patients_updated_at on public.patients;
create trigger set_patients_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

-- ============================================================
-- appointments
-- ============================================================
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid references public.profiles (id) on delete set null,
  date date not null,
  time text not null,
  duration text,
  type text not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  source text not null default 'Manual'
    check (source in ('WhatsApp AI', 'Manual', 'Phone')),
  notes text,
  requested_at timestamptz not null default now(),
  check_in_status text
    check (check_in_status in ('Not Arrived', 'Checked In', 'In Treatment', 'Checked Out')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.appointments is
  'source is a text + CHECK, not an enum, so Instagram/Facebook (Milestone 8) can be added with a simple ALTER later.';

create index if not exists appointments_tenant_id_idx on public.appointments (tenant_id);
create index if not exists appointments_patient_id_idx on public.appointments (patient_id);
create index if not exists appointments_doctor_id_idx on public.appointments (doctor_id);
create index if not exists appointments_date_idx on public.appointments (date);

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- ============================================================
-- doctor_availability
-- One row per doctor per weekday. Vacation mode is UI-only for now —
-- the current Availability screen doesn't actually persist it either
-- (the toggle has no backing state in the prototype), so there's
-- nothing real to migrate yet. Add a vacation table when that UI
-- gains real save behavior.
-- ============================================================
create table if not exists public.doctor_availability (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  doctor_id uuid not null references public.profiles (id) on delete cascade,
  day_of_week text not null
    check (day_of_week in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  enabled boolean not null default true,
  slots_label text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, day_of_week)
);

comment on table public.doctor_availability is
  'slots_label is free text (e.g. "9:00 AM - 1:00 PM, 3:00 PM - 7:00 PM"), matching what the current Availability screen actually edits. Becomes structured start/end times when the AI slot-proposal logic (Milestone 5) needs to compute availability programmatically.';

create index if not exists doctor_availability_tenant_id_idx on public.doctor_availability (tenant_id);

drop trigger if exists set_doctor_availability_updated_at on public.doctor_availability;
create trigger set_doctor_availability_updated_at
  before update on public.doctor_availability
  for each row execute function public.set_updated_at();

-- ============================================================
-- reschedule_requests
-- current_date/current_time are snapshotted at request time because
-- approving the request overwrites the linked appointment's date/time
-- — without the snapshot, the "moving from X to Y" info would be lost.
-- ============================================================
create table if not exists public.reschedule_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  current_date_snapshot date not null,
  current_time_snapshot text not null,
  requested_date date not null,
  requested_time text not null,
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'denied')),
  requested_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reschedule_requests_tenant_id_idx on public.reschedule_requests (tenant_id);

drop trigger if exists set_reschedule_requests_updated_at on public.reschedule_requests;
create trigger set_reschedule_requests_updated_at
  before update on public.reschedule_requests
  for each row execute function public.set_updated_at();

-- ============================================================
-- cancellation_requests
-- No snapshot needed — cancelling doesn't change the appointment's
-- date/time/type, only its status, so those display fields can just
-- be joined from the linked appointment.
-- ============================================================
create table if not exists public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'denied')),
  requested_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cancellation_requests_tenant_id_idx on public.cancellation_requests (tenant_id);

drop trigger if exists set_cancellation_requests_updated_at on public.cancellation_requests;
create trigger set_cancellation_requests_updated_at
  before update on public.cancellation_requests
  for each row execute function public.set_updated_at();

-- ============================================================
-- Atomic approval functions.
-- SECURITY INVOKER (not DEFINER) — the calling user already has the
-- right grants via RLS below; this just makes the two-table update
-- atomic instead of two separate client-side calls that could
-- partially fail. CREATE OR REPLACE is already idempotent.
-- ============================================================
create or replace function public.approve_reschedule_request(request_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  req public.reschedule_requests%rowtype;
begin
  select * into req from public.reschedule_requests where id = request_id;
  if not found then
    raise exception 'Reschedule request not found';
  end if;

  update public.reschedule_requests set status = 'approved' where id = request_id;

  update public.appointments
    set date = req.requested_date, time = req.requested_time, status = 'confirmed'
    where id = req.appointment_id;
end;
$$;

grant execute on function public.approve_reschedule_request(uuid) to authenticated;

create or replace function public.approve_cancellation_request(request_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  req public.cancellation_requests%rowtype;
begin
  select * into req from public.cancellation_requests where id = request_id;
  if not found then
    raise exception 'Cancellation request not found';
  end if;

  update public.cancellation_requests set status = 'approved' where id = request_id;

  update public.appointments set status = 'cancelled' where id = req.appointment_id;
end;
$$;

grant execute on function public.approve_cancellation_request(uuid) to authenticated;

-- ============================================================
-- Row-Level Security — same tenant_id + current_tenant_id() pattern
-- as M0. All three staff roles get full read/write on these
-- operational tables, except doctor_availability (own-row-only for
-- doctors). The two request tables' UPDATE (approve/deny) step
-- allows all three staff roles too: reschedule/cancellation is a
-- doctor+receptionist+admin operational action, not receptionist-only
-- — staff-initiated requests are created and approved in one action
-- (see approve_reschedule_request/approve_cancellation_request calls
-- from src/context/AppStateContext.tsx), with pending-status rows
-- reserved for AI-initiated exception cases starting Milestone 5.
--
-- ALTER ... ENABLE ROW LEVEL SECURITY and GRANT are already
-- idempotent. CREATE POLICY is not — Postgres has no
-- "IF NOT EXISTS" for policies, so each one is dropped first.
-- ============================================================
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.doctor_availability enable row level security;
alter table public.reschedule_requests enable row level security;
alter table public.cancellation_requests enable row level security;

grant select, insert, update on public.patients to authenticated;
grant select, insert, update on public.appointments to authenticated;
grant select, insert, update on public.doctor_availability to authenticated;
grant select, insert, update on public.reschedule_requests to authenticated;
grant select, insert, update on public.cancellation_requests to authenticated;

drop policy if exists "patients_all_same_tenant" on public.patients;
create policy "patients_all_same_tenant"
  on public.patients for all
  to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

drop policy if exists "appointments_all_same_tenant" on public.appointments;
create policy "appointments_all_same_tenant"
  on public.appointments for all
  to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

drop policy if exists "doctor_availability_select_same_tenant" on public.doctor_availability;
create policy "doctor_availability_select_same_tenant"
  on public.doctor_availability for select
  to authenticated
  using (tenant_id = public.current_tenant_id());

drop policy if exists "doctor_availability_write_own_or_admin" on public.doctor_availability;
create policy "doctor_availability_write_own_or_admin"
  on public.doctor_availability for all
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (doctor_id = auth.uid() or public.current_role() = 'admin')
  )
  with check (
    tenant_id = public.current_tenant_id()
    and (doctor_id = auth.uid() or public.current_role() = 'admin')
  );

drop policy if exists "reschedule_requests_select_same_tenant" on public.reschedule_requests;
create policy "reschedule_requests_select_same_tenant"
  on public.reschedule_requests for select
  to authenticated
  using (tenant_id = public.current_tenant_id());

drop policy if exists "reschedule_requests_insert_same_tenant" on public.reschedule_requests;
create policy "reschedule_requests_insert_same_tenant"
  on public.reschedule_requests for insert
  to authenticated
  with check (tenant_id = public.current_tenant_id());

-- Doctor, receptionist, and admin can all approve — confirmed in product
-- discussion that reschedule/cancellation is not receptionist-only (a
-- doctor running late needs to shift patients directly too). Both the
-- old narrower policy name and the current one are dropped first so this
-- is safe to re-run whichever state the database is currently in.
drop policy if exists "reschedule_requests_update_fd_admin" on public.reschedule_requests;
drop policy if exists "reschedule_requests_update_staff" on public.reschedule_requests;
create policy "reschedule_requests_update_staff"
  on public.reschedule_requests for update
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('doctor', 'receptionist', 'admin')
  )
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('doctor', 'receptionist', 'admin')
  );

drop policy if exists "cancellation_requests_select_same_tenant" on public.cancellation_requests;
create policy "cancellation_requests_select_same_tenant"
  on public.cancellation_requests for select
  to authenticated
  using (tenant_id = public.current_tenant_id());

drop policy if exists "cancellation_requests_insert_same_tenant" on public.cancellation_requests;
create policy "cancellation_requests_insert_same_tenant"
  on public.cancellation_requests for insert
  to authenticated
  with check (tenant_id = public.current_tenant_id());

drop policy if exists "cancellation_requests_update_fd_admin" on public.cancellation_requests;
drop policy if exists "cancellation_requests_update_staff" on public.cancellation_requests;
create policy "cancellation_requests_update_staff"
  on public.cancellation_requests for update
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('doctor', 'receptionist', 'admin')
  )
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('doctor', 'receptionist', 'admin')
  );
