# ComplexityLab — Project Backlog

> **Single source of truth for everything still to build.**
> This document is designed to survive context loss across Claude Code sessions.
> For sprint-level focus see `MISSION_CONTROL.md`; for technical architecture
> see `ARCHITECTURE.md` and `PHASE2_PLAN.md`; for decisions/debt see `SECOND_BRAIN.md`.
>
> **Last updated: 2026-08-11 (production-readiness audit)**
>
> ⚠️ This file had drifted ~7 weeks stale (last substantive update: 2026-06-24) while
> `main` kept shipping — a full SEO content system (`/about`, `/faq`, `/changelog`,
> `/complexity-cheatsheet`, algorithm pages, guides), all 5 Learning Hub coaches
> (DSA/OOP/Git/CLI/SQL, not just the 2 documented below), mobile layout fixes, and a
> move to a custom domain all landed without a doc update. Treat anything below dated
> before 2026-08-11 as "shipped, but re-verify specifics before relying on them."

---

## Current Status

| Field | Value |
|---|---|
| **Active branch** | `main` (this session's work on `claude/production-readiness-ouphab`) |
| **Health** | `typecheck ✅ · lint ✅ · build ✅ (39 routes) · test ✅ (48 files / 505 tests)` |
| **Production URL** | https://www.complexitylab.top (custom domain, confirmed live) — the sole canonical URL as of 2026-08-15: `next.config.ts` permanently redirects the bare apex and every legacy Vercel alias (e.g. `complexity-lab-eight.vercel.app`) here. Auto-deploys from `main`. |
| **Current feature** | Production-readiness audit (2026-08-11): CI pipeline, optional Redis-backed global rate limiting, dependency vulnerability cleanup, queued F4 Chat UI polish, env var docs. See `MISSION_CONTROL.md` for the full list. |
| **Next task** | (1) **[User]** Upgrade Clerk to a production instance — confirmed still on `clerk.accounts.dev` in prod · (2) **[User]** Reconfirm Supabase migrations B1/B6/B7 are applied to `hhnmxyyrihrpyerdmgdw` · (3) **[User]** Reconfirm Judge0/RapidAPI subscription (B8) · (4) **[User]** Set `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` in Vercel to activate cross-instance rate limiting (code ships opt-in; unset = old in-memory behavior) · (5) F5 Community |
| **DB blocker** | Unconfirmed this session (no Supabase credentials available). Last known: `chat_conversations` missing `context_metadata` column; other migrations possibly unapplied. **Reconfirm in the Supabase SQL editor.** |
| **Key rotation** | ✅ Done (2026-06-18) — Clerk, Supabase, Groq all rotated |

---

## Completed Features

### Foundation & Infrastructure
- **Security baseline:** `.gitignore`, `.env.example`, secrets removed from git history
- **Next.js 16 + React 19 + TypeScript strict + Tailwind v3** — app lives in `frontend/`
- **Token-based design system** — `app/tokens.css`, `globals.css`
- **Dark Lab / Signal Green design system** — primitives: `BigOBadge`, `VerdictReadout`, `MetricGauge`, `ComplexityBadge`, `ProgressBar`, `Tag`, `Input`, `Switch`, `Card`, `Button`, `Select`, theme toggle
- **ESLint 9 flat config**
- **Vercel deployment** — `complexity-lab` project, team `tirths-projects-de842079`, Root Dir = `frontend`, auto-deploy from `main`
- **CI-equivalent local gates:** `typecheck · lint · build · test` (no GitHub Actions CI yet)

### Authentication & Routing
- **Google-only Clerk auth** — custom auth pages (`/sign-in`, `/sign-up`, `/sso-callback`), signals API `signIn.sso()`
- **`proxy.ts` route protection** — `PROTECTED_ROUTES` exported for tests, `unauthenticatedUrl: "/sign-in"` (prevents accounts.dev bounce)
- **`(app)` route group shell** — shared sidebar/topbar, dynamic topbar title, nav with active states
- **Consent gate** (`ConsentGate`) — accept → 1-year cookie (`cl-consent=v1`); decline → redirected off site; legal pages pre-consent

### Analyzer
- **Monaco editor** — Dark-Lab themes, theme-toggle aware, dynamic import (SSR disabled)
- **7 languages, 18 sample templates**
- **Groq AI provider** (`lib/ai/providers/groq.ts`) — strict-JSON completion, 20s timeout, auto-fallback to heuristic on ANY failure
- **Deterministic heuristic engine** (`lib/ai/engine.ts`) — regex/scan-based, doubles as mock provider and test oracle
- **`lib/ai` provider registry** — `AI_PROVIDER` env, vendor-swappable with no UI changes
- **Results panel** — TIME/SPACE verdict readouts, 4 metric gauges, SVG growth-timeline (`ComplexityTimeline`), scanline animation, reasoning notes
- **`POST /api/analyze`** — auth guard, validation, provider dispatch, 429 + Retry-After
- **`loading.tsx`** skeleton on the analyzer route
- **Ctrl/⌘+Enter keyboard shortcut** to analyze
- **Preferred language** auto-loaded from profile on analyzer open
- **IntroStrip** onboarding guide (dismissible)
- **Idle CTA** "Run first analysis" when editor is empty
- **`Ctrl/⌘+Enter` in-Monaco command** registered

### Data Layer & Database
- **Supabase migration** (`20260609000000_init.sql`) — `profiles`, `analyses` (full result JSONB), `saved_snippets` (tags[]), cascade deletes, `(profile_id, created_at desc)` indexes, RLS deny-by-default
- **Server-only `lib/db/*`** — service-role key, `server-only` package guard, Clerk-scoped, `DbResult<T>` returns (never throws)
- **`getOrCreateProfile()`** — Clerk user → Supabase profile, per-call resolution

### Save Flow (Phase 2 F1)
- **`SaveDialog` modal** (`components/analyzer/save-dialog.tsx`) — mandatory title + optional tags; `role="alert"` on failure; pending state; a11y compliant
- **`Dialog` primitive** (`components/ui/dialog.tsx`) — accessible: `role="dialog"`, `aria-modal`, focus trap (Tab/Shift+Tab), Escape key, backdrop click, portal to `document.body`, focus return
- **`deriveTitle` module** (`lib/analysis/derive-title.ts`) — pure, client-safe, extracted from server-only `actions.ts`
- **`saveAnalysisAction` + `saveSnippetAction`** — both require non-empty `title`; empty/whitespace rejected
- **`SaveActions` rewrite** — opens SaveDialog on click; saved state disables buttons + shows View links

### Progress System (Phase 2 F2 — 2026-06-18)
- **DB migration** (`20260616000100_progress.sql`) — `user_progress` + `xp_events` tables, `level_from_xp` SQL function, `apply_progress_event` atomic RPC
- **`lib/progress/levels.ts`** — pure `xpForLevel` / `levelFromXp` / `progressToNextLevel`
- **`lib/progress/achievements.ts`** — static `ACHIEVEMENTS` catalog (5 entries: first_analysis, analyzer_streak_3, analyzer_streak_7, speed_demon, completionist)
- **`lib/db/progress.ts`** — server-only: `getProgress`, `awardProgress`, `listXpHistory`, `listUnlockedAchievements`, `getProgressStats`; degrades gracefully when tables absent
- **`lib/progress/evaluate.ts`** — achievement predicate evaluation
- **`lib/progress/award.ts`** — `awardProgressForSave` orchestrator; best-effort, never throws, never fails the save
- **Dashboard widgets** — `LevelCard`, `StreakCard`, `AchievementGrid`, `ActivityChart` (all Server Components, inline SVG, no new deps)
- **Dashboard integration** — progress fetched in parallel, graceful empty state

### Cross-page Integration (2026-06-24)
- **Judge0 polling fallback** (`lib/execute/judge0.ts`) — `isTokenOnly()` detects token-only responses from free-tier RapidAPI; `pollSubmission()` polls up to 5×1s until terminal status. `callJudge0()` transparently handles both sync and async Judge0 responses.
- **Chat backend graceful degrade** (`app/api/chat/route.ts`) — profile failure and conversation creation failure are non-fatal; route streams in stateless mode. Production `context_metadata` column error handled; removed from INSERT, made optional in types.
- **Analyzer syntax error UI** (`lib/ai/types.ts`, `lib/ai/providers/groq.ts`, `components/analyzer/results-panel.tsx`) — Groq emits `"syntaxError"` field for unparseable code. `ResultsPanel` shows red `role="alert"` banner + card gets red border/tint when `analysis.syntaxError` is truthy.
- **Handoff system** — three new `sessionStorage` one-shot handoff modules: `lib/chat-handoff.ts` (code + analysis context → Chat), `lib/playground-handoff.ts` (code + language → Playground). All follow the existing `lib/analyzer-handoff.ts` pattern.
- **Analyzer → Playground** ("Open in Playground" button): `setPlaygroundHandoff` + `router.push('/playground')`. `PlaygroundShell` consumes on mount.
- **Analyzer → Chat** ("Chat with AI" button): builds context message with code block + time/space/verdict. `setChatHandoff` + `router.push('/chat')`. `ChatShell` consumes on mount.
- **Playground → Analyzer** ("Analyze" button in toolbar): `setAnalyzerHandoff` + `router.push('/analyzer')`. Already-existing `AnalyzerWorkbench` consumes.
- **Playground → Chat** ("Send to AI Chat" button after run completes): appears for any terminal run state (accepted, error, compile_error, runtime_error) — users most want to ask AI about failures. Builds context with code + status + output.
- **Tests: 48 files / 459 tests** (+18 new: chat-handoff, playground-handoff, judge0-polling, groq syntaxError paths).

### App Flows & UX
- **Dashboard** — real data: recent analyses, saved snippets, derived stats (counts, weekly activity, day streak, language mix)
- **`/analyses` list** — complexity badges, empty/error/loading states, two-step delete, link to detail
- **`/analyses/[id]` detail view** — stored code + persisted result JSONB re-rendered through `ResultsPanel`; delete-with-redirect; `CopyButton`
- **`/snippets` list** — expandable rows revealing code, `CopyButton`, "Open in analyzer" round-trip; two-step delete
- **"Open in analyzer" round-trips** — `sessionStorage` handoff (`lib/analyzer-handoff.ts`), one-shot `takeAnalyzerHandoff()` on mount
- **Settings: `/settings/profile`** — display name, preferred language (Supabase)
- **Settings: `/settings/account`** — Clerk identity, theme toggle, sign-out, delete-all-data danger zone
- **Toast system** (`components/ui/toaster.tsx`) — `useToast()` / `useToastSafe()` (no-op fallback for portability)
- **Mobile responsiveness** — Monaco `clamp(300px, 55dvh, 460px)`, drawer focus trap, 36px tap targets, `prefers-reduced-motion`
- **Error boundary** `(app)/error.tsx`; loading skeletons everywhere

### Security & Operations
- **Rate limiting** — `lib/rate-limit.ts` (sliding window, in-memory per instance); `lib/action-limit.ts` — analyze 20/min, saves 20/min, deletes 60/min, profile 10/min, delete-all 3/h
- **Structured logging** (`lib/log.ts`) — JSON events → Vercel runtime; code content never logged
- **Legal pack** — `/privacy`, `/terms`, forced `ConsentGate`
- **`dbError()`** — raw provider text logged server-side only; friendly copy to users
- **Secrets purged from git history** — `git filter-branch` + force-push (2026-06-09); all keys rotated (2026-06-18)
- **Screen reader accessibility** — `role="status"` + `aria-live="polite"` + `role="alert"` live regions in `ResultsPanel`
- **WCAG AA contrast** — `--text-muted: #8493ac`, `--text-faint: #7c8aa3` on dark surfaces

### Tests (36 files / 299 tests — 2026-06-18, post-F2)
- Engine-vs-samples (every sample template), route auth, protected-route matcher, save actions, ownership scoping (SEC-02/03), delete/settings actions, EDG-01 boundary, SEC-04 log-content, `GoogleAuthButton` (AUTH-04), `ConfirmDeleteButton`, `AnalyzerWorkbench`, `Dialog`, `SaveDialog`, `LevelCard`/`StreakCard`/`AchievementGrid`/`ActivityChart`, progress unit tests (levels, achievements, award)

### Code Execution Backend (Phase 2 F3 — 2026-06-18)

**Ownership note: backend complete. Playground UI (`/playground/page.tsx`, `components/playground/`) is assigned to the frontend developer.**

- **`supabase/migrations/20260616000200_executions.sql`** — `code_executions` table (metadata only: language, status, time_ms, memory_kb); `(profile_id, created_at desc)` index; RLS deny-by-default. **Must be applied manually to `hhnmxyyrihrpyerdmgdw` via SQL editor.**
- **`lib/execute/types.ts`** — `ExecutionStatus` union + `ExecutionResult` interface (transient API shape, not persisted in DB)
- **`lib/execute/languages.ts`** — `JUDGE0_LANGUAGES` map (7 languages → Judge0 language IDs) + `isExecutable()` guard. IDs must be verified against the live `/languages` endpoint before first deploy.
- **`lib/execute/judge0.ts`** — Judge0 HTTP client: `buildJudge0Request` (base64-encodes code + stdin, spreads `RESOURCE_LIMITS`), `normalizeResult` (maps status IDs, decodes base64, truncates output at 64 KB), `callJudge0` (POST with `wait=true&base64_encoded=true`, `cache:"no-store"`, AbortSignal). Pure functions (`buildJudge0Request`, `normalizeResult`) are directly unit-testable.
- **`lib/db/executions.ts`** — server-only: `countExecutionsToday` (UTC-midnight COUNT query for quota gate; gracefully returns `{ok:false}` on DB error), `recordExecution` (inserts metadata only — code/stdin/stdout NEVER stored)
- **`lib/limits.ts`** — added: `MAX_EXEC_CODE_LENGTH=20000`, `MAX_EXEC_STDIN_LENGTH=4000`, `EXECUTE_RATE_LIMIT={limit:10,windowMs:60000}`, `EXECUTE_DAILY_QUOTA=100`
- **`app/api/execute/route.ts`** — `POST /api/execute` with `maxDuration=15`. Pipeline: auth → rate-limit (10/min in-memory) → daily quota (DB-backed, graceful degrade on failure) → validate body → AbortController(12s) + `callJudge0` → `normalizeResult` → best-effort `recordExecution` → `logEvent`. Privacy: code/stdin/stdout never logged or persisted anywhere.
- **`proxy.ts`** — `/playground(.*)` added to `PROTECTED_ROUTES`
- **`components/layout/nav.ts`** — Playground nav item added (Terminal icon, `ready: false`)
- **`.env.example`** — `JUDGE0_API_KEY` + `JUDGE0_API_HOST` added with server-only warning. Must be set in Vercel env vars before deploying F3 frontend.
- **Three-layer kill switch:** AbortController 12s (route) + `wall_time_limit=8s` (Judge0) + `maxDuration=15` (Vercel). Independent layers.

### Tests (38 files / 341 tests — 2026-06-18, post-F3 backend)
- All prior tests + 42 new: `tests/unit/judge0-normalize.test.ts` (25 tests: status mapping, base64 decode, truncation, timing, resource limits) + `tests/integration/execute-route.test.ts` (17 tests: 401 unauth, 429 rate-limit, 429 quota, quota-check-fail graceful, 400/413 validation, 200 happy path, 200 compile error, 200 Judge0 unreachable, recordExecution failure non-blocking, SEC metadata-only, SEC never logs code/stdout)

### AI Chat Backend (Phase 2 F4 — 2026-06-18)

**Ownership note: backend complete. Chat UI (`/chat/page.tsx`, `components/chat/`) is for the frontend developer.**

- **`supabase/migrations/20260616000300_chat.sql`** — `chat_conversations` + `chat_messages` + `ai_usage` tables; `bump_ai_usage` atomic upsert RPC; `context_metadata jsonb` for RAG extensibility; RLS deny-by-default. Must be applied manually to `hhnmxyyrihrpyerdmgdw`.
- **`lib/ai/groq-client.ts`** (extended) — `groqStream()` async generator; `GroqStreamOptions.onUsage` callback; `stream_options.include_usage:true` captures real token counts from Groq's SSE usage chunk.
- **`lib/ai/chat-provider.ts`** — `ChatProvider` interface + `ChatStreamOpts`; separate from `AnalysisProvider` (Interface Segregation Principle).
- **`lib/ai/providers/groq-chat.ts`** — Groq streaming chat; throws on missing API key (no heuristic fallback for chat).
- **`lib/ai/providers/mock-chat.ts`** — Deterministic test mock; fires `onUsage` after completing.
- **`lib/ai/chat.ts`** — Provider registry; `getChatProvider()`; `CHAT_PROVIDER` env; empty string falls back to default (groq-if-key-else-mock).
- **`lib/ai/prompts/chat.ts`** — `chatSystemPrompt()` (tutor persona, anchored analysis context, 2000-char code truncation, untrusted-data instruction); `buildChatMessages()` (history windowing to `CHAT_HISTORY_LIMIT`).
- **`lib/db/chat.ts`** — Server-only data layer; all functions accept explicit `profileId` (resolved once at route entry, not per-call): `createConversation`, `getConversation`, `listMessages`, `appendMessage`, `getUsageToday`, `bumpUsage`.
- **`lib/limits.ts`** — Added `MAX_CHAT_MESSAGE_LENGTH`, `CHAT_HISTORY_LIMIT`, `CHAT_RATE_LIMIT`, `CHAT_DAILY_QUOTA`.
- **`types/index.ts`** — Added `Conversation`, `Message`, `AiUsageToday` interfaces.
- **`lib/db/mappers.ts`** — Added `ConversationRow`, `MessageRow`, `mapConversation`, `mapMessage`.
- **`app/api/chat/route.ts`** — `POST /api/chat` (`maxDuration=30`). Pipeline: auth → parse/validate → getOrCreateProfile (once) → daily quota gate (graceful degrade on DB failure) → burst rate-limit → get/create conversation → listMessages + buildChatMessages → appendMessage(user, PRE-STREAM) → `ReadableStream` SSE (text deltas + done sentinel) → `finally`: appendMessage(assistant) + bumpUsage(1 turn). Privacy: message content never in any `logEvent`.
- **`proxy.ts`** — `/chat(.*)` added to `PROTECTED_ROUTES`.
- **`components/layout/nav.ts`** — Chat nav item added (MessageSquare icon, `ready: false`).

### Tests (41 files / 379 tests — 2026-06-18, post-F4 backend)
- All prior tests + 38 new: `tests/unit/chat-prompts.test.ts` (13: prompt content, anchored context, truncation, untrusted-data instruction, `buildChatMessages` windowing) + `tests/unit/chat-registry.test.ts` (6: provider selection, env override, unknown throws) + `tests/integration/chat-route.test.ts` (18: auth, validation, daily quota, burst rate-limit, graceful degrade, not-found, new/existing conversation, pre-stream persist, finally persist + bumpUsage, SSE streaming, stream error, privacy, contextRef, empty-stream bumpUsage)

### AI Chat Frontend (Phase 2 F4 — 2026-06-18)

**Ownership note:** Chat UI implemented by the backend session (not the separate frontend developer). Full working UI — streaming, SSE, a11y, tests.

- **`components/layout/nav.ts`** — Chat nav item: `ready: true` (was `false`) — renders as a live link.
- **`app/(app)/chat/page.tsx`** — Server Component wrapper; `metadata.title = "Chat · ComplexityLab"`.
- **`app/(app)/chat/loading.tsx`** — Skeleton loading UI matching chat layout.
- **`components/chat/chat-shell.tsx`** — Full `"use client"` Chat UI. State machine: `messages`, `input`, `streaming`, `conversationId`, `error`. Hand-rolled `ReadableStream.getReader()` SSE loop. Enter-to-send / Shift+Enter-for-newline. `role="log" aria-live="polite"` message list. Empty state. `role="alert"` on error. Existing `…` placeholder shown during streaming.
- **`tests/components/chat-shell.test.tsx`** — 14 tests covering all paths.

### Tests (42 files / 393 tests — 2026-06-18, post-F4 frontend)
- All prior tests + 14 new: `tests/components/chat-shell.test.tsx` (14: empty state, input, Shift+Enter guard, user message visible immediately, input cleared, streaming chunks concat, input re-enabled after stream, API/SSE error alerts, empty-assistant-placeholder cleanup, conversationId forwarded on second turn)

### Undocumented shipped work (2026-06-24 → 2026-08-11, discovered via git log during the 2026-08-11 audit — never landed in these docs)
- **Full SEO content system**: `sitemap.ts`, `robots.ts`, per-page canonicals, `metadataBase` — all pointed at the new custom domain `www.complexitylab.top`. New indexable pages: `/about`, `/faq`, `/changelog`, `/complexity-cheatsheet`, `/algorithms/{binary-search,merge-sort,quicksort}`, `/guides/{how-to-analyze-time-complexity,space-complexity-explained,big-o-vs-big-theta-vs-big-omega}`.
- **Custom domain live**: `www.complexitylab.top` — confirmed 200 alongside the original `complexity-lab-eight.vercel.app`.
- **All 5 Learning Hub coaches shipped** (not just DSA/OOP as last documented) — Git Coach, CLI Coach, and SQL Coach all built and enabled (`app/(app)/learning/{git,cli,sql}/page.tsx`, each a real `CoachShell` with starter prompts, not "coming soon").
- **Mobile layout fixes**: sidebar drawer layering, responsive app shell.
- **Misc**: teaching comments pass across core modules, About page, Learning Hub card hover-state polish, sign-in background refinement.

> These were fully functional and gated by the same CI-equivalent local checks
> before merging — this is a **documentation gap**, not a code gap. Flagging here
> so the next session doesn't have to rediscover it from `git log`.

### Production-Readiness Audit (2026-08-11, `claude/production-readiness-ouphab`)
- **`.github/workflows/ci.yml`** — new: `typecheck → lint → build → test` on every push/PR to `main`; `npm ci` cached by `package-lock.json`; no secrets required.
- **`lib/rate-limit.ts`** — added an optional Upstash Redis REST backend (`rateLimitRedis`, `upstashPipeline`) behind the same `rateLimit()` signature; sorted-set sliding window (`ZREMRANGEBYSCORE`/`ZCARD`/`ZRANGE`/`ZADD`/`PEXPIRE` via `/pipeline`); fails open to the pre-existing in-memory `rateLimitMemory()` (exported, same logic as before) on any Redis error, timeout (1.5s `AbortSignal.timeout`), or when the two env vars are unset. `rateLimit()` is now `async` — all 5 call sites (`app/api/{analyze,chat,execute}/route.ts`, `lib/action-limit.ts`) updated to `await` it.
- **`npm audit fix`** — 10 vulnerabilities (7 high, incl. a `next@16.2.7` cluster: SSRF, cache confusion, DoS) → 3 (2 low, 1 moderate, both transitive/dev-only), resolved within existing `package.json` semver ranges (`next` → `16.3.0`), no code changes required.
- **`.env.example`** — documented `CHAT_PROVIDER`, `CHAT_MODEL` (previously undocumented but read by `lib/ai/chat.ts`), and new `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`.
- **`components/chat/chat-shell.tsx`** — shipped the F4 Chat UI polish queued since 2026-06-18: `.animate-rise` fade-up empty state, `.premium-panel` composer wrapper, auto-resizing textarea (was fixed `rows={3}`, now grows to a 200px cap via a `useEffect` keyed on `input`), three staggered `animate-pulse` dots replacing the static `...` streaming placeholder. Zero behavior change — all pre-existing DOM contracts (`id="chat-input"`, `aria-label="Send message"`, `role="log"`, `[class*='rounded-ds-lg px-3']`) preserved.
- **Live-verified**: `www.complexitylab.top` and `complexity-lab-eight.vercel.app` both return 200; production `/sign-in` confirmed still serving `clerk.accounts.dev` (Clerk dev instance — see Beta Blockers).
- **Tests: 48 files / 505 tests** (+5: `rateLimit()` Redis-path unit tests covering allow/reject/fallback-on-error/fallback-on-throw).
- **Not done this session** (needs access this sandbox doesn't have): Clerk production instance upgrade; reconfirming Supabase migration status; reconfirming Judge0/RapidAPI subscription; actually setting the new `UPSTASH_REDIS_REST_URL`/`TOKEN` env vars in Vercel (the code supports it, but it's inert until configured).

---

## In Progress

**F4 fully complete (Backend + Frontend, 2026-06-18). F4 Chat UI Polish is the queued next item.**

### F4 Chat UI Polish (CSS-first visual restyle — QUEUED, not started)

Restyle the existing `/chat` page to move toward a premium animated AI chat aesthetic. This is a UI enhancement only — no rebuild, no behavior change, no new dependencies.

**Planned changes to `components/chat/chat-shell.tsx`:**
- Animated fade-up empty state using `.animate-rise` (already in `globals.css`)
- Elevated glassy composer container using `.premium-panel` + `shadow-glow-green` focus token
- Auto-resize textarea (remove fixed `rows={3}`, add `onInput` height adjustment)
- Pulsing 3-dot thinking indicator using `animate-pulse` (replaces `…` during streaming)

**CRITICAL constraints (must not break tests):**
- Keep `id="chat-input"` + `<label htmlFor="chat-input">` (test: `getByLabelText("Message")`)
- Keep `aria-label="Send message"` on button (test: `getByLabelText("Send message")`)
- Keep `role="log"` and `role="alert"` attributes
- Keep `rounded-ds-lg px-3` as adjacent classes on bubble divs (test 10 queries `[class*='rounded-ds-lg px-3']`)
- Keep empty-state text strings in DOM at render time (tests assert synchronously, no `waitFor`)
- Do NOT use framer-motion — not validated in jsdom; only in `hero-section-nexus.tsx` which has no tests

**Immediate next steps (in order):**
1. **[Next session — this AI]** F4 Chat UI Polish (implement restyle above, run all gates)
2. **[Manual, external]** Apply `supabase/migrations/20260616000300_chat.sql` to project `hhnmxyyrihrpyerdmgdw` via Supabase SQL editor (also apply B1, B6 first)
3. **[Other developer]** Implement `/playground/page.tsx` + `components/playground/` UI that calls `POST /api/execute`
4. **[Whenever]** Add `JUDGE0_API_KEY`, `JUDGE0_API_HOST`, and optional `CHAT_MODEL` to Vercel environment variables

---

## Planned Features

### Phase 2 Roadmap (specs in `docs/phase2/` and `PHASE2_PLAN.md`)

All Phase 2 features are **post-beta** (require B1 + B3 resolved first).
Build order: **F3 → F4 → F5** (F1+F2 already shipped).

#### ✅ F3 — Online Compiler (Monaco + Judge0) · **Backend COMPLETE 2026-06-18**

**Backend:** `POST /api/execute`, `lib/execute/`, `lib/db/executions.ts`, migration — all done. 42 new tests. See "Code Execution Backend" in Completed Features above.

**Frontend (other developer — NOT STARTED):**
- **Page:** `/playground/page.tsx` — `CodeEditor` reuse, stdin textarea, language select (7 langs), Run button, `ExecutionResult` panel (status badge, stdout, stderr/compile_output, time/memory)
- **Components:** `components/playground/` — playground layout, execution result display
- **Wires to:** `POST /api/execute` — request body: `{ code, language, stdin? }` — response: `{ result: ExecutionResult }`
- **ExecutionResult shape:** `{ status, statusLabel, stdout, stderr, compileOutput, timeMs, memoryKb }` — defined in `lib/execute/types.ts`
- **Pre-deploy:** add `JUDGE0_API_KEY` + `JUDGE0_API_HOST` to Vercel env vars

#### ✅ F4 — AI Chat (context-aware, streaming, persisted) · **FULLY COMPLETE 2026-06-18**

**Backend:** `POST /api/chat`, `lib/ai/chat*.ts`, `lib/ai/prompts/chat.ts`, `lib/db/chat.ts`, migration — all done. 38 new tests. See "AI Chat Backend" in Completed Features above.

**Frontend:** `/chat/page.tsx`, `app/(app)/chat/loading.tsx`, `components/chat/chat-shell.tsx` — all done. 14 new tests. See "AI Chat Frontend" in Completed Features above.

**F4 UI Polish (queued — see "In Progress"):** CSS-first visual restyle of the existing `/chat` page. No behavior change. No new dependencies.

**Pre-deploy:** Apply `20260616000300_chat.sql` to Supabase (B7); add optional `CHAT_MODEL` to Vercel env vars.

#### F5 — Community (share · feed · likes · comments · moderation) · Size: XL · ~4–5 days
- **Pages:** `/community` (feed), `/community/[id]` (post detail), `/community/moderation` (admin-gated)
- **Database:** `community_posts` (immutable snapshot of code + Big-O + result, author denormalized, `status` field, `like_count` + `comment_count` denormalized, GIN search tsvector), `post_likes` ((post_id, profile_id) PK), `post_comments` (body, status), `post_reports` (reason, status)
- **Cross-user reads:** feed/detail filter by `status='visible'` (not owner) via service-role client; all mutations remain owner-scoped — document this clearly in `lib/db/community.ts`
- **Atomic SQL functions:** `toggle_post_like()`, `community_posts_search_update` trigger
- **Pagination:** keyset (cursor) pagination for the feed — O(1) deep pages, stable under inserts
- **Quotas:** post 10/day, comment 60/day, like 120/min, report 20/day
- **Author identity:** denormalized at post time (`author_name` snapshot, "Anonymous" fallback)
- **Moderation:** report flow → admin hide (`status='hidden'`) or remove (`status='removed'`); `/community/moderation` is admin-gated
- **XSS protection:** escape user-generated content (no raw HTML)
- **Soft deps (polish, not blocking):** F2 level badge on author, "Discuss with AI" link to F4 chat
- **Share from analyzer:** SaveActions gets a "Share to Community" option after F1 title dialog resolves; posts are immutable snapshots
- **Migration:** `supabase/migrations/20260616000400_community.sql`
- **Tests:** unit (cursor encode/decode, search branch), integration (visibility vs ownership scoping, moderation actions), component (`PostCard` optimistic like + comment/report)

---

## Beta Blockers

Track these before any public beta launch.

| # | Issue | Status | Notes |
|---|---|---|---|
| B1 | **DB migration unapplied** — `supabase/migrations/20260609000000_init.sql` not applied to Supabase project `hhnmxyyrihrpyerdmgdw`; saves/dashboard broken | 🔵 External | Apply via Supabase Dashboard SQL editor. Then apply `20260616000100_progress.sql`, then `20260616000200_executions.sql`. Apply in sequence. **Top rollout dependency.** |
| B2 | **Leaked secrets unrotated** | ✅ Done (2026-06-18) | Clerk, Supabase (incl. service-role), Groq all rotated |
| B3 | **`beta-prep-audit` branch not merged** — 5 code fixes + QA docs + ownership tests undeployed | 🟡 Ready | Already incorporated into `feature/next-sprint-v1`; merge `feature/next-sprint-v1` → `main` to deploy |
| B4 | **AUTH-03/04 manual QA** — Google SSO completes + error resets spinner; zero manual coverage | ⬜ Pending | Test with a real Google account in production |
| B5 | **SEC-02/03 manual QA** — cross-account ownership (two Google accounts) | ⬜ Pending | Test with two separate Google sign-ins; verify one user can't read/delete another's data |
| B6 | **F3 migration unapplied** — `supabase/migrations/20260616000200_executions.sql` not applied to `hhnmxyyrihrpyerdmgdw`; `/api/execute` quota tracking broken (execution still works, recording fails gracefully) | ⬜ Pending manual deployment | Apply after B1 migration. The route degrades gracefully (allows execution, logs warning) if table is absent. |
| B7 | **F4 chat migration unapplied** — `supabase/migrations/20260616000300_chat.sql` not applied; `chat_conversations`, `chat_messages`, `ai_usage` tables missing; chat history not persisted between page loads (graceful degrade — route works, history lost on reload) | ⬜ Pending manual deployment | Apply after B6. Route degrades gracefully. |

---

## Strongly Recommended Before Public Launch

- **Production Clerk instance** — replace `pk_test` / `accounts.dev` with a production instance (custom domain). **Confirmed still outstanding (2026-08-11)**: production `www.complexitylab.top/sign-in` serves `clerk.accounts.dev`. Current dev instance won't scale and may have rate limits.
- ~~**CI gate**~~ ✅ **Done (2026-08-11)** — `.github/workflows/ci.yml` runs `typecheck && lint && build && test` on every push/PR to `main`. No secrets needed (the build doesn't read env vars at build time).
- ~~**Global rate limiting**~~ ✅ **Done, opt-in (2026-08-11)** — `lib/rate-limit.ts` now backs onto Upstash Redis (REST API, no SDK) when `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are set, with automatic fail-open fallback to the original in-memory limiter on any Redis error. **Still needs those two env vars set in Vercel to actually activate cross-instance enforcement in production** — shipping the code doesn't turn it on by itself.
- **Product analytics** — wire a funnel (e.g. PostHog) to measure: sign-up → first analysis, first save, save rate, day streak, own-code conversion. North star: weekly analyses per active user.

---

## AI Roadmap

### Current AI Layer
- Groq `llama-3.3-70b-versatile` for analysis (JSON mode), deterministic heuristic fallback
- Planned F4 Chat: Groq-backed streaming chat, context-aware per-conversation
- Provider registry in `lib/ai` — vendor-swappable via `AI_PROVIDER` env

### LeetCode Intelligence (Future — not scheduled)

Build a curated LeetCode knowledge base to help users practice algorithmic problem-solving with guided feedback, not just solutions.

**Core capabilities to build:**
- **Problem knowledge base** — curated dataset of LeetCode problems, organized by pattern (sliding window, two pointers, BFS/DFS, dynamic programming, greedy, etc.)
- **Groq-backed inference** — use Groq as the inference model for all LeetCode intelligence features
- **Embeddings + RAG retrieval** — embed problems and user code; retrieve similar problems using cosine similarity / vector search
- **Hint system** — give progressive hints instead of immediate solutions; detect which step of the algorithm the user is stuck on
- **Algorithm pattern detection** — identify patterns in user code (e.g. "you're doing a linear scan — consider a hash map")
- **Time + space complexity explanation** — explain WHY a solution is O(n log n), not just the label; compare to optimal
- **Solution comparison** — compare user's solution to the canonical optimal; highlight structural differences
- **Personalized feedback** — track which problems/patterns the user has attempted; tailor hints based on previous mistakes
- **Practice recommendations** — recommend next problems based on weak topics and current level
- **Weak topic tracking** — persist accuracy by pattern/category; surface in dashboard
- **Interview follow-up questions** — after solving, generate follow-up questions ("What if the array is sorted?", "Can you do this in O(1) space?")
- **Adaptive difficulty** — adjust problem difficulty as user improves

**Technical approach:**
- Supabase `pgvector` extension for embedding storage and similarity search
- Problem embeddings pre-computed (Groq or open embedding model)
- RAG pipeline: user code → embed → retrieve K similar problems → assemble prompt → Groq → structured response
- Per-user accuracy store: `(user_id, pattern, attempt_count, success_count)`

> **This is a future roadmap item. Do not build until Phase 2 is complete and beta is stable.**

### AI Tutor Chat (Phase 2 F4 — first milestone toward the above)
Already planned in Phase 2. F4 lays the foundation (conversation persistence, streaming, context anchoring) that the LeetCode intelligence layer will build on.

### Other AI Ideas
- **Explain-my-complexity** — after analysis, a "Tell me why" button that streams a pedagogical explanation tuned to the user's level (beginner / intermediate / advanced)
- **Alternative solution suggestion** — "Here's how you could rewrite this as O(n log n)" with code examples
- **Code review AI** — general code quality review beyond just complexity (naming, structure, edge cases)
- **Interview simulation mode** — timed coding sessions with an AI interviewer asking follow-up questions in real time

---

## Nice-to-Have Features

These improve the product but are not essential for MVP or beta.

### Analyzer Improvements
- **Snippet tag editing** — `Tag` primitive already supports add/remove; just needs UI wired in the snippet editor
- **Syntax highlighting on stored-code view** — currently plain `<pre>` (Monaco is too heavy for view-only; consider a lightweight highlighter like `shiki`)
- **Shareable result URLs** — a `/r/[id]` public-accessible route for sharing a single analysis result
- **More language support** — beyond the current 7 (JavaScript, TypeScript, Python, Java, C++, Go, Rust)
- **Editor themes** — additional Dark-Lab themes for the Monaco editor
- **Code diff view** — show "before/after" when user analyzes a refactored version

### Dashboard Improvements
- **XP history chart** — already built (`ActivityChart`); add week/month/all-time toggle
- **Achievement notifications** — toast when a new achievement is unlocked
- **More achievements** — current catalog has 5; expand with: "100 analyses", "All languages tried", "7-day streak", "First community post", "First helpful comment"
- **Leaderboard** — opt-in, weekly XP rankings (requires community feature)
- **Progress export** — "download my history as CSV"

### UX & Design
- **Onboarding flow** — guided multi-step wizard for new users: try the analyzer → save first result → explore dashboard
- **Empty-state CTAs** — improve empty states on `/analyses` and `/snippets` to guide new users
- **Better landing page** — animated complexity visualizer on the hero (shows O(n) vs O(n²) growth curves)
- **Dark/light mode polish** — review every component for light-mode contrast
- **Keyboard shortcuts** — a `/keyboard-shortcuts` page or modal listing all shortcuts
- **"What's new" changelog** — in-app changelog (modal or page) when new features ship

### Settings & Account
- **Email notifications** — daily streak reminders, achievement unlocks (requires email provider)
- **Profile page** — public profile page showing username, level, and selected stats (opt-in)
- **Export all data** — ZIP download of analyses, snippets, and XP history (GDPR compliance)
- **Account deletion confirmation email**

### Mobile
- **PWA support** — manifest + service worker for "Add to home screen"
- **Bottom navigation** — replace the side drawer with a bottom tab bar on mobile
- **Touch-optimized code editor** — investigate mobile-friendly alternatives to Monaco (CodeMirror 6)

### Performance
- **Memoize `getOrCreateProfile()`** with React `cache()` — currently runs 2–3 queries per page load
- **Global rate limiting via Upstash/KV** — replace in-memory limiter for cross-instance enforcement
- **Image optimization** — `next/image` for any images added in the future
- **Streaming SSR** — investigate `Suspense` boundaries on slow DB calls

---

## Technical Debt

These should eventually be addressed but were accepted for MVP/beta.

| Debt | Severity | Notes |
|---|---|---|
| **Heuristic engine is regex/scan-based (no AST)** | Medium | Python comprehensions not counted as loops; some space-complexity cases undercounted (dict growth via index assignment); amortized costs (e.g. `list.append`) ignored. Fix: build an AST-based engine for Python/JS |
| **`getOrCreateProfile()` runs per data call** | Low | 2–3 small queries per page load. Fix: `React.cache()` memoization per-request |
| ~~**Rate limits are per warm instance**~~ | ~~Medium~~ | ✅ Fixed 2026-08-11 — `lib/rate-limit.ts` supports Upstash Redis (global) with fallback to in-memory (per-instance) when unconfigured. Set `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` in Vercel to enable globally. |
| ~~**No CI pipeline**~~ | ~~High~~ | ✅ Fixed 2026-08-11 — `.github/workflows/ci.yml`, runs on every push/PR to `main` |
| **3 low/moderate `npm audit` advisories** | Low | Down from 10 (7 high) as of 2026-08-11 — remaining are transitive, dev tooling only (`dompurify` via `monaco-editor`, `esbuild` via the vitest chain) |
| **Clerk dev instance in production** | High | `pk_test` / `accounts.dev` keys; **confirmed still live in production as of 2026-08-11** (`www.complexitylab.top/sign-in` serves `clerk.accounts.dev`); must upgrade before public launch |
| **Monaco theme colors are hardcoded hex** | Low | Sanctioned exception to the "tokens only" rule; must be kept in sync manually when tokens change |
| **No DB indexes on Phase 2 tables** | Low | Phase 2 migrations include indexes (`(profile_id, created_at desc)`), but won't be applied until B1 is resolved |
| **SECOND_BRAIN.md last updated 2026-06-10** | Low | Missing Phase 2 decisions (Dialog a11y choices, progress atomicity pattern, best-effort award pattern) — should be updated after F2 merge |
| **Snippet tags non-editable after save** | Low | `Tag` primitive supports add/remove; no edit UI wired |
| **Stored-code view has no syntax highlighting** | Low | Plain `<pre>` — deliberate (Monaco too heavy for view-only) |
| **No `supabase/migrations` lint/validation** | Low | Migrations are applied manually; no automated check that they match the TypeScript types |

---

## Future Ideas

A brain dump of every feature idea discussed or worth capturing. Nothing lost.

### Platform & Community
- **Algorithm catalog** — browsable library of classic algorithms (sorting, searching, graph traversal, DP) with complexity annotations. The original product vision.
- **Animated visualizers** — step-through animations of algorithm execution (e.g. quicksort pivot selection, BFS frontier expansion). Build on top of the catalog.
- **Lessons content model** — structured lessons tied to algorithm types; RSC lesson pages with embedded analyzer; progress tracked per lesson
- **Per-lesson quizzes** — attempts, scoring, feedback; "You've seen this pattern before in your history"
- **Community feed** — planned F5; share analyses publicly, like, comment, discover others' code
- **"Ask the community"** — post a problem, get complexity help from other users
- **Weekly challenges** — algorithmic challenges with a leaderboard; winners featured
- **Study groups** — shared snippet collections, collaborative analysis sessions

### Personalization & Progress
- **Skill graph** — per-algorithm-type skill rating, shown as a radar chart on the dashboard
- **Learning path recommendations** — "Based on your O(n²) analyses, practice DP problems next"
- **Spaced repetition** — resurface old analyses for review based on forgetting curve
- **Streak recovery** — miss a day? "Freeze" your streak with a one-time recovery token (earned via XP)
- **Level perks** — unlock features or themes at certain XP thresholds

### Enterprise & Education
- **Educator dashboard** — create class codes, track student analyses and progress, flag common mistakes
- **Assignment mode** — educator assigns a problem, students submit analyses, results compared
- **API access** — REST API for integrating complexity analysis into IDEs or CI pipelines (premium tier)
- **Team workspaces** — shared analysis libraries, team-level stats
- **SSO / SAML** — enterprise auth for educational institutions

### Monetization
- **Premium tier** — unlimited analyses per day, longer chat history, advanced export, priority support
- **Student/educator discount** — `.edu` email verification
- **GitHub Copilot-style pricing** — per-seat subscription for teams

### Integrations
- **VS Code extension** — analyze complexity inline in the editor without leaving the IDE
- **GitHub Action** — CI step that flags code with worse-than-target complexity
- **LeetCode integration** — import a problem + solution directly from LeetCode (browser extension)
- **Notion/Confluence export** — export analysis results to documentation tools
- **Slack bot** — `/complexity <paste code>` in Slack channels

### Infrastructure
- **Multi-region Supabase** — reduce latency for non-US users
- **Edge runtime for `/api/analyze`** — move the route to Vercel Edge for lower cold-start latency
- **Streaming analysis** — stream complexity verdicts as they're computed, instead of waiting for the full response
- **Model fine-tuning** — fine-tune a small open-source model on algorithmic complexity examples for faster, cheaper inference
- **Self-hosted Judge0** — replace RapidAPI Judge0 with a self-hosted instance for cost/privacy at scale

---

*End of PROJECT_BACKLOG.md — maintained alongside `MISSION_CONTROL.md`.*
*Update the "In Progress" and "Current Status" sections every working session.*
