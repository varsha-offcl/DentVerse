-- Milestone 1 follow-up: a human-friendly, per-tenant sequential patient
-- number, separate from the UUID primary key.
--
-- The `id` column stays a UUID on purpose — it's the real primary key,
-- it's what appears in URLs (/patient/:id), and a sequential integer
-- there would let anyone guess other patients' IDs or infer how many
-- patients a clinic has just by looking at the number. patient_number is
-- purely a display convenience (front desk saying "patient number 42"),
-- never used for routing/joins.
--
-- Safe to re-run: adds the column/trigger/constraint only if missing,
-- and only backfills rows that don't have a number yet.

alter table public.patients add column if not exists patient_number integer;

-- Assigns the next number for a tenant on insert, if the caller didn't
-- supply one. A tiny race window exists under truly concurrent inserts
-- for the same tenant (two receptionists creating a patient in the same
-- clinic at the same instant); the unique constraint below turns that
-- into a clear insert failure to retry, rather than a silent duplicate —
-- an acceptable tradeoff at single-clinic scale. A per-tenant counter
-- table with row locking would close the window entirely if this ever
-- becomes a real issue.
create or replace function public.set_patient_number()
returns trigger
language plpgsql
as $$
begin
  if new.patient_number is null then
    select coalesce(max(patient_number), 0) + 1
      into new.patient_number
      from public.patients
      where tenant_id = new.tenant_id;
  end if;
  return new;
end;
$$;

drop trigger if exists set_patients_patient_number on public.patients;
create trigger set_patients_patient_number
  before insert on public.patients
  for each row execute function public.set_patient_number();

-- Backfill any existing patients (e.g. created before this migration)
-- with numbers in their original creation order, per tenant.
with numbered as (
  select id, row_number() over (partition by tenant_id order by created_at) as rn
  from public.patients
  where patient_number is null
)
update public.patients p
set patient_number = numbered.rn
from numbered
where p.id = numbered.id;

alter table public.patients alter column patient_number set not null;

drop index if exists patients_tenant_id_patient_number_idx;
create unique index patients_tenant_id_patient_number_idx
  on public.patients (tenant_id, patient_number);
