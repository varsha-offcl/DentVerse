-- Patient Notes: free-form doctor notes on a patient, typed or dictated.
-- Dictated notes reuse the existing Voice-to-Chart transcription pipeline
-- (orchestrator STT call) but skip SOAP structuring entirely — a voice note
-- is just plain text, same as a typed one, indistinguishable once saved.

create table if not exists public.patient_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid references public.profiles (id) on delete set null,
  content text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists patient_notes_tenant_id_idx on public.patient_notes (tenant_id);
create index if not exists patient_notes_patient_id_idx on public.patient_notes (patient_id);
-- Pinned-first, newest-first is exactly how the list is always rendered.
create index if not exists patient_notes_patient_pinned_created_idx
  on public.patient_notes (patient_id, pinned desc, created_at desc);

drop trigger if exists set_patient_notes_updated_at on public.patient_notes;
create trigger set_patient_notes_updated_at
  before update on public.patient_notes
  for each row execute function public.set_updated_at();

alter table public.patient_notes enable row level security;

-- Same shape as chart_notes: admin sees everything in the clinic; a doctor
-- sees (and can create/edit/delete/pin) notes only for patients they have
-- access to, per the same doctor_has_patient_access() used everywhere else.
-- Receptionists have no access, same as chart_notes/prescriptions.
drop policy if exists "patient_notes_doctor_admin" on public.patient_notes;
create policy "patient_notes_doctor_admin"
  on public.patient_notes for all
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (
      public.current_role() = 'admin'
      or (public.current_role() = 'doctor' and public.doctor_has_patient_access(patient_id))
    )
  )
  with check (
    tenant_id = public.current_tenant_id()
    and (
      public.current_role() = 'admin'
      or (public.current_role() = 'doctor' and public.doctor_has_patient_access(patient_id))
    )
  );
