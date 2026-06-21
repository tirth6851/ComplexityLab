-- Phase 2 F4 — AI Chat: conversations, messages, daily usage rollup

create table if not exists public.chat_conversations (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references public.profiles(id) on delete cascade,
  title            text not null default 'New chat',
  context_type     text,          -- null | 'analysis' | future types
  context_ref_id   uuid,          -- anchor object id (no FK: snapshot tolerance)
  context_metadata jsonb,         -- RAG config, multi-ref anchors, per-conv settings
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists chat_conversations_profile_updated_idx
  on public.chat_conversations (profile_id, updated_at desc);

create table if not exists public.chat_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  role            text not null,   -- 'user' | 'assistant' | 'system'
  content         text not null,
  token_count     integer,         -- best-effort, analytics only
  created_at      timestamptz not null default now()
);
create index if not exists chat_messages_conversation_created_idx
  on public.chat_messages (conversation_id, created_at asc);

-- Daily usage rollup: one row per profile per UTC day.
-- message_count = user turns (not total messages); used for quota gating.
-- tokens_in/out = analytics only, never the gate.
create table if not exists public.ai_usage (
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  day           date not null,
  message_count integer not null default 0,
  tokens_in     integer not null default 0,
  tokens_out    integer not null default 0,
  primary key (profile_id, day)
);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages      enable row level security;
alter table public.ai_usage           enable row level security;

-- Atomic usage bump — insert or add. Uses security definer so it can always
-- write the row regardless of RLS (application code already verified the caller).
create or replace function public.bump_ai_usage(
  p_profile uuid,
  p_msgs    int,
  p_in      int,
  p_out     int
) returns void language sql security definer set search_path = '' as $$
  insert into public.ai_usage (profile_id, day, message_count, tokens_in, tokens_out)
  values (p_profile, (now() at time zone 'utc')::date, p_msgs, p_in, p_out)
  on conflict (profile_id, day) do update set
    message_count = public.ai_usage.message_count + excluded.message_count,
    tokens_in     = public.ai_usage.tokens_in     + excluded.tokens_in,
    tokens_out    = public.ai_usage.tokens_out    + excluded.tokens_out;
$$;
