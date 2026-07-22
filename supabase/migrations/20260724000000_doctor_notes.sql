-- Doctor Notes: a doctor's own personal reminders/scratchpad — not tied to
-- any patient (that's patient_notes, a separate table). Typed or dictated,
-- same transcription pipeline, no SOAP structuring, same as patient_notes.
--
-- Deliberately private to the authoring doctor: unlike chart_notes/
-- patient_notes, admins do NOT get an override here. This is a personal
-- tool ("things to remember"), not a clinical record the clinic owns.

create table if not exists public.doctor_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  doctor_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists doctor_notes_doctor_id_idx on public.doctor_notes (doctor_id);
create index if not exists doctor_notes_doctor_pinned_created_idx
  on public.doctor_notes (doctor_id, pinned desc, created_at desc);

drop trigger if exists set_doctor_notes_updated_at on public.doctor_notes;
create trigger set_doctor_notes_updated_at
  before update on public.doctor_notes
  for each row execute function public.set_updated_at();

alter table public.doctor_notes enable row level security;

-- Own rows only — no admin override, no other-doctor visibility. A doctor's
-- personal reminders aren't a clinic-owned clinical record.
drop policy if exists "doctor_notes_own_rows" on public.doctor_notes;
create policy "doctor_notes_own_rows"
  on public.doctor_notes for all
  to authenticated
  using (tenant_id = public.current_tenant_id() and doctor_id = auth.uid())
  with check (tenant_id = public.current_tenant_id() and doctor_id = auth.uid());
