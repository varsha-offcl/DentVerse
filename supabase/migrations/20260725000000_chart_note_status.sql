-- Patient Chart table view: a status the doctor sets directly on the visit
-- note, tracking the recommendation recorded in THAT note (Recommended
-- Treatment, formerly "Plan"). Deliberately independent of the separate
-- treatment_plans table/feature — different vocabulary, different concept,
-- no FK between them. See DentVerseDocs discussion for why they're kept apart.

alter table public.chart_notes
  add column if not exists status text not null default 'Pending'
    check (status in ('Pending', 'In Progress', 'Completed', 'Under Observation'));

comment on column public.chart_notes.status is
  'Doctor-set progress of this visit note''s own Recommended Treatment — unrelated to treatment_plans.status.';
