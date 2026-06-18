# ComplexityLab — Phase 2 Architecture Plan

> **Lead-architect plan for the next phase.** Optimized for implementation by
> Claude Sonnet: every fork is resolved with one choice + rationale, so there are
> minimal architectural decisions and minimal token usage during development.
>
> **Per-feature detail lives in `docs/phase2/` — load only the file you're building:**
> 1. [`01-save-flow.md`](docs/phase2/01-save-flow.md) — mandatory-title save dialog (S)
> 2. [`02-progress.md`](docs/phase2/02-progress.md) — XP · levels · streaks · achievements (M)
> 3. [`03-compiler.md`](docs/phase2/03-compiler.md) — Monaco + Judge0 online compiler (M)
> 4. [`04-chat.md`](docs/phase2/04-chat.md) — context-aware streaming AI chat (L)
> 5. [`05-community.md`](docs/phase2/05-community.md) — share · feed · likes · comments · moderation (XL)
>
> Read `ARCHITECTURE.md` + `TRD.md` first for the existing system. This plan
> **preserves** that architecture — no refactors of existing code beyond the
> small, named touch-points in each feature file.

---

## 0. Preconditions (be honest — Phase 2 stacks on an unshipped baseline)

These are **blocking** and tracked in `MISSION_CONTROL.md`; resolve before/at the
start of Phase 2 rollout:

- **B1 — base `init` migration is UNAPPLIED** to prod Supabase
  (`hhnmxyyrihrpyerdmgdw`). Every Phase 2 migration stacks on a schema not yet in
  production. **Top rollout dependency.**
- **B3 — `beta-prep-audit` not merged to `main`.** Current sprint is "Beta
  Stabilization — no new features." Phase 2 begins **after** beta ships.
- **B2 — leaked keys unrotated.** New external keys this phase (`JUDGE0_API_KEY`)
  must be added cleanly; don't reintroduce secrets to git.

> One-line stance: **Phase 2 is post-beta.** It assumes B1/B3 closed and the
> existing 211-test suite green on `main`.

---

## 1. Overall architecture (text diagram)

Phase 2 is **additive** — same Next.js App Router + Clerk + Supabase
(service-role + app-scoping) + `lib/ai` registry. New surfaces in **bold**.

```
Browser
  │  RSC pages (server-rendered via lib/db)  +  client islands
  ▼
Next.js ── proxy.ts (Clerk route protection; add /chat /playground /community)
  ├── POST /api/analyze ───► lib/ai (analysis) ─► Groq ─(fallback)─► heuristic engine   [existing]
  ├── POST /api/chat ──────► lib/ai (CHAT)     ─► Groq (stream:true) ──► ReadableStream   [NEW]
  ├── POST /api/execute ───► lib/execute/judge0 ─► Judge0 CE (isolate sandbox)            [NEW]
  └── Server Actions ──────► lib/action-limit ─► lib/db (service role) ─► Supabase
         ├─ save (now title-required)                                                     [CHANGED]
         ├─ progress (apply_progress_event RPC, fired from save)                          [NEW]
         └─ community (createPost / like / comment / report / moderate)                   [NEW]

Cross-cutting limiter split (RESOLVED, applies to chat + execute + community):
  • per-MINUTE burst  → in-memory rateLimit() (existing, per warm instance)
  • per-DAY quota     → DB COUNT (ai_usage / code_executions / daily action caps)
    (the in-memory limiter is per-instance and CANNOT enforce daily quotas)
```

**Isolation guarantee:** AI analysis, AI chat, and code execution are three
**separate routes** with **separate providers, rate-limit keys, and quotas**.
Execution (Judge0) never touches the AI path.

---

## 2. Folder structure (additions only)

```
ComplexityLab/
├─ PHASE2_PLAN.md                         # this index
├─ docs/phase2/01..05-*.md                # per-feature specs
├─ supabase/migrations/
│  ├─ 20260616000100_progress.sql         # F2
│  ├─ 20260616000200_executions.sql       # F3
│  ├─ 20260616000300_chat.sql             # F4
│  └─ 20260616000400_community.sql        # F5
└─ frontend/
   ├─ app/
   │  ├─ api/chat/route.ts                 # F4  (maxDuration=30, streaming)
   │  ├─ api/execute/route.ts              # F3  (maxDuration=15)
   │  └─ (app)/
   │     ├─ chat/page.tsx (+loading)       # F4
   │     ├─ playground/page.tsx (+loading) # F3
   │     ├─ community/page.tsx (+loading)  # F5  feed
   │     │  ├─ [id]/page.tsx (+loading)    # F5  post detail
   │     │  ├─ moderation/page.tsx         # F5  admin-gated
   │     │  └─ actions.ts                  # F5
   │     └─ analyzer|analyses|snippets/…   # F1 touch-points only
   ├─ components/
   │  ├─ ui/dialog.tsx                      # F1 (shared accessible modal)
   │  ├─ analyzer/save-dialog.tsx           # F1
   │  ├─ progress/*                         # F2 widgets (LevelCard, StreakCard, …)
   │  ├─ playground/*                       # F3
   │  ├─ chat/*                             # F4
   │  └─ community/*                        # F5
   ├─ lib/
   │  ├─ progress/{levels,achievements,evaluate,award}.ts   # F2 (pure + server)
   │  ├─ execute/{languages,types,judge0}.ts                # F3
   │  ├─ ai/prompts/*  ·  ai/providers/groq-chat.ts          # F4
   │  ├─ db/{progress,executions,chat,community}.ts          # F2–F5 data layers
   │  └─ limits.ts                                           # extend (all features)
   └─ tests/{unit,components,integration}/…                  # per feature file
```

**Conventions are inherited, not reinvented:** every `lib/db/*` fn resolves the
user via `getOrCreateProfile()`, returns `DbResult<T>`, never throws, maps rows
via pure mappers; every action does `checkActionLimit → validate → db →
revalidatePath`; Server Components by default; tokens/primitives only.

---

## 3. Database schema (consolidated)

| Table | Feature | Key columns | Scope model |
|---|---|---|---|
| `user_progress` | F2 | profile_id PK, xp, level, current_streak, longest_streak, last_active_on | owner |
| `xp_events` | F2 | profile_id, type, amount, meta jsonb · uniq achievement key | owner |
| `code_executions` | F3 | profile_id, language, status, time_ms, memory_kb | owner (quota) |
| `chat_conversations` | F4 | profile_id, title, context_type, context_ref_id | owner |
| `chat_messages` | F4 | conversation_id, role, content, token_count | owner (via convo) |
| `ai_usage` | F4 | (profile_id, day) PK, message_count, tokens_in/out | owner (quota) |
| `community_posts` | F5 | author_id, author_name, code+result snapshot, status, like_count, comment_count, search tsvector | **visibility (cross-user read)** |
| `post_likes` | F5 | (post_id, profile_id) PK | actor |
| `post_comments` | F5 | post_id, author_id, body, status | actor/author |
| `post_reports` | F5 | post_id?, comment_id?, reporter_id, reason, status | actor + admin |

**Helper SQL functions (atomic; avoid read-modify-write races):**
`level_from_xp(x)`, `apply_progress_event(...)` (F2), `bump_ai_usage(...)` (F4),
`toggle_post_like(...)` + `community_posts_search_update` trigger (F5).

**RLS:** every new table `enable row level security` with **zero policies**
(deny-by-default) — identical to the existing model. All access is via the
server-only service-role client, scoped in application code. Community is the one
place reads scope by `status='visible'` instead of ownership (see `05-community.md`).

---

## 4. Migration plan

- **One migration file per feature**, timestamp-ordered, all idempotent
  (`create table if not exists`, `create or replace function`) — same style as
  `20260609000000_init.sql`. Numbered to apply in feature order:
  `…000100_progress` → `…000200_executions` → `…000300_chat` → `…000400_community`.
- **Apply path (per `ARCHITECTURE.md` B1 note):** Supabase Dashboard SQL editor,
  or `supabase db push` once the CLI is linked to `hhnmxyyrihrpyerdmgdw`. The
  claude.ai Supabase MCP is connected to a **different** account — it cannot
  apply these. Apply **base `init` first**, then Phase 2 migrations in order.
- **Forward-only.** No down-migrations (matches current convention). Each is
  additive — no column drops/renames on existing tables → zero risk to live data.
- **After each migration:** regenerate TS types if that workflow is adopted, else
  keep hand-written domain types in sync (`types/index.ts` + per-feature types).

---

## 5. Feature dependency graph

```
F1 Save Flow ──────────────┐ (Dialog primitive + share dialog reuse)
                           ▼
F5 Community ◄── reuses F1 Dialog, F2 author level badge, ResultsPanel
F2 Progress ──► feeds /dashboard ; hooks into save action (needs F1's action shape)
F3 Compiler ── independent (only shares Monaco editor + limits.ts)
F4 Chat ────── independent (shares lib/ai registry) ; F5 "Discuss with AI" links to it
```

- **Hard deps:** F5 → F1 (Dialog) ; F2 → F1 (save action carries the title it
  awards on). F4/F3 are independent and parallelizable.
- **Soft deps (polish, not blocking):** F5 shows F2 level badges; F5 detail links
  to F4 chat. Build the host feature without them; wire the link when both exist.

---

## 6. Recommended implementation order

**F1 → F2 → F3 → F4 → F5** (smallest/most-enabling first; largest/most-dependent
last). *Do not reorder to the task's 1–5 listing.*

1. **F1 Save Flow (S)** — no DB; ships the shared `Dialog`; improves every save;
   unblocks F5's share dialog. Lowest risk, immediate value.
2. **F2 Progress (M)** — additive tables; hooks the (now stable) save action;
   makes the dashboard compelling. Self-contained.
3. **F3 Compiler (M)** — independent; reuses Monaco; high perceived value; first
   external-service integration (establishes the proxy+quota pattern F4 reuses).
4. **F4 Chat (L)** — reuses `lib/ai` + the proxy/quota pattern from F3; streaming
   is the main new complexity.
5. **F5 Community (XL)** — last: depends on F1/F2, reuses the most primitives,
   introduces cross-user reads + moderation (highest surface/risk).

F3 and F4 can be built in parallel by separate sessions if desired (no shared
files beyond `limits.ts`).

---

## 7. Complexity estimates

| Feature | Size | Est. | New tables | New routes | Main risk driver |
|---|---|---|---|---|---|
| F1 Save Flow | **S** | ~0.5 d | 0 | 0 | a11y focus-trap correctness |
| F2 Progress | **M** | ~2 d | 2 | 0 | XP/streak atomicity + SQL/TS parity |
| F3 Compiler | **M** | ~2 d | 1 | 1 | Judge0 integration + abuse control |
| F4 Chat | **L** | ~3 d | 3 | 1 | streaming + server-side persistence/quota |
| F5 Community | **XL** | ~4–5 d | 4 | 3 | cross-user reads + moderation + feed/search |

Total ≈ **11–12 dev-days** of Sonnet implementation.

---

## 8. Risk assessment

| Risk | Affects | Mitigation (resolved in plan) |
|---|---|---|
| Base migration unapplied (B1) | all | Apply `init` + Phase 2 migrations before feature QA; documented apply path |
| In-memory limiter can't cap daily | F3, F4, F5 | **DB-backed daily quotas** (`ai_usage`, `code_executions`, daily action caps) + in-memory burst |
| Cross-user read leak | F5 | Reads filter `status='visible'`; mutations owner/actor-scoped; centralized + ownership tests |
| Lost-update races (XP, likes, usage) | F2,F4,F5 | Atomic SQL functions (`apply_progress_event`, `toggle_post_like`, `bump_ai_usage`) |
| Streaming loses assistant turn on disconnect | F4 | Persist user msg pre-stream; assistant + usage in stream `finally` server-side |
| Judge0 cost/quota/lang-ID drift | F3 | RapidAPI free tier + clean unavailable state; lang map centralized; verify IDs on setup |
| SQL `level_from_xp` ↔ TS `levelFromXp` drift | F2 | One parity unit test across a value sweep; both mirror one formula |
| XSS / IDOR / spam | F5 | Escape user content; server-side actor checks; daily caps + reporting + admin hide |
| Secret leakage | F3 | `JUDGE0_API_KEY` server-only; never `NEXT_PUBLIC_*`; not committed |

---

## 9. Security considerations (cross-cutting)

- **Secrets server-only:** `JUDGE0_API_KEY`, `CHAT_MODEL`/Groq key, service-role
  key — never in client bundles or `NEXT_PUBLIC_*`. New external keys added to
  `.env.example` + Vercel env, not git.
- **RLS deny-by-default** on every new table; service-role queries scoped in code
  (ownership everywhere except community visibility reads).
- **Input hardening on every new entry point:** auth guard, size caps, allow-lists,
  shape validation **before** any outbound/DB call (mirrors `/api/analyze`).
- **Rate limiting everywhere:** per-minute burst (in-memory) + per-day quota (DB).
- **Privacy parity:** never log/persist code, stdout, stdin, or chat content in
  logs; execution stores metadata only; submitted code never logged (existing
  commitment extends to new routes).
- **Prompt-injection (F4):** anchored code is treated as untrusted data, not
  instructions, in the system prompt.
- **Abuse/moderation (F5):** escape user-generated content (no raw HTML), report +
  admin hide/remove, per-author accountability via `author_id`.

---

## 10. Performance considerations

- **Indexes for every access pattern:** `(profile_id, created_at desc)` on owner
  tables; `(status, created_at desc)` and `(status, like_count desc, created_at)`
  on the feed; GIN on `community_posts.search`. All listed in the migrations.
- **Keyset (cursor) pagination** for the community feed — O(1) deep pages, stable
  under inserts (no offset scans).
- **Denormalized counters** (`like_count`, `comment_count`) avoid per-render
  `count(*)`; kept correct by atomic RPCs.
- **Single round-trips:** progress mutation, like toggle, and usage bump are each
  one RPC, not read-then-write.
- **No new heavy client deps:** charts are hand-rolled inline SVG (reuse
  `ComplexityTimeline` pattern); chat streaming is a hand-rolled reader (no SDK);
  Monaco is already dynamically imported. Keeps bundle + token cost down.
- **Server Components by default** — feed, post detail, dashboard widgets render
  on the server; only like/comment/compose/run are client islands.
- **Streaming (F4)** gives fast time-to-first-token; `maxDuration` set per route.

---

## 11. Testing strategy

Inherits the existing Vitest + Testing Library setup (jsdom; `server-only`
stubbed; Clerk/`next/*` mocked; Monaco never rendered). **Per feature**, add:

- **Unit (pure):** `levels` (+SQL parity), streak transitions, achievement
  predicates (F2); Judge0 normalizer + status mapping (F3); prompt builders +
  history trimming (F4); cursor encode/decode + search branch (F5).
- **Integration (routes/actions, db mocked):** `/api/execute` and `/api/chat`
  (auth/validation/quota/persistence); all new server actions
  (rate-limit-first, validation, scoping, revalidate). Extend the existing
  `db-ownership` suite to cover community visibility-vs-owner scoping.
- **Components:** SaveDialog/Dialog a11y (F1); progress widgets (F2);
  ExecutionResult (F3); message thread + composer (F4); PostCard optimistic
  like + comment/report (F5).
- **Invariants to keep green:** existing 211 tests; gate
  `npm run typecheck && npm run lint && npm run build && npm run test` after each
  feature. New invariant: SQL/TS level formulas agree.

Target: each feature lands its suite before the next begins (no net test debt).

---

## 12. Rollout strategy

1. **Pre-flight:** beta shipped (B3 merged), base `init` migration applied (B1),
   keys rotated (B2), CI gate ideally in place (recommended in MISSION_CONTROL).
2. **Per feature, in order F1→F5:**
   a. Branch `feature/phase2-<name>` off `main`.
   b. Apply that feature's migration to Supabase **before** deploying its code
      (additive → safe to apply ahead; routes degrade to empty/error if a table
      is missing, per `DbResult` discipline).
   c. Implement + land the feature's test suite; pass all four gates locally.
   d. Add env vars (F3: Judge0; F4: `CHAT_MODEL`) to Vercel **before** merge.
   e. Merge to `main` → **auto-deploys production** (pushing main = deploying).
      Verify the live route (Playwright smoke: auth, happy path, quota/error).
   f. Update `MISSION_CONTROL.md` (sprint), `ROADMAP.md` (move to shipped),
      `ARCHITECTURE.md`/`TRD.md` (new contracts), `SECOND_BRAIN.md` (decisions).
3. **Feature flags (optional, low-cost):** gate `/chat`, `/playground`,
   `/community` nav entries behind an env/allow-list to soft-launch to yourself
   first, then open up. Cheap insurance for the external-dependency features.
4. **Monitoring:** watch `execute.*`, `chat.*`, `groq.fallback`, `rate_limited`
   logs + Judge0/Groq usage dashboards for the first days after each launch.

---

## 13. Decisions to confirm (owner knobs — defaults chosen, won't block build)

Sonnet should proceed with these **defaults**; the owner can adjust later by
editing one constant/env:

1. **Quota sizes** (`lib/limits.ts`) — defaults: chat **50 msgs/day** (+10/min
   burst); execute **100 runs/day** (+10/min); community post **10/day**, comment
   **60/day**, like **120/min**, report **20/day**. *Tune to Groq/Judge0 cost.*
2. **Judge0 hosting** — default **RapidAPI Judge0 CE free tier** (speed-to-ship,
   no infra). Self-host is the scale/cost path. *Confirm before F3.*
3. **Community visibility** — default **authenticated-users-only** (whole app is
   gated). Public-web exposure is a later RLS/route change, no schema impact.
4. **XP values & achievement catalog** (`lib/progress/*`) — defaults in
   `02-progress.md`; purely cosmetic to tune.

> These are surfaced as defaults-with-rationale (not blocking questions) so
> implementation can start immediately.
```
