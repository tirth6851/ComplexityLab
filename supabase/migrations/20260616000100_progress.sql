-- Phase 2 F2: Progress System (XP · levels · streaks · achievements)
-- Apply AFTER 20260609000000_init.sql.
-- All idempotent (create if not exists / create or replace).

create table if not exists public.user_progress (
  profile_id     uuid primary key references public.profiles(id) on delete cascade,
  xp             integer not null default 0,
  level          integer not null default 1,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_on date,
  updated_at     timestamptz not null default now()
);

create table if not exists public.xp_events (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type       text not null,           -- 'save' | 'streak_bonus' | 'streak_milestone' | 'achievement'
  amount     integer not null,        -- XP delta (≥0)
  meta       jsonb not null default '{}',  -- e.g. {"key":"first_analysis"} or {"language":"go"}
  created_at timestamptz not null default now()
);

create index if not exists xp_events_profile_created_idx
  on public.xp_events (profile_id, created_at desc);

-- one unlock per achievement per user
create unique index if not exists xp_events_achievement_uniq
  on public.xp_events (profile_id, (meta->>'key'))
  where type = 'achievement';

alter table public.user_progress enable row level security;  -- deny-by-default (service-role only)
alter table public.xp_events     enable row level security;

-- NOTE: cast to float8 so SQL sqrt matches JS IEEE-754 Math.sqrt exactly
-- (numeric sqrt computes at different precision → boundary parity-test failures).
create or replace function public.level_from_xp(x int)
returns int language sql immutable set search_path = '' as $$
  select greatest(1, floor((1 + sqrt(1 + x::float8/12.5)) / 2)::int);
$$;

-- Atomic XP + streak + bonuses + history in ONE transaction.
-- Bonuses (+15 first-of-day, +50 every 7th consecutive day) are computed here because
-- this is the only place that knows the post-transition streak; each is its own
-- xp_events row, and all deltas land in user_progress.xp together.
create or replace function public.apply_progress_event(
  p_profile uuid,
  p_type text,
  p_amount int,
  p_meta jsonb default '{}',
  p_counts_for_streak boolean default false
) returns public.user_progress
language plpgsql security definer set search_path = '' as $$
declare
  today           date := (now() at time zone 'utc')::date;
  row             public.user_progress;
  is_first_today  boolean;
  new_streak      int;
begin
  -- Upsert the row (first-time callers get defaults).
  insert into public.user_progress(profile_id) values (p_profile)
    on conflict (profile_id) do nothing;

  -- Achievement idempotency: skip if already unlocked.
  if p_type = 'achievement'
     and exists (
       select 1 from public.xp_events
       where profile_id = p_profile
         and type = 'achievement'
         and meta->>'key' = p_meta->>'key'
     ) then
    select * into row from public.user_progress where profile_id = p_profile;
    return row;
  end if;

  -- Base event.
  insert into public.xp_events(profile_id, type, amount, meta)
    values (p_profile, p_type, greatest(p_amount, 0), coalesce(p_meta, '{}'));

  -- Determine whether this save is the first of today (for bonus gating).
  select (up.last_active_on is distinct from today) into is_first_today
    from public.user_progress up where up.profile_id = p_profile;

  -- Streak transition + base XP update.
  update public.user_progress up set
    xp = up.xp + greatest(p_amount, 0),
    current_streak = case
      when not p_counts_for_streak then up.current_streak
      when up.last_active_on = today then up.current_streak        -- already counted today
      when up.last_active_on = today - 1 then up.current_streak + 1
      else 1 end,
    last_active_on = case
      when p_counts_for_streak then today
      else up.last_active_on end,
    updated_at = now()
  where up.profile_id = p_profile
  returning current_streak into new_streak;

  -- Bonuses: only when this save is the first qualifying action of the day.
  if p_counts_for_streak and is_first_today then
    -- +15 first-of-day streak bonus.
    insert into public.xp_events(profile_id, type, amount)
      values (p_profile, 'streak_bonus', 15);
    update public.user_progress set xp = xp + 15 where profile_id = p_profile;

    -- +50 every 7th consecutive day.
    if new_streak % 7 = 0 then
      insert into public.xp_events(profile_id, type, amount, meta)
        values (p_profile, 'streak_milestone', 50,
                jsonb_build_object('streak', new_streak));
      update public.user_progress set xp = xp + 50 where profile_id = p_profile;
    end if;
  end if;

  -- Finalize longest_streak and recalculate cached level from summed XP.
  update public.user_progress up set
    longest_streak = greatest(up.longest_streak, up.current_streak),
    level          = public.level_from_xp(up.xp)
  where up.profile_id = p_profile
  returning * into row;

  return row;
end $$;
