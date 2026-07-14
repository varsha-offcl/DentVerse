-- Milestone 2: clinical records and billing.
-- Adds chart_notes, prescriptions, treatment_plans (+phases),
-- patient_images, patient_reports, invoices, and three Storage buckets.
--
-- RLS split, per the roadmap's original design (DentVerseDocs
-- 02-architecture / 03-backend-roadmap §4.2): clinical tables are
-- doctor/admin-only at the database level, not just hidden in the UI —
-- a receptionist's Postgres role has no path to chart_notes,
-- prescriptions, treatment_plans, or patient images/reports. invoices
-- is the one billing-adjacent table all three staff roles can use,
-- matching Billing & Payments being a receptionist screen while also
-- appearing read-only in the doctor's Patient Workspace.
--
-- Idempotent throughout, matching every migration so far.

-- ============================================================
-- chart_notes
-- ============================================================
create table if not exists public.chart_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid references public.profiles (id) on delete set null,
  date date not null,
  title text not null,
  soap jsonb not null default '{"subjective":"","objective":"","assessment":"","plan":""}'::jsonb,
  recorded_via text not null default 'Manual Entry'
    check (recorded_via in ('Voice-to-Chart AI', 'Manual Entry')),
  raw_transcript text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.chart_notes is
  'recorded_via stays "Manual Entry" for real saves until Milestone 7 wires the actual Sarvam AI pipeline — the Voice-to-Chart screen''s AI stages are a UI simulation today, only the final save is real.';

create index if not exists chart_notes_tenant_id_idx on public.chart_notes (tenant_id);
create index if not exists chart_notes_patient_id_idx on public.chart_notes (patient_id);

drop trigger if exists set_chart_notes_updated_at on public.chart_notes;
create trigger set_chart_notes_updated_at
  before update on public.chart_notes
  for each row execute function public.set_updated_at();

-- ============================================================
-- prescriptions
-- ============================================================
create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid references public.profiles (id) on delete set null,
  date date not null,
  medicines jsonb not null default '[]'::jsonb,
  notes text,
  status text not null default 'Draft'
    check (status in ('Draft', 'Sent to Patient')),
  signed boolean not null default false,
  pdf_storage_path text,
  pdf_sha256 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.prescriptions is
  'pdf_storage_path/pdf_sha256 are a real generated + hashed PDF (client-side, jsPDF), not a legally-recognized digital signature certificate — see DentVerseDocs 06-ai-workflows for that scoping distinction.';

create index if not exists prescriptions_tenant_id_idx on public.prescriptions (tenant_id);
create index if not exists prescriptions_patient_id_idx on public.prescriptions (patient_id);

drop trigger if exists set_prescriptions_updated_at on public.prescriptions;
create trigger set_prescriptions_updated_at
  before update on public.prescriptions
  for each row execute function public.set_updated_at();

-- ============================================================
-- treatment_plans + treatment_plan_phases
-- Phases are a child table, not JSONB — phase status is individually
-- mutated over time as treatment progresses.
-- ============================================================
create table if not exists public.treatment_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid references public.profiles (id) on delete set null,
  title text not null,
  created_on date not null,
  total_cost numeric(10, 2) not null default 0,
  status text not null default 'Proposed'
    check (status in ('Proposed', 'Approved', 'In Progress', 'Completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists treatment_plans_tenant_id_idx on public.treatment_plans (tenant_id);
create index if not exists treatment_plans_patient_id_idx on public.treatment_plans (patient_id);

drop trigger if exists set_treatment_plans_updated_at on public.treatment_plans;
create trigger set_treatment_plans_updated_at
  before update on public.treatment_plans
  for each row execute function public.set_updated_at();

create table if not exists public.treatment_plan_phases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  treatment_plan_id uuid not null references public.treatment_plans (id) on delete cascade,
  name text not null,
  procedure text not null,
  cost numeric(10, 2) not null default 0,
  status text not null default 'Upcoming'
    check (status in ('Completed', 'In Progress', 'Upcoming')),
  -- Free text, not `date` — the UI's own fallback value is the literal
  -- string "TBD" when no estimate is given, not a real date.
  est_date text not null default 'TBD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists treatment_plan_phases_tenant_id_idx on public.treatment_plan_phases (tenant_id);
create index if not exists treatment_plan_phases_plan_id_idx on public.treatment_plan_phases (treatment_plan_id);

drop trigger if exists set_treatment_plan_phases_updated_at on public.treatment_plan_phases;
create trigger set_treatment_plan_phases_updated_at
  before update on public.treatment_plan_phases
  for each row execute function public.set_updated_at();

-- ============================================================
-- Atomic treatment-plan creation. A plan without its phases is
-- meaningless, so this writes both in one transaction rather than two
-- separate client-side inserts that could partially fail — same
-- SECURITY INVOKER, atomicity-only pattern as the M1 approve functions.
-- ============================================================
create or replace function public.create_treatment_plan(
  p_patient_id uuid,
  p_doctor_id uuid,
  p_title text,
  p_created_on date,
  p_total_cost numeric,
  p_status text,
  p_phases jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_plan_id uuid;
  phase jsonb;
begin
  v_tenant_id := public.current_tenant_id();

  insert into public.treatment_plans (tenant_id, patient_id, doctor_id, title, created_on, total_cost, status)
  values (v_tenant_id, p_patient_id, p_doctor_id, p_title, p_created_on, p_total_cost, p_status)
  returning id into v_plan_id;

  for phase in select * from jsonb_array_elements(p_phases)
  loop
    insert into public.treatment_plan_phases (tenant_id, treatment_plan_id, name, procedure, cost, status, est_date)
    values (
      v_tenant_id,
      v_plan_id,
      phase->>'name',
      phase->>'procedure',
      coalesce((phase->>'cost')::numeric, 0),
      coalesce(phase->>'status', 'Upcoming'),
      coalesce(phase->>'est_date', 'TBD')
    );
  end loop;

  return v_plan_id;
end;
$$;

grant execute on function public.create_treatment_plan(uuid, uuid, text, date, numeric, text, jsonb) to authenticated;

-- ============================================================
-- Atomic treatment-plan editing. Lets a doctor save a plan as a draft
-- ("Proposed") and come back later to change its title/cost/phases
-- before approving and sending it — phases are replaced wholesale
-- (delete then re-insert) rather than diffed, since the form always
-- submits the full phase list anyway. Same SECURITY INVOKER pattern
-- as create_treatment_plan.
-- ============================================================
create or replace function public.update_treatment_plan(
  p_plan_id uuid,
  p_title text,
  p_total_cost numeric,
  p_status text,
  p_phases jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant_id uuid;
  phase jsonb;
begin
  v_tenant_id := public.current_tenant_id();

  update public.treatment_plans
  set title = p_title, total_cost = p_total_cost, status = p_status
  where id = p_plan_id and tenant_id = v_tenant_id;

  delete from public.treatment_plan_phases
  where treatment_plan_id = p_plan_id and tenant_id = v_tenant_id;

  for phase in select * from jsonb_array_elements(p_phases)
  loop
    insert into public.treatment_plan_phases (tenant_id, treatment_plan_id, name, procedure, cost, status, est_date)
    values (
      v_tenant_id,
      p_plan_id,
      phase->>'name',
      phase->>'procedure',
      coalesce((phase->>'cost')::numeric, 0),
      coalesce(phase->>'status', 'Upcoming'),
      coalesce(phase->>'est_date', 'TBD')
    );
  end loop;

  return p_plan_id;
end;
$$;

grant execute on function public.update_treatment_plan(uuid, text, numeric, text, jsonb) to authenticated;

-- ============================================================
-- patient_images / patient_reports
-- storage_path points into the matching Storage bucket below, at
-- {tenant_id}/{patient_id}/{filename} — the tenant_id path segment is
-- what the Storage RLS policies key off.
-- ============================================================
create table if not exists public.patient_images (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  category text not null
    check (category in ('Clinical Photo', 'Treatment Image', 'X-Ray')),
  storage_path text not null,
  label text not null,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists patient_images_tenant_id_idx on public.patient_images (tenant_id);
create index if not exists patient_images_patient_id_idx on public.patient_images (patient_id);

create table if not exists public.patient_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  name text not null,
  type text not null default 'Uploaded Document',
  storage_path text not null,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists patient_reports_tenant_id_idx on public.patient_reports (tenant_id);
create index if not exists patient_reports_patient_id_idx on public.patient_reports (patient_id);

-- ============================================================
-- invoices — the one table in this migration open to all staff roles
-- ============================================================
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  date date not null,
  description text not null,
  amount numeric(10, 2) not null,
  amount_paid numeric(10, 2),
  status text not null default 'Pending'
    check (status in ('Paid', 'Pending', 'Partially Paid', 'Overdue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_tenant_id_idx on public.invoices (tenant_id);
create index if not exists invoices_patient_id_idx on public.invoices (patient_id);

drop trigger if exists set_invoices_updated_at on public.invoices;
create trigger set_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row-Level Security
-- ============================================================
alter table public.chart_notes enable row level security;
alter table public.prescriptions enable row level security;
alter table public.treatment_plans enable row level security;
alter table public.treatment_plan_phases enable row level security;
alter table public.patient_images enable row level security;
alter table public.patient_reports enable row level security;
alter table public.invoices enable row level security;

grant select, insert, update on public.chart_notes to authenticated;
grant select, insert, update on public.prescriptions to authenticated;
grant select, insert, update on public.treatment_plans to authenticated;
grant select, insert, update on public.treatment_plan_phases to authenticated;
grant select, insert, update, delete on public.patient_images to authenticated;
grant select, insert, update, delete on public.patient_reports to authenticated;
grant select, insert, update on public.invoices to authenticated;

drop policy if exists "chart_notes_doctor_admin" on public.chart_notes;
create policy "chart_notes_doctor_admin"
  on public.chart_notes for all
  to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_role() in ('doctor', 'admin'))
  with check (tenant_id = public.current_tenant_id() and public.current_role() in ('doctor', 'admin'));

drop policy if exists "prescriptions_doctor_admin" on public.prescriptions;
create policy "prescriptions_doctor_admin"
  on public.prescriptions for all
  to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_role() in ('doctor', 'admin'))
  with check (tenant_id = public.current_tenant_id() and public.current_role() in ('doctor', 'admin'));

drop policy if exists "treatment_plans_doctor_admin" on public.treatment_plans;
create policy "treatment_plans_doctor_admin"
  on public.treatment_plans for all
  to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_role() in ('doctor', 'admin'))
  with check (tenant_id = public.current_tenant_id() and public.current_role() in ('doctor', 'admin'));

drop policy if exists "treatment_plan_phases_doctor_admin" on public.treatment_plan_phases;
create policy "treatment_plan_phases_doctor_admin"
  on public.treatment_plan_phases for all
  to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_role() in ('doctor', 'admin'))
  with check (tenant_id = public.current_tenant_id() and public.current_role() in ('doctor', 'admin'));

drop policy if exists "patient_images_doctor_admin" on public.patient_images;
create policy "patient_images_doctor_admin"
  on public.patient_images for all
  to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_role() in ('doctor', 'admin'))
  with check (tenant_id = public.current_tenant_id() and public.current_role() in ('doctor', 'admin'));

drop policy if exists "patient_reports_doctor_admin" on public.patient_reports;
create policy "patient_reports_doctor_admin"
  on public.patient_reports for all
  to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_role() in ('doctor', 'admin'))
  with check (tenant_id = public.current_tenant_id() and public.current_role() in ('doctor', 'admin'));

drop policy if exists "invoices_all_same_tenant" on public.invoices;
create policy "invoices_all_same_tenant"
  on public.invoices for all
  to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- ============================================================
-- Storage buckets — private, RLS-gated the same way as the tables
-- above. Path convention for every object: {tenant_id}/{patient_id}/...
-- ============================================================
insert into storage.buckets (id, name, public)
values
  ('patient-images', 'patient-images', false),
  ('patient-reports', 'patient-reports', false),
  ('prescriptions', 'prescriptions', false)
on conflict (id) do nothing;

drop policy if exists "patient_images_bucket_doctor_admin" on storage.objects;
create policy "patient_images_bucket_doctor_admin"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'patient-images'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and public.current_role() in ('doctor', 'admin')
  )
  with check (
    bucket_id = 'patient-images'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and public.current_role() in ('doctor', 'admin')
  );

drop policy if exists "patient_reports_bucket_doctor_admin" on storage.objects;
create policy "patient_reports_bucket_doctor_admin"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'patient-reports'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and public.current_role() in ('doctor', 'admin')
  )
  with check (
    bucket_id = 'patient-reports'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and public.current_role() in ('doctor', 'admin')
  );

drop policy if exists "prescriptions_bucket_doctor_admin" on storage.objects;
create policy "prescriptions_bucket_doctor_admin"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'prescriptions'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and public.current_role() in ('doctor', 'admin')
  )
  with check (
    bucket_id = 'prescriptions'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and public.current_role() in ('doctor', 'admin')
  );
