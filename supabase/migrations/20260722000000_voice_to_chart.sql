-- Milestone 7: Voice-to-Chart AI pipeline.
-- Adds the follow_up_trigger signal the structuring LLM produces from a
-- consultation transcript, so a future scheduler (Milestone 6/9 territory)
-- has a real, machine-readable field to consume instead of prose buried in
-- the "plan" field. Nullable and unused by any UI yet — populated only when
-- the Voice-to-Chart pipeline runs; manual chart notes leave it null.

alter table public.chart_notes
  add column if not exists follow_up_trigger jsonb;

comment on column public.chart_notes.follow_up_trigger is
  'Set by the Voice-to-Chart LLM structuring step: {"triggered": boolean, "suggestedTiming": string|null, "reason": string|null}. Null for manual entries and until a scheduler (Milestone 6+) consumes it.';
