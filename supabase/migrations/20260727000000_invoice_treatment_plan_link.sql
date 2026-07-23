-- Links an invoice back to the treatment plan it was generated from, so a
-- plan's totalCost can be kept in sync with a real billing line instead of
-- staff re-entering the same figure by hand. Nullable — manually-created
-- invoices (consultation fees, etc.) have no plan behind them.

alter table public.invoices
  add column if not exists treatment_plan_id uuid references public.treatment_plans (id) on delete set null;

create index if not exists invoices_treatment_plan_id_idx on public.invoices (treatment_plan_id);
