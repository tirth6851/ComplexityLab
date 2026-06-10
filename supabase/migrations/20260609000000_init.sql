-- ============================================================
-- ComplexityLab — initial schema
-- profiles · analyses · saved_snippets
-- ------------------------------------------------------------
-- Identity model: Clerk is the source of truth for users.
-- `profiles.clerk_user_id` maps a Clerk user id ("user_…") to a
-- local profile row; analyses/snippets hang off the profile.
--
-- Access model (current phase): all app reads/writes go through
-- the SERVER-ONLY service-role client (lib/db/*), which always
-- scopes queries by the signed-in Clerk user. RLS is enabled
-- deny-by-default so the anon/publishable keys can read nothing.
--
-- Access model (future): when Clerk is wired as a Supabase
-- third-party auth provider, `auth.jwt()->>'sub'` carries the
-- Clerk user id and the commented policies below turn on direct,
-- user-scoped client access without schema changes.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  display_name text,
  preferred_language text not null default 'typescript',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- analyses ----------
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  language text not null,
  code text not null,
  time_complexity text not null,
  space_complexity text not null,
  verdict text not null default '',
  -- full CodeAnalysis payload (metrics, notes, confidence, provider)
  result jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analyses_profile_created_idx
  on public.analyses (profile_id, created_at desc);

-- ---------- saved_snippets ----------
create table if not exists public.saved_snippets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  language text not null,
  code text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists saved_snippets_profile_created_idx
  on public.saved_snippets (profile_id, created_at desc);

-- ---------- updated_at maintenance ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------- row level security (deny-by-default) ----------
alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.saved_snippets enable row level security;

-- FUTURE — Clerk ↔ Supabase third-party-auth bridge policies.
-- Enable once Clerk is configured as an auth provider in Supabase:
--
-- create policy "profiles: own row" on public.profiles
--   for all to authenticated
--   using (clerk_user_id = (select auth.jwt()->>'sub'))
--   with check (clerk_user_id = (select auth.jwt()->>'sub'));
--
-- create policy "analyses: own rows" on public.analyses
--   for all to authenticated
--   using (profile_id in (
--     select id from public.profiles
--     where clerk_user_id = (select auth.jwt()->>'sub')))
--   with check (profile_id in (
--     select id from public.profiles
--     where clerk_user_id = (select auth.jwt()->>'sub')));
--
-- create policy "saved_snippets: own rows" on public.saved_snippets
--   for all to authenticated
--   using (profile_id in (
--     select id from public.profiles
--     where clerk_user_id = (select auth.jwt()->>'sub')))
--   with check (profile_id in (
--     select id from public.profiles
--     where clerk_user_id = (select auth.jwt()->>'sub')));
