-- Three UI requests bundled together since they touch the same records:
-- 1. A delete button on the Patient Chart (chart_notes) — parity with the
--    delete already available on patient notes/images/reports.
-- 2. A "diagnosis" field on prescriptions and treatment plans, so a doctor
--    searching by date can see what a past record was about at a glance.

-- ============================================================
-- 1. Chart note deletion. RLS policy is already `for all` (see
-- 20260715000000_clinical_records_and_billing.sql), but the GRANT for
-- chart_notes only covered select/insert/update — delete was never turned
-- on at the privilege layer, so RLS was never even reached.
-- ============================================================
grant delete on public.chart_notes to authenticated;

-- ============================================================
-- 2. Diagnosis columns. Nullable/free text, same spirit as
-- prescriptions.notes — optional context, not a coded diagnosis list.
-- ============================================================
alter table public.prescriptions
  add column if not exists diagnosis text;

alter table public.treatment_plans
  add column if not exists diagnosis text;

-- create_treatment_plan / update_treatment_plan are RPCs (not direct
-- inserts/updates), so the new field needs plumbing through both. Appending
-- a defaulted arg changes the function's argument-type signature, so
-- CREATE OR REPLACE would leave the old 6/5-arg version behind as a
-- separate overload — drop it explicitly first to avoid that.
drop function if exists public.create_treatment_plan(uuid, uuid, text, date, numeric, text, jsonb);

create function public.create_treatment_plan(
  p_patient_id uuid,
  p_doctor_id uuid,
  p_title text,
  p_created_on date,
  p_total_cost numeric,
  p_status text,
  p_phases jsonb,
  p_diagnosis text default null
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

  insert into public.treatment_plans (tenant_id, patient_id, doctor_id, title, created_on, total_cost, status, diagnosis)
  values (v_tenant_id, p_patient_id, p_doctor_id, p_title, p_created_on, p_total_cost, p_status, p_diagnosis)
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

grant execute on function public.create_treatment_plan(uuid, uuid, text, date, numeric, text, jsonb, text) to authenticated;

drop function if exists public.update_treatment_plan(uuid, text, numeric, text, jsonb);

create function public.update_treatment_plan(
  p_plan_id uuid,
  p_title text,
  p_total_cost numeric,
  p_status text,
  p_phases jsonb,
  p_diagnosis text default null
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
  set title = p_title, total_cost = p_total_cost, status = p_status, diagnosis = p_diagnosis
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

grant execute on function public.update_treatment_plan(uuid, text, numeric, text, jsonb, text) to authenticated;
