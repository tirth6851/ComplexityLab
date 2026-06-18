-- ============================================================
-- ComplexityLab — Phase 2 F3: code_executions
-- Stores execution metadata only. Code, stdout, stdin are
-- NEVER persisted here (privacy parity with the analyses table).
-- ============================================================

create table if not exists public.code_executions (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  language    text not null,
  status      text not null,   -- normalized: accepted | compile_error | runtime_error | time_limit | error
  time_ms     integer,         -- null when execution didn't complete
  memory_kb   integer,         -- null when execution didn't complete
  created_at  timestamptz not null default now()
);

-- supports daily quota COUNT query and per-user history lookups
create index if not exists code_executions_profile_created_idx
  on public.code_executions (profile_id, created_at desc);

-- deny-by-default; all access is via the server-only service-role client
alter table public.code_executions enable row level security;
