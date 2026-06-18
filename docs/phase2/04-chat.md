# Phase 2 · Feature 4 — AI Chat (context-aware, streaming, persisted)

> **Complexity: L (~3 days).** Reuses the `lib/ai` provider abstraction. New
> streaming route, three tables, conversation UI. The trickiest piece is
> streaming + server-side persistence + quota — all resolved below.

---

## Architecture

```
/chat (client island)
  ├─ ConversationList (sidebar)  ·  MessageThread  ·  Composer
  └─ POST /api/chat  (streaming)  { conversationId?, message, contextRef? }
        │
  app/api/chat/route.ts
    auth → daily-quota check (DB) → per-min burst (in-memory)
         → load/create conversation → assemble context → build messages
         → getChatProvider().stream(messages)  ──► Groq (OpenAI-compatible, stream:true)
         → pipe tokens to client (ReadableStream)
         → on stream end (server-side): persist user+assistant messages, bump ai_usage
```

**Reuse, don't fork:** add a `ChatProvider` interface beside the existing
`AnalysisProvider`, with the same registry/env-selection pattern
(`CHAT_PROVIDER` env, default groq-if-key-else-mock). One provider file +
one registry entry per future vendor — same hard requirement as the analyzer.

---

## Resolved decisions (the parts that bite if left open)

1. **Streaming transport:** route returns a `text/plain` (or
   `text/event-stream`) `ReadableStream`. Client reads via
   `fetch().body.getReader()` and appends decoded chunks. Use Groq's
   OpenAI-compatible `stream: true` SSE and re-emit token deltas. *(If the
   Vercel AI SDK is later adopted, it slots behind `ChatProvider.stream` without
   UI change — but do NOT add it now; hand-rolled reader keeps deps/tokens down.)*
2. **Persistence is server-side, on stream completion** — never client-driven:
   - Persist the **user message** immediately when the request is accepted
     (before streaming), so it survives a disconnect.
   - Accumulate assistant tokens server-side; on `finally`/stream-end, persist
     the **assistant message** + token counts, even if the client disconnected
     (use the route's request lifecycle, not the client).
3. **Quota gating uses message count (check-before); tokens are analytics-only
   (post-hoc).** You cannot gate on output tokens you haven't generated yet.
   - Per-day: `ai_usage.message_count >= CHAT_DAILY_QUOTA` → 429 before streaming.
     **Unit (resolved): `message_count` counts USER turns** — bump it by **1** per
     exchange (not 2), so "50/day" means 50 questions. (Assistant rows still get
     persisted to `chat_messages`; they just don't count against the quota.)
   - Per-minute burst: in-memory `rateLimit()` key `chat`.
   - Token counts recorded after completion for usage analytics only.
4. **Context assembly is bounded.** A conversation may be *anchored* to an
   analysis (`context_type='analysis'`, `context_ref_id`): include that code +
   stored `CodeAnalysis` in the system prompt **once**. History is trimmed to the
   last N messages (e.g. 12) to cap prompt tokens; older turns dropped (note as
   "summarization is future work").

---

## Prompt management (`lib/ai/prompts/`)

Pure, versioned builder functions (unit-testable, no I/O):

- `chatSystemPrompt({ contextAnalysis? }) → string` — base tutor persona +
  optional anchored-analysis block (code + Big-O findings).
- `buildChatMessages({ system, history, userMessage }) → ChatMessage[]` —
  assembles the trimmed message array sent to the provider.

Keep prompts as exported constants/functions so changes are diff-reviewable and
testable, not inline string soup in the route.

---

## Database

### Migration `supabase/migrations/20260616000300_chat.sql`

```sql
create table if not exists public.chat_conversations (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  title         text not null default 'New chat',
  context_type  text,                 -- null | 'analysis'
  context_ref_id uuid,                -- analyses.id when anchored (no FK: snapshot tolerance)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists chat_conversations_profile_updated_idx
  on public.chat_conversations (profile_id, updated_at desc);

create table if not exists public.chat_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  role            text not null,      -- 'user' | 'assistant' | 'system'
  content         text not null,
  token_count     integer,            -- best-effort, analytics
  created_at      timestamptz not null default now()
);
create index if not exists chat_messages_conversation_created_idx
  on public.chat_messages (conversation_id, created_at asc);

-- daily usage rollup for quota + analytics (1 row per profile per UTC day)
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

-- atomic usage bump (avoids read-modify-write races on quota)
create or replace function public.bump_ai_usage(
  p_profile uuid, p_msgs int, p_in int, p_out int
) returns void language sql security definer set search_path = '' as $$
  insert into public.ai_usage(profile_id, day, message_count, tokens_in, tokens_out)
  values (p_profile, (now() at time zone 'utc')::date, p_msgs, p_in, p_out)
  on conflict (profile_id, day) do update set
    message_count = public.ai_usage.message_count + excluded.message_count,
    tokens_in     = public.ai_usage.tokens_in     + excluded.tokens_in,
    tokens_out    = public.ai_usage.tokens_out    + excluded.tokens_out;
$$;
```

`context_ref_id` intentionally has **no FK** so deleting an analysis doesn't
cascade-delete a conversation; the route handles a missing anchor gracefully.

### Data layer `lib/db/chat.ts` (server-only, `DbResult`)

- `listConversations()`, `getConversation(id)` (with messages, owner-scoped),
  `createConversation({title, contextType?, contextRefId?})`,
  `appendMessage({conversationId, role, content, tokenCount?})`,
  `deleteConversation(id)`, `renameConversation(id, title)`.
- `getUsageToday(): DbResult<{messageCount,tokensIn,tokensOut}>` (quota read).
- `bumpUsage(...)` → `db.rpc('bump_ai_usage', …)`.
- All conversation reads `eq('profile_id', profile.id)`; message reads join
  through an owner-checked conversation.

---

## Route (`app/api/chat/route.ts`)

```
export const maxDuration = 30;       // allow for streamed generations
POST:
  1. auth() → 401
  2. parse { conversationId?, message, contextRef? }; validate message length
  3. getUsageToday(); if message_count >= CHAT_DAILY_QUOTA → 429 Retry-After
  4. rateLimit('chat') burst guard → 429
  5. conversation = conversationId ? getConversation : createConversation(contextRef)
  6. persist user message (appendMessage)
  7. assemble context (anchored analysis if any) + trimmed history → messages
  8. return new Response(stream) where stream:
       - calls getChatProvider().stream(messages)
       - enqueues token deltas to the client
       - on end: appendMessage(assistant, fullText, tokenOut);
                 bumpUsage(msgs:1, tokensIn, tokensOut)   // 1 = user turn; server-side, in finally
  9. errors before streaming → JSON error; errors mid-stream → emit an error
     sentinel chunk and still persist what we have.
```

Provider failure handling mirrors the analyzer ethos: a clean error surfaced to
the user; chat has no deterministic fallback, so a failed generation returns an
apologetic assistant turn (not a crash).

---

## UI (`components/chat/`)

- `ChatLayout` — two-pane (conversation list + active thread); collapses to a
  drawer on mobile (reuse the existing mobile-drawer pattern).
- `ConversationList` — items from `listConversations`; new-chat button; delete/rename.
- `MessageThread` — message bubbles (user/assistant), markdown rendering for
  assistant (code blocks in mono), streaming cursor on the in-flight message.
- `Composer` — textarea, Enter-to-send / Shift+Enter newline, disabled while
  streaming, quota-reached banner.
- "Discuss with AI" entry point on `/analyses/[id]` → opens `/chat` with the
  analysis pre-anchored (`contextRef`).

State: a thin client hook `useChatStream` managing the reader loop + optimistic
user message + streaming assistant text. Keep it one file; no global store.

---

## Token accounting

Best-effort: read Groq's `usage` from the final SSE chunk when present; otherwise
estimate (chars/4) for `token_count`. Stored on messages + summed into
`ai_usage`. Used for the **usage analytics** view (a small `/settings` or
dashboard panel: messages today, tokens this week) — analytics only, never the
gate.

---

## Tests

- `lib/ai/prompts` — system prompt includes anchored-analysis block when given;
  message trimming caps history length.
- Chat registry — env selection precedence; unknown id throws (mirror ai index test).
- Route (mocked provider + db): 401 unauth; 429 when quota exceeded (before any
  provider call); user message persisted before stream; assistant persisted +
  `bump_ai_usage` called on completion; quota check uses count not tokens.
- `useChatStream` (mocked fetch/ReadableStream) — appends chunks; finalizes message.
- Components — thread renders roles; composer Enter/Shift+Enter; quota banner.

---

## Security & risk

- `GROQ_API_KEY` server-only (already). Chat shares the key; `CHAT_MODEL` env
  (default a chat-tuned Groq model) separate from `GROQ_MODEL`.
- Conversations strictly owner-scoped (no cross-user reads — unlike Community).
- Prompt-injection: anchored code is *data*; the system prompt instructs the
  model to treat included code as untrusted content, not instructions.
- Cost control: DB daily quota is the real ceiling (in-memory limiter can't cap
  daily). Token logging lets you spot abuse.
- **Risk:** streaming + serverless function duration — cap history, set
  `maxDuration`, and ensure persistence runs in the stream's `finally` so a
  client disconnect doesn't lose the assistant turn or skip the usage bump.
