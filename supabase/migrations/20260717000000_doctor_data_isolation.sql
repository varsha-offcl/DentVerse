-- Doctor data isolation.
-- Manual testing found that every doctor account in a clinic could see
-- every other doctor's appointments, patients, schedules, and clinical
-- records — patients_all_same_tenant / appointments_all_same_tenant (M1)
-- and the clinical-table policies (M2) were tenant-wide by design (any
-- staff member, or any doctor/admin for clinical tables), with no
-- per-doctor scoping. Product decision (confirmed explicitly): a doctor
-- should only see patients/appointments/schedules they actually have a
-- relationship with; a patient shared between two doctors should still
-- show its FULL clinical history to either treating doctor (continuity
-- of care / patient safety, not per-author restriction); receptionists
-- and admins are unaffected — this is a doctor-only scoping change.
--
-- Idempotent throughout, matching every migration so far.

-- ============================================================
-- patients.created_by — a doctor who registers a brand-new patient
-- (PatientList's "Add Patient") has no appointment with them yet, so
-- doctor_has_patient_access() below needs a second signal besides
-- "has an appointment with this patient" or the patient would vanish
-- from that doctor's own view the instant they created them.
-- ============================================================
alter table public.patients
  add column if not exists created_by uuid references public.profiles (id) on delete set null default auth.uid();

create index if not exists appointments_patient_doctor_idx on public.appointments (patient_id, doctor_id);
create index if not exists reschedule_requests_patient_id_idx on public.reschedule_requests (patient_id);
create index if not exists cancellation_requests_patient_id_idx on public.cancellation_requests (patient_id);

-- ============================================================
-- Shared access-check helpers, SECURITY DEFINER for the same reason
-- current_tenant_id()/current_role() are — a policy that queried
-- patients/appointments directly (both RLS-protected) from inside
-- another table's policy would recurse.
-- ============================================================
create or replace function public.doctor_has_patient_access(p_patient_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (select 1 from public.patients where id = p_patient_id and created_by = auth.uid())
    or exists (select 1 from public.appointments where patient_id = p_patient_id and doctor_id = auth.uid());
$$;

grant execute on function public.doctor_has_patient_access(uuid) to authenticated;

create or replace function public.doctor_treats_plan(p_plan_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.doctor_has_patient_access(patient_id)
  from public.treatment_plans
  where id = p_plan_id;
$$;

grant execute on function public.doctor_treats_plan(uuid) to authenticated;

-- ============================================================
-- patients (M1) — receptionist/admin unaffected; a doctor sees a
-- patient they registered themselves, or have at least one
-- appointment with.
-- ============================================================
drop policy if exists "patients_all_same_tenant" on public.patients;
create policy "patients_all_same_tenant"
  on public.patients for all
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (
      public.current_role() != 'doctor'
      or created_by = auth.uid()
      or public.doctor_has_patient_access(id)
    )
  )
  with check (
    tenant_id = public.current_tenant_id()
    and (
      public.current_role() != 'doctor'
      or created_by = auth.uid()
      or public.doctor_has_patient_access(id)
    )
  );

-- ============================================================
-- appointments (M1) — scoped by the appointment's own doctor_id,
-- simpler than the patient-access helper and more precise (a doctor
-- shouldn't see a colleague's appointment just because they share a
-- patient).
-- ============================================================
drop policy if exists "appointments_all_same_tenant" on public.appointments;
create policy "appointments_all_same_tenant"
  on public.appointments for all
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (public.current_role() != 'doctor' or doctor_id = auth.uid())
  )
  with check (
    tenant_id = public.current_tenant_id()
    and (public.current_role() != 'doctor' or doctor_id = auth.uid())
  );

-- ============================================================
-- doctor_availability (M1) — the write policy was already own-row-only
-- for doctors; SELECT was tenant-wide for everyone, letting any doctor
-- read every colleague's schedule. Receptionist/admin still need full
-- visibility to book across doctors.
-- ============================================================
drop policy if exists "doctor_availability_select_same_tenant" on public.doctor_availability;
create policy "doctor_availability_select_same_tenant"
  on public.doctor_availability for select
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (public.current_role() != 'doctor' or doctor_id = auth.uid())
  );

-- ============================================================
-- reschedule_requests / cancellation_requests (M1) — same patient-
-- access helper as clinical tables; a doctor's own reschedule/
-- cancellation activity is naturally scoped since it's only ever
-- triggered against appointments they can already see.
-- ============================================================
drop policy if exists "reschedule_requests_select_same_tenant" on public.reschedule_requests;
create policy "reschedule_requests_select_same_tenant"
  on public.reschedule_requests for select
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (public.current_role() != 'doctor' or public.doctor_has_patient_access(patient_id))
  );

drop policy if exists "reschedule_requests_insert_same_tenant" on public.reschedule_requests;
create policy "reschedule_requests_insert_same_tenant"
  on public.reschedule_requests for insert
  to authenticated
  with check (
    tenant_id = public.current_tenant_id()
    and (public.current_role() != 'doctor' or public.doctor_has_patient_access(patient_id))
  );

drop policy if exists "reschedule_requests_update_fd_admin" on public.reschedule_requests;
drop policy if exists "reschedule_requests_update_staff" on public.reschedule_requests;
create policy "reschedule_requests_update_staff"
  on public.reschedule_requests for update
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('doctor', 'receptionist', 'admin')
    and (public.current_role() != 'doctor' or public.doctor_has_patient_access(patient_id))
  )
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('doctor', 'receptionist', 'admin')
    and (public.current_role() != 'doctor' or public.doctor_has_patient_access(patient_id))
  );

drop policy if exists "cancellation_requests_select_same_tenant" on public.cancellation_requests;
create policy "cancellation_requests_select_same_tenant"
  on public.cancellation_requests for select
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (public.current_role() != 'doctor' or public.doctor_has_patient_access(patient_id))
  );

drop policy if exists "cancellation_requests_insert_same_tenant" on public.cancellation_requests;
create policy "cancellation_requests_insert_same_tenant"
  on public.cancellation_requests for insert
  to authenticated
  with check (
    tenant_id = public.current_tenant_id()
    and (public.current_role() != 'doctor' or public.doctor_has_patient_access(patient_id))
  );

drop policy if exists "cancellation_requests_update_fd_admin" on public.cancellation_requests;
drop policy if exists "cancellation_requests_update_staff" on public.cancellation_requests;
create policy "cancellation_requests_update_staff"
  on public.cancellation_requests for update
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('doctor', 'receptionist', 'admin')
    and (public.current_role() != 'doctor' or public.doctor_has_patient_access(patient_id))
  )
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('doctor', 'receptionist', 'admin')
    and (public.current_role() != 'doctor' or public.doctor_has_patient_access(patient_id))
  );

-- ============================================================
-- Clinical tables (M2) — receptionist stays fully excluded (unchanged);
-- admin stays unrestricted; a doctor now only sees these for a patient
-- they have access to, regardless of which doctor authored the record
-- — a covering doctor still needs the full history for patient safety.
-- ============================================================
drop policy if exists "chart_notes_doctor_admin" on public.chart_notes;
create policy "chart_notes_doctor_admin"
  on public.chart_notes for all
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

drop policy if exists "prescriptions_doctor_admin" on public.prescriptions;
create policy "prescriptions_doctor_admin"
  on public.prescriptions for all
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

drop policy if exists "treatment_plans_doctor_admin" on public.treatment_plans;
create policy "treatment_plans_doctor_admin"
  on public.treatment_plans for all
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

drop policy if exists "treatment_plan_phases_doctor_admin" on public.treatment_plan_phases;
create policy "treatment_plan_phases_doctor_admin"
  on public.treatment_plan_phases for all
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (
      public.current_role() = 'admin'
      or (public.current_role() = 'doctor' and public.doctor_treats_plan(treatment_plan_id))
    )
  )
  with check (
    tenant_id = public.current_tenant_id()
    and (
      public.current_role() = 'admin'
      or (public.current_role() = 'doctor' and public.doctor_treats_plan(treatment_plan_id))
    )
  );

drop policy if exists "patient_images_doctor_admin" on public.patient_images;
create policy "patient_images_doctor_admin"
  on public.patient_images for all
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

drop policy if exists "patient_reports_doctor_admin" on public.patient_reports;
create policy "patient_reports_doctor_admin"
  on public.patient_reports for all
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

-- ============================================================
-- invoices (M2) — the one table open to all three roles; receptionist/
-- admin stay unrestricted, doctor gets the same patient-access scoping.
-- Left un-scoped, a doctor could enumerate every patient in the clinic
-- via invoices even with patients/appointments themselves locked down.
-- ============================================================
drop policy if exists "invoices_all_same_tenant" on public.invoices;
create policy "invoices_all_same_tenant"
  on public.invoices for all
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (public.current_role() != 'doctor' or public.doctor_has_patient_access(patient_id))
  )
  with check (
    tenant_id = public.current_tenant_id()
    and (public.current_role() != 'doctor' or public.doctor_has_patient_access(patient_id))
  );

-- ============================================================
-- Storage buckets (M2) — same patient-access scoping, applied to the
-- {tenant_id}/{patient_id}/{filename} path convention's second segment.
-- ============================================================
drop policy if exists "patient_images_bucket_doctor_admin" on storage.objects;
create policy "patient_images_bucket_doctor_admin"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'patient-images'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and (
      public.current_role() = 'admin'
      or (
        public.current_role() = 'doctor'
        and public.doctor_has_patient_access(((storage.foldername(name))[2])::uuid)
      )
    )
  )
  with check (
    bucket_id = 'patient-images'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and (
      public.current_role() = 'admin'
      or (
        public.current_role() = 'doctor'
        and public.doctor_has_patient_access(((storage.foldername(name))[2])::uuid)
      )
    )
  );

drop policy if exists "patient_reports_bucket_doctor_admin" on storage.objects;
create policy "patient_reports_bucket_doctor_admin"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'patient-reports'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and (
      public.current_role() = 'admin'
      or (
        public.current_role() = 'doctor'
        and public.doctor_has_patient_access(((storage.foldername(name))[2])::uuid)
      )
    )
  )
  with check (
    bucket_id = 'patient-reports'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and (
      public.current_role() = 'admin'
      or (
        public.current_role() = 'doctor'
        and public.doctor_has_patient_access(((storage.foldername(name))[2])::uuid)
      )
    )
  );

drop policy if exists "prescriptions_bucket_doctor_admin" on storage.objects;
create policy "prescriptions_bucket_doctor_admin"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'prescriptions'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and (
      public.current_role() = 'admin'
      or (
        public.current_role() = 'doctor'
        and public.doctor_has_patient_access(((storage.foldername(name))[2])::uuid)
      )
    )
  )
  with check (
    bucket_id = 'prescriptions'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and (
      public.current_role() = 'admin'
      or (
        public.current_role() = 'doctor'
        and public.doctor_has_patient_access(((storage.foldername(name))[2])::uuid)
      )
    )
  );
