-- Milestone 0: foundational multi-tenant schema.
-- Creates clinics (tenant root) and profiles (staff identity), and
-- establishes the tenant_id + Row-Level Security pattern that every
-- table added in later milestones will copy. See:
--   DentVerseDocs/02-architecture/system-architecture.md
--   DentVerseDocs/04-database/database-schema.md
--   DentVerseDocs/03-backend-roadmap/backend-roadmap.md §4

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ============================================================
-- Tenant root
-- ============================================================
create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  whatsapp_number text,
  business_hours jsonb not null default '{}'::jsonb,
  branding jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.clinics is
  'Tenant root. Every tenant-scoped table references this via tenant_id.';

-- ============================================================
-- Staff identity — 1:1 extension of auth.users.
-- Patients are never rows in this table; they never authenticate.
-- ============================================================
create type public.staff_role as enum ('doctor', 'receptionist', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.clinics (id) on delete cascade,
  role public.staff_role not null,
  name text not null,
  title text,
  email text not null,
  avatar_initials text,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Staff only (doctor/receptionist/admin). Patients are not Supabase Auth principals.';

create index profiles_tenant_id_idx on public.profiles (tenant_id);

-- ============================================================
-- updated_at trigger — reused by every mutable table from here on
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_clinics_updated_at
  before update on public.clinics
  for each row execute function public.set_updated_at();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS helpers.
-- A policy on `profiles` that subqueries `profiles` directly would
-- recurse. These SECURITY DEFINER functions read the caller's own
-- tenant/role once, bypassing RLS for that single lookup, and every
-- policy below calls the function instead of querying profiles inline.
-- This is the pattern every future table's policies should reuse.
-- ============================================================
create or replace function public.current_tenant_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns public.staff_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

grant execute on function public.current_tenant_id() to authenticated;
grant execute on function public.current_role() to authenticated;

-- ============================================================
-- Self-serve signup.
-- Creates a new clinic and makes the calling (already-authenticated)
-- user its admin, atomically. Called via RPC immediately after
-- supabase.auth.signUp() succeeds. This is the privileged operation
-- referenced in DentVerseDocs/05-api/api-documentation.md — a brand
-- new user has no tenant yet, so no ordinary RLS-gated insert could
-- do this; the function itself is the trust boundary.
-- ============================================================
create or replace function public.create_clinic_and_admin_profile(
  clinic_name text,
  admin_name text
)
returns public.clinics
language plpgsql
security definer
set search_path = public
as $$
declare
  new_clinic public.clinics;
  name_parts text[];
  initials text;
begin
  if auth.uid() is null then
    raise exception 'Must be authenticated to create a clinic';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'This user already has a profile';
  end if;

  name_parts := regexp_split_to_array(trim(admin_name), '\s+');
  initials := upper(
    coalesce(left(name_parts[1], 1), '') ||
    coalesce(left(name_parts[array_length(name_parts, 1)], 1), '')
  );

  insert into public.clinics (name)
  values (clinic_name)
  returning * into new_clinic;

  insert into public.profiles (id, tenant_id, role, name, email, avatar_initials)
  values (
    auth.uid(),
    new_clinic.id,
    'admin',
    admin_name,
    auth.email(),
    initials
  );

  return new_clinic;
end;
$$;

revoke all on function public.create_clinic_and_admin_profile(text, text) from public;
grant execute on function public.create_clinic_and_admin_profile(text, text) to authenticated;

-- ============================================================
-- Row-Level Security
-- ============================================================
alter table public.clinics enable row level security;
alter table public.profiles enable row level security;

grant usage on schema public to authenticated;
grant select, update on public.clinics to authenticated;
grant select, update on public.profiles to authenticated;
-- No insert/delete grants on either table for `authenticated` —
-- clinic + first-admin creation only happens inside
-- create_clinic_and_admin_profile(); staff invitation (M3) will add
-- its own SECURITY DEFINER path for inserting additional profiles.

create policy "clinics_select_own_tenant"
  on public.clinics for select
  to authenticated
  using (id = public.current_tenant_id());

create policy "clinics_update_admin_only"
  on public.clinics for update
  to authenticated
  using (id = public.current_tenant_id() and public.current_role() = 'admin')
  with check (id = public.current_tenant_id() and public.current_role() = 'admin');

create policy "profiles_select_same_tenant"
  on public.profiles for select
  to authenticated
  using (tenant_id = public.current_tenant_id());

create policy "profiles_update_own_row"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
