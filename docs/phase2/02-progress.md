# Phase 2 · Feature 2 — Progress System (XP · levels · streaks · achievements)

> **Complexity: M (~2 days).** Two new tables + one SQL function + dashboard
> widgets. Additive only; hooks into the *existing* save/analyze actions. No
> change to analyzer or AI.

---

## Design principles (per task: "avoid unnecessary complexity")

- **Two tables only:** `user_progress` (current state, 1:1 with profile) and
  `xp_events` (append-only history — the source for charts). **No daily-rollup
  table** (premature; add later only if charts get slow).
- **Level is derived, never stored.** Pure function `levelFromXp(xp)`; cache the
  *display* level in `user_progress.level` only as a denormalized convenience for
  cheap "did I level up?" diffing — recompute on every event so it can't drift.
- **One atomic mutation path:** a Postgres function `apply_progress_event()` does
  XP increment + streak transition + event insert in a single transaction. The
  app never does read-modify-write on XP (avoids lost updates under concurrency).
- **Event-driven:** progress is awarded from inside the existing server actions
  (save analysis = the qualifying action). No new user-facing action.

---

## XP model (resolved values — see "Decisions to confirm" in index)

| Event | XP | Notes |
|---|---|---|
| Save an analysis | **10** | the core loop |
| First save of the UTC day | **+15 bonus** | drives the streak |
| Streak milestone (every 7 consecutive days) | **+50** | awarded by the SQL fn |
| Achievement unlocked | **varies** (see catalog) | inserted as its own xp_event |

**Bonus accounting (resolved):** the first-of-day (+15) and 7-day-milestone (+50)
bonuses are computed **inside `apply_progress_event`** — it is the only place that
knows the post-transition `current_streak`. Each bonus is written as its **own
`xp_events` row** (`type='streak_bonus'` / `'streak_milestone'`) so the activity
chart attributes them correctly. The base save event (`p_amount=10`) and any
bonuses are summed into `user_progress.xp` in the same transaction.

Keep the earning surface small and server-authoritative. Do **not** award XP for
merely running an analysis (un-gameable: it's a free API call) — only for *saving*.

### Level curve

Closed-form, no lookup table:

```
xpForLevel(L)  = 50 * L * (L - 1)        // cumulative XP to *reach* level L (L≥1 ⇒ 0,100,300,600,…)
levelFromXp(x) = floor((1 + sqrt(1 + x/12.5)) / 2)   // inverse; clamp ≥ 1
```

Put both in `lib/progress/levels.ts` as pure, unit-tested functions. Expose
`progressToNextLevel(xp) → { level, into, span, fraction }` for the XP bar.

---

## Streak algorithm

State on `user_progress`: `current_streak`, `longest_streak`, `last_active_on`
(a `date`, UTC). Transition (inside the SQL fn, on a qualifying save):

```
today := (now() at time zone 'utc')::date
if last_active_on = today          → no streak change (already counted today)
elif last_active_on = today - 1    → current_streak += 1
else                               → current_streak := 1   (reset; gap or first ever)
longest_streak := max(longest_streak, current_streak)
last_active_on := today
```

The "first save of the day" XP bonus is exactly the branch where
`last_active_on <> today`.

---

## Achievements

**Catalog lives in code** (`lib/progress/achievements.ts`), unlocks live in
`xp_events` (no separate table — an unlock *is* an event of `type='achievement'`
with `meta->>'key'` = the achievement id; query distinct keys for "unlocked
set"). This keeps it to two tables.

```ts
// lib/progress/achievements.ts  (static catalog)
export const ACHIEVEMENTS = [
  { key: "first_analysis", name: "First Steps",     xp: 25, hint: "Save your first analysis" },
  { key: "ten_analyses",   name: "Getting Warm",    xp: 50, hint: "Save 10 analyses" },
  { key: "streak_7",       name: "Consistent",      xp: 75, hint: "7-day streak" },
  { key: "all_languages",  name: "Polyglot",        xp:100, hint: "Analyze in all 7 languages" },
  { key: "found_factorial",name: "Here Be Dragons", xp:100, hint: "Analyze an O(n!) algorithm" },
  // …keep ~8–10, all evaluable from data already on hand
] as const;
```

**Evaluation** (`lib/progress/evaluate.ts`, server-only): after a successful
save, run pure predicates against lightweight counts (total analyses, distinct
languages, streak, detected Big-O of the just-saved result). For any catalog key
not already unlocked, call `apply_progress_event(type:'achievement', …)`. Counts
come from cheap `count` queries scoped to the profile. Idempotent: the unlock
insert is guarded by a "not already present" check inside the SQL fn (or a
partial unique index on `(profile_id, (meta->>'key'))` where `type='achievement'`).

---

## Database

### Migration `supabase/migrations/20260616000100_progress.sql`

```sql
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
  type       text not null,           -- 'save' | 'streak_bonus' | 'achievement'
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

alter table public.user_progress enable row level security;  -- deny-by-default
alter table public.xp_events     enable row level security;  -- (service-role only)

-- atomic XP + streak + bonuses + history in ONE transaction.
-- Bonuses (+15 first-of-day, +50 every 7th day) are computed here because this
-- is the only place that knows the post-transition streak; each is its own
-- xp_events row, and all deltas land in user_progress.xp together.
create or replace function public.apply_progress_event(
  p_profile uuid, p_type text, p_amount int, p_meta jsonb default '{}',
  p_counts_for_streak boolean default false
) returns public.user_progress
language plpgsql security definer set search_path = '' as $$
declare today date := (now() at time zone 'utc')::date;
        row public.user_progress;
        is_first_today boolean;
        new_streak int;
begin
  insert into public.user_progress(profile_id) values (p_profile)
    on conflict (profile_id) do nothing;

  -- achievement idempotency: skip if already unlocked
  if p_type = 'achievement'
     and exists (select 1 from public.xp_events
                 where profile_id = p_profile and type='achievement'
                   and meta->>'key' = p_meta->>'key') then
    select * into row from public.user_progress where profile_id = p_profile;
    return row;
  end if;

  -- base event
  insert into public.xp_events(profile_id, type, amount, meta)
    values (p_profile, p_type, greatest(p_amount,0), coalesce(p_meta,'{}'));

  -- streak transition (only on a qualifying save)
  select up.last_active_on is distinct from today into is_first_today
    from public.user_progress up where up.profile_id = p_profile;

  update public.user_progress up set
    xp = up.xp + greatest(p_amount,0),
    current_streak = case
      when not p_counts_for_streak then up.current_streak
      when up.last_active_on = today then up.current_streak       -- already counted
      when up.last_active_on = today - 1 then up.current_streak + 1
      else 1 end,
    last_active_on = case when p_counts_for_streak then today else up.last_active_on end,
    updated_at = now()
  where up.profile_id = p_profile
  returning current_streak into new_streak;

  -- bonuses: only when this save is the first of the day
  if p_counts_for_streak and is_first_today then
    -- +15 first-of-day
    insert into public.xp_events(profile_id, type, amount) values (p_profile, 'streak_bonus', 15);
    update public.user_progress set xp = xp + 15 where profile_id = p_profile;
    -- +50 every 7th consecutive day
    if new_streak % 7 = 0 then
      insert into public.xp_events(profile_id, type, amount, meta)
        values (p_profile, 'streak_milestone', 50, jsonb_build_object('streak', new_streak));
      update public.user_progress set xp = xp + 50 where profile_id = p_profile;
    end if;
  end if;

  -- finalize longest_streak + cached level from the summed xp
  update public.user_progress up set
    longest_streak = greatest(up.longest_streak, up.current_streak),
    level = public.level_from_xp(up.xp)        -- SQL mirror of levelFromXp
  where up.profile_id = p_profile
  returning * into row;
  return row;
end $$;

-- NOTE: cast to float8 so SQL sqrt matches JS IEEE-754 Math.sqrt exactly
-- (numeric sqrt computes at different precision → boundary parity-test failures).
create or replace function public.level_from_xp(x int)
returns int language sql immutable set search_path = '' as $$
  select greatest(1, floor((1 + sqrt(1 + x::float8/12.5)) / 2)::int);
$$;
```

> **Note for Sonnet:** `level_from_xp` must mirror `lib/progress/levels.ts`
> exactly. There is one unit test asserting they agree across a value sweep.

### Server-only data layer `lib/db/progress.ts`

- `getProgress(): DbResult<ProgressState>` — `user_progress` row (create-if-missing).
- `awardProgress(events): DbResult<ProgressState>` — calls `apply_progress_event`
  RPC via `db.rpc(...)`; returns updated state.
- `listXpHistory(days=30): DbResult<DailyXp[]>` — aggregate `xp_events` by UTC day
  in SQL (`date_trunc`) for the activity chart.
- `getStats(): DbResult<ProgressStats>` — counts (total analyses, distinct
  languages) used by both achievement evaluation and dashboard.

All follow the `getOrCreateProfile()` + `DbResult` + `dbError()` conventions.

---

## Wiring into existing actions (the only integration point)

In `saveAnalysisAction` (after a successful `createAnalysis`):

```ts
// best-effort; never fail the save because progress failed
try {
  await awardProgressForSave({ language, analysis });  // lib/progress/award.ts
} catch (e) { log("progress.error", { e }); }
revalidatePath("/dashboard");
```

`awardProgressForSave` orchestrates: `apply_progress_event('save', 10, counts_for_streak:true)`
(the SQL fn handles the first-of-day branch), then runs achievement evaluation.
Keep it **non-blocking on failure** — progress is a bonus, not a gate.

---

## Dashboard widgets (`components/progress/`)

Reuse existing readout/card primitives and the hand-rolled SVG approach already
used by `ComplexityTimeline` — **do not add a charting dependency** (bundle +
token cost). Widgets:

1. **`LevelCard`** — level number, XP bar (`progressToNextLevel`), "X XP to Lvl N+1".
2. **`StreakCard`** — current streak + flame, longest streak as subtext.
3. **`AchievementGrid`** — catalog rendered as locked/unlocked tiles (unlocked set
   from `listXpHistory`/distinct keys); locked tiles show the hint.
4. **`ActivityChart`** — 30-day XP-per-day sparkline/bars, pure inline SVG. (A
   GitHub-style calendar heatmap is a nice-to-have; bars are enough for v1.)

Place these on `/dashboard` alongside the existing readouts. They are Server
Components reading `lib/db/progress` (no client JS needed).

---

## Charts: implementation note

`ActivityChart` takes `DailyXp[]` and renders `<svg>` rects/polyline with the
`--accent` token fill, log-free linear y-axis, `aria-label` summarizing totals,
and a `<title>` per bar. Same pattern, tokens, and reduced-motion handling as
`components/analyzer/complexity-timeline.tsx` — copy its structure.

---

## Tests

- `lib/progress/levels` — `xpForLevel`/`levelFromXp` round-trip; monotonic;
  `levelFromXp(0)=1`; agrees with SQL `level_from_xp` across a sweep (fixture).
- Streak transitions — same-day no-op, consecutive +1, gap reset, longest tracks max.
- Achievement predicates — each catalog rule fires on its boundary and not before;
  idempotent (re-eval doesn't double-award).
- `awardProgressForSave` (mocked rpc) — calls `apply_progress_event` with
  `counts_for_streak:true`; save still succeeds if award throws.
- Widget components — render from fixtures (locked vs unlocked tiles, empty history).

---

## Performance & risk

- **Perf:** all queries are profile-scoped and indexed; the RPC is a single
  round-trip. Achievement eval adds 2–3 `count` queries per save — acceptable at
  this scale; if it grows, fold counts into one SQL function.
- **Risk:** clock/timezone — streak uses UTC date consistently in SQL (not the
  app server's local time). Concurrency — atomic RPC prevents lost XP. Gaming —
  XP only on save; rate limiting on save already caps the rate.
