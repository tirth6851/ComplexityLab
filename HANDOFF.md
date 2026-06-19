# ComplexityLab Handoff Document

> **Audience:** A senior engineer — human or a fresh Claude Code session — opening this
> repository with zero prior conversation history.
>
> **Status as of 2026-06-18:** MVP, beta stabilization, Phase 2 F1 (Save Flow),
> Phase 2 F2 (Progress: XP, levels, streaks, achievements), Phase 2 F3
> (Code Execution Backend), and Phase 2 F4 (AI Chat Backend) are complete on
> `feature/next-sprint-v1`. Branch health check is **fully green** —
> **379/379 tests** (41 files), typecheck ✅, lint ✅, build ✅ (17 routes).
> `main` last verified green at **211/211 tests** (commit `5829ac4`, 2026-06-14).
>
> **Ownership split (active):** Backend (AI Platform) is handled by this AI session.
> Frontend/UX is handled by a separate developer. F3 frontend (`/playground/page.tsx`,
> `components/playground/`) is NOT yet started.
>
> **Live:** https://complexity-lab-eight.vercel.app — GitHub `main` auto-deploys
> production. **A push to `main` is a deploy.**
>
> **Companion docs:** `ARCHITECTURE.md` · `ROADMAP.md` · `DESIGN_HANDOFF.md` ·
> `CLAUDE.md` · `PHASE2_PLAN.md` (Phase 2 specs).
>
> **Read `MISSION_CONTROL.md` first each session.**

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Completed Work](#completed-work) ← history at a glance
3. [Active Work & Open Items](#active-work--open-items) ← current focus
4. [Feature Status Matrix](#feature-status-matrix) ← single status reference
5. [Architecture](#architecture-summary)
6. [Security Notes](#security-notes)
7. [Session History (detailed)](#session-history-detailed)
8. [Environment Variables](#environment-variables)
9. [Development Rules](#development-rules)
10. [Quick Start For New Sessions](#quick-start-for-new-sessions)
11. [Long-Term Vision](#long-term-vision) ← `PROJECT_BACKLOG.md` reference

---

## Executive Summary

**ComplexityLab** is an interactive complexity-analysis and algorithm-learning platform:
paste code → see time/space complexity on a green→red gradient → save analyses and
snippets → track activity. Dark-Lab "instrument panel" aesthetic, Signal Green accent.

**What works today (signed in):**
- **/analyzer** — Monaco editor, 7 languages, 18 sample templates, Analyze action
  (deterministic heuristic engine with Groq AI and auto-fallback), verdict readouts,
  metric gauges, SVG growth-timeline chart, reasoning notes. **Phase 2 F1:** Save now
  opens a modal requiring a confirmed title — on `feature/next-sprint-v1`, pending
  health check.
- **/dashboard** — real data: recent analyses, saved snippets, derived stats (counts,
  weekly activity, day streak, language mix).
- **/analyses, /snippets** — lists with two-step delete, empty/error/loading states.
- **/analyses/[id]** — detail view: stored code + persisted result JSONB re-rendered
  through the results panel; delete-with-redirect.
- **/settings/profile** (display name, preferred language) and **/settings/account**
  (Clerk identity, theme, sign-out, delete-all-data danger zone).
- **Rate limiting** on every route and server action; **structured logging** (code never
  logged); **legal pack** (`/privacy`, `/terms`, forced consent gate).

**Blocking the full data flow** (external dependency):
1. **Apply the DB migration** — `supabase/migrations/20260609000000_init.sql` in the
   Supabase SQL editor for project `hhnmxyyrihrpyerdmgdw`. Saves and dashboard show
   error/empty states until then. Owned by another developer — not this sprint's blocker.
2. **Leaked keys have been rotated** ✅ — Clerk, Supabase, Groq keys rotated on
   2026-06-18. See [Security Notes](#security-notes).

---

## Completed Work

Everything shipped to date, grouped by phase. For the narrative of each session, see
[Session History](#session-history-detailed). For current feature status, see
[Feature Status Matrix](#feature-status-matrix).

### Phase 0–2 — Infrastructure & Foundation (~2026-06-09)

| Task | Notes |
|---|---|
| Security bootstrap | `.gitignore`, `.env.example`, `.nvmrc`; secrets removed from history |
| Next 16 + React 19 + TS strict + Tailwind v3 | App lives in `frontend/` |
| Token-based theming, ESLint 9 flat config | `app/tokens.css`, `globals.css` |
| Dark Lab / Signal Green design system | Primitives: BigOBadge, VerdictReadout, MetricGauge, ComplexityBadge, ProgressBar, Tag, Input, Switch, Card, Button, Select, theme toggle |
| Google-only Clerk auth + custom auth pages + `proxy.ts` | Signals API: `signIn.sso(...)` |
| Dashboard shell (`app/(app)/layout.tsx`), `PageTitle`, nav items | Route group → shared chrome |
| Git history purge of leaked `.env.local` + force-push | Old SHAs dead — see Security Notes |
| Vercel deployment, auto-deploy from `main` | project `complexity-lab`, team `tirths-projects-de842079`, Root Dir = `frontend` |
| Production verification via Playwright | Consent gate, SSO, auth guards — all confirmed against live URL |

### Functional MVP (2026-06-09)

| Task | Notes |
|---|---|
| `lib/ai` registry + heuristic engine (`engine.ts`) | 7 languages, 18 sample templates, growth math, complexity tier system |
| Analyzer: Monaco editor, results panel, SVG ComplexityTimeline, scanline animation | `@monaco-editor/react` + Dark-Lab themes |
| `POST /api/analyze` | Auth + validation + heuristic/Groq provider dispatch |
| Supabase: migration (RLS), server-only data layer (`lib/db/*`) | `DbResult<T>` returns, user-scoped, graceful degradation; migration ships as a file — apply manually |
| Dashboard on real rows + derived stats (`lib/stats.ts`) | No mock data anywhere |
| Analyses + snippets pages, `ConfirmDeleteButton` | Two-step delete, empty/error/loading states |
| Settings: profile form, account, danger zone | Display name, preferred language, sign-out, delete-all-data |
| `(app)/error.tsx` + loading skeletons | |
| Initial test suite | Vitest + Testing Library; engine-vs-samples, API auth, route matcher |
| Bug hunt | Invalid engine regex, stale types, React 19 ref violation, vitest/vite type clash |

### Hardening + Deployment (2026-06-09, second pass)

| Task | Notes |
|---|---|
| Groq provider (`lib/ai/providers/groq.ts`) | Strict-JSON completion, 20s timeout, auto-fallback to heuristic (logged as `groq.fallback`) |
| Rate limiting (`lib/rate-limit.ts`, `lib/action-limit.ts`) | analyze 20/min, saves 20/min, deletes 60/min, profile 10/min, wipe-all 3/h; 429 + `Retry-After` |
| Structured logging (`lib/log.ts`) | JSON events → Vercel runtime logs; code content never logged |
| Legal pack | `/privacy`, `/terms`, `ConsentGate` (accept/decline gate; legal pages pre-consent) |

### Detail View + UX Polish (2026-06-10)

| Task | Notes |
|---|---|
| `/analyses/[id]` detail page | `getAnalysis()` (PGRST116 → friendly error), `mapAnalysisDetail`, delete-with-redirect, loading skeleton; list rows link to detail |
| Product doc system | `PRD.md`, `TRD.md`, `APP_FLOW.md` + `OPERATING_MANUAL.md`, `MISSION_CONTROL.md`, `SECOND_BRAIN.md`, `RULES_OF_ENGAGEMENT.md` |
| UX polish sprint P1–P5 | Onboarding (IntroStrip, Ctrl/⌘+Enter, preferred-language default, idle CTA), landing honesty, mobile (responsive editor, drawer focus trap, reduced-motion), toast system, round-trips (open-in-analyzer from analyses/snippets), expandable snippet code |
| Tests: 146 (24 files) | All P1–P5 paths covered |

### Beta Stabilization (2026-06-13–14 · merged to `main` as `5829ac4`)

| Fix / Addition | Date | Notes |
|---|---|---|
| P1: `tierFromNotation()` mis-tiered O(n log n)/O(n²) | 2026-06-13 | Rewritten to mirror `complexityTier()`; unit test added |
| P1: Low-contrast text (WCAG AA) | 2026-06-13 | `--text-muted` → `#8493ac`, `--text-faint` → `#7c8aa3` |
| P1: Analyzer result not announced to screen readers | 2026-06-13 | `role="status"` + `aria-live="polite"` + `role="alert"` in `ResultsPanel` |
| P1: DB errors exposed internal text | 2026-06-13 | `dbError()` logs raw text server-side only; friendly copy everywhere |
| P1: Analyzer route missing `loading.tsx` | 2026-06-13 | Skeleton added matching workbench layout |
| QA doc system | 2026-06-13 | `testing.md`, `TESTING_READINESS_REPORT.md`, `UX_PRE_BETA_REVIEW.md`, `TEST_PLAN.md` |
| Ownership-scoping tests — SEC-02/03 (10 tests) | 2026-06-14 | `db-ownership.test.ts`; all `lib/db/*` assert `profile_id` filter; cross-account IDOR simulated |
| Delete + Settings Server Action tests (22 tests) | 2026-06-14 | `delete-actions.test.ts`, `settings-actions.test.ts` |
| EDG-01 boundary + SEC-04 log-content tests (2 tests) | 2026-06-14 | `analyze-route.test.ts` |
| AUTH-04 regression — `GoogleAuthButton` (7 tests) | 2026-06-14 | Spinner reset, `longMessage` → `message` → fallback priority |
| `ConfirmDeleteButton` tests (9 tests) | 2026-06-14 | Arm/disarm (3s + blur), pending, toast-on-failure |
| `AnalyzerWorkbench` tests (8 tests) | 2026-06-14 | Real timers — fake timers deadlock React scheduler in jsdom |
| **Total: 211 tests / 30 files — all gates green** | 2026-06-14 | |
| ⚠️ JSX regression in `analyzer-workbench.tsx` | introduced by `b477d43` | Merge artifact — one missing `</div>` (see H1 in Active Work) |

### Phase 2 F1 — Save Flow (2026-06-16 · branch `feature/next-sprint-v1`)

Spec: `docs/phase2/01-save-flow.md`. Replaces silent auto-title save with an explicit
modal requiring a confirmed title before persisting.

| File | Change | Notes |
|---|---|---|
| `lib/analysis/derive-title.ts` | **NEW** | `deriveTitle` extracted from `actions.ts` to a pure client-safe module |
| `components/ui/dialog.tsx` | **NEW** | Accessible Dialog primitive: `role="dialog"`, `aria-modal`, focus trap, Escape, backdrop, portal, focus return; animation removed to comply with `react-hooks/set-state-in-effect` |
| `components/analyzer/save-dialog.tsx` | **NEW** | Title + optional tags form; `onSave` callback; `role="alert"` on failure; pending state; key-based remount for form reset |
| `components/analyzer/save-actions.tsx` | **REWRITTEN** | Opens SaveDialog on click; `analysisSavedId`/`snippetSaved` state + View links; `useToastSafe()` toasts; `mountedRef` guard |
| `app/(app)/analyzer/actions.ts` | **MODIFIED** | `title: string` added to both actions; empty/whitespace-only title rejected before DB call |
| `tests/integration/save-actions.test.ts` | **MODIFIED** | Updated for `title` param; 3 new rejection tests |
| `tests/components/dialog.test.tsx` | **NEW** | 11 tests: a11y, focus, keyboard (Tab, Shift+Tab, Escape), backdrop, X button |
| `tests/components/save-dialog.test.tsx` | **NEW** | 12 tests: form validation, tags parsing, error/success paths, pending state |

### Phase 2 F4 — AI Chat Backend (2026-06-18 · branch `feature/next-sprint-v1`)

Spec: `docs/phase2/04-chat.md` (or see `PHASE2_PLAN.md`). Backend-only (frontend UI owned by separate developer).
Context-aware streaming AI chat: SSE route, `ChatProvider` registry, prompt builders, DB layer, quota/rate-limiting.

**Ownership split:** This session (AI Platform & Backend) owns everything below.
The other developer owns: `/chat/page.tsx`, `components/chat/`.

| File | Change | Notes |
|---|---|---|
| `supabase/migrations/20260616000300_chat.sql` | **NEW** | `chat_conversations` + `chat_messages` + `ai_usage` tables; `bump_ai_usage` atomic upsert RPC; `context_metadata jsonb`; RLS deny-by-default. **Manual apply required.** |
| `lib/ai/groq-client.ts` | **EXTENDED** | Added `groqStream()` async generator, `GroqStreamOptions` with `onUsage` callback, `stream_options.include_usage:true` for real token counts. |
| `lib/ai/chat-provider.ts` | **NEW** | `ChatProvider` interface + `ChatStreamOpts`; separate from `AnalysisProvider` (ISP). |
| `lib/ai/providers/groq-chat.ts` | **NEW** | Groq streaming chat. Throws on missing key — no heuristic fallback for chat. |
| `lib/ai/providers/mock-chat.ts` | **NEW** | Deterministic test mock; fires `onUsage` after yield to exercise usage-bump path. |
| `lib/ai/chat.ts` | **NEW** | Provider registry; `getChatProvider()`; `CHAT_PROVIDER` env; `(id ?? env) \|\| default` (empty-string-safe). |
| `lib/ai/prompts/chat.ts` | **NEW** | `chatSystemPrompt()` (tutor persona, anchored analysis context, 2000-char code truncation, untrusted-data instruction); `buildChatMessages()` (history windowing). |
| `lib/db/chat.ts` | **NEW** | Server-only data layer: `createConversation`, `getConversation`, `listMessages`, `appendMessage`, `getUsageToday`, `bumpUsage`. All accept explicit `profileId` (resolved once at route entry, not per-call). |
| `lib/limits.ts` | **MODIFIED** | +`MAX_CHAT_MESSAGE_LENGTH=4000`, `CHAT_HISTORY_LIMIT=12`, `CHAT_RATE_LIMIT={20/min}`, `CHAT_DAILY_QUOTA=50` |
| `types/index.ts` | **MODIFIED** | Added `Conversation`, `Message`, `AiUsageToday` interfaces |
| `lib/db/mappers.ts` | **MODIFIED** | Added `ConversationRow`, `MessageRow`, `mapConversation`, `mapMessage` |
| `app/api/chat/route.ts` | **NEW** | `POST /api/chat`, `maxDuration=30`. Pipeline: auth→parse/validate→getOrCreateProfile(once)→daily-quota(DB, graceful degrade)→burst-rate-limit(20/min)→get/create conversation→listMessages+buildChatMessages→appendMessage(user, PRE-STREAM)→ReadableStream SSE→`finally`: appendMessage(assistant)+bumpUsage(1 turn). Privacy: message content never in `logEvent`. |
| `proxy.ts` | **MODIFIED** | `/chat(.*)` added to `PROTECTED_ROUTES` |
| `components/layout/nav.ts` | **MODIFIED** | Chat nav item (MessageSquare icon, `ready: false`) |
| `tests/unit/chat-prompts.test.ts` | **NEW** | 13 tests: base prompt content, anchored context, code truncation, untrusted-data instruction, `buildChatMessages` ordering + windowing |
| `tests/unit/chat-registry.test.ts` | **NEW** | 6 tests: mock env, groq env, defaults (groq/mock), unknown throws, explicit override |
| `tests/integration/chat-route.test.ts` | **NEW** | 18 tests: 401 unauth, 400 validation (3), 429 daily quota, 429 burst, 404 not found, graceful degrade on quota failure, new/existing conversation, pre-stream persist, finally persist + bumpUsage, SSE streaming text+done, stream error, privacy, contextRef forwarding, empty-stream bumpUsage |
| **Health check** | ✅ Green | 41 files / 379 tests · typecheck ✅ · lint ✅ · build ✅ (17 routes) |

**Technical debt (F4):**
- `supabase/migrations/20260616000300_chat.sql` must be applied to `hhnmxyyrihrpyerdmgdw` (tracked as B7)
- `CHAT_MODEL` env var should be added to Vercel env vars (optional; defaults to `llama-3.3-70b-versatile`)
- Frontend needs `useChatStream` hook to consume SSE: iterate `ReadableStream`, decode `data:` lines, accumulate `{"text":...}` chunks, detect `{"done":true,"conversationId":...}` sentinel, handle `{"error":...}`

**F4 Chat API contract (for frontend developer):**
- Endpoint: `POST /api/chat`
- Request: `{ message: string, conversationId?: string, contextRef?: { type: string, refId: string } }`
- Response: `text/event-stream` SSE — `data: {"text":"..."}` (delta) → `data: {"done":true,"conversationId":"..."}` (sentinel) → `data: {"error":"..."}` (on failure)
- Auth: Clerk session required (401 if signed out)
- Limits: 4000-char messages, 50 messages/day, 20 messages/minute

### Phase 2 F3 — Code Execution Backend (2026-06-18 · branch `feature/next-sprint-v1`)

Spec: `docs/phase2/03-compiler.md`. Backend-only (frontend UI owned by separate developer).
Establishes the proxy+quota pattern that F4 (Chat) will reuse.

**Ownership split:** This session (AI Platform & Backend) owns everything below.
The other developer owns: `/playground/page.tsx`, `components/playground/`.

| File | Change | Notes |
|---|---|---|
| `supabase/migrations/20260616000200_executions.sql` | **NEW** | `code_executions` table (metadata only); `(profile_id, created_at desc)` index; RLS deny-by-default. **Manual apply required.** |
| `lib/execute/types.ts` | **NEW** | `ExecutionStatus` union + `ExecutionResult` interface |
| `lib/execute/languages.ts` | **NEW** | `JUDGE0_LANGUAGES` (7 langs → IDs) + `isExecutable()`. Verify IDs against live endpoint. |
| `lib/execute/judge0.ts` | **NEW** | `buildJudge0Request`, `normalizeResult`, `callJudge0`. Pure functions directly unit-testable. RESOURCE_LIMITS: cpu=5s, wall=8s, mem=128MB, stack=64MB. |
| `lib/db/executions.ts` | **NEW** | Server-only: `countExecutionsToday` (UTC quota, graceful on DB failure) + `recordExecution` (metadata only — no code/stdout/stdin) |
| `lib/limits.ts` | **MODIFIED** | +`MAX_EXEC_CODE_LENGTH=20000`, `MAX_EXEC_STDIN_LENGTH=4000`, `EXECUTE_RATE_LIMIT={10/min}`, `EXECUTE_DAILY_QUOTA=100` |
| `app/api/execute/route.ts` | **NEW** | `POST /api/execute`, `maxDuration=15`. Pipeline: auth→rate-limit(10/min)→quota(DB, graceful degrade)→validate→AbortController(12s)+Judge0→best-effort record. Privacy: code/stdin/stdout never logged or persisted. |
| `proxy.ts` | **MODIFIED** | `/playground(.*)` added to `PROTECTED_ROUTES` |
| `components/layout/nav.ts` | **MODIFIED** | Playground nav item (Terminal icon, `ready: false`) |
| `.env.example` | **MODIFIED** | `JUDGE0_API_KEY` + `JUDGE0_API_HOST` with server-only warning |
| `tests/unit/judge0-normalize.test.ts` | **NEW** | 25 tests: status mapping, base64 decode, 64KB truncation, timing/memory, buildJudge0Request, isExecutable |
| `tests/integration/execute-route.test.ts` | **NEW** | 17 tests: 401 unauth, 429 rate-limit, 429 quota, graceful quota-fail, 400/413 validation, 200 happy path, 200 compile error, 200 Judge0 unreachable, recordExecution-fail non-blocking, SEC metadata-only, SEC never logs code/stdout |
| **Health check** | ✅ Green | 38 files / 341 tests · typecheck ✅ · lint ✅ |

**Technical debt (F3):**
- Judge0 language IDs must be verified against live `/languages` endpoint before first deploy — RapidAPI may renumber IDs
- `wait=true` synchronous mode must be confirmed available on the RapidAPI free tier before deploy; polling fallback not implemented
- `JUDGE0_API_KEY` + `JUDGE0_API_HOST` must be added to Vercel env vars before frontend merge
- `supabase/migrations/20260616000200_executions.sql` must be applied to `hhnmxyyrihrpyerdmgdw` (tracked as B6)

### Phase 2 F2 — Progress System (2026-06-18 · branch `feature/next-sprint-v1`)

Spec: `docs/phase2/02-progress.md`. XP, levels, streaks, achievements — event-driven,
atomic, server-authoritative. Dashboard widgets: LevelCard, StreakCard, AchievementGrid,
ActivityChart. Best-effort award on save (never fails the save action).

| File | Change | Notes |
|---|---|---|
| `supabase/migrations/20260616000100_progress.sql` | **NEW** | `user_progress` + `xp_events` tables; `level_from_xp` + `apply_progress_event` SQL functions; RLS deny-by-default |
| `lib/progress/levels.ts` | **NEW** | Pure `xpForLevel` / `levelFromXp` / `progressToNextLevel` (no server-only) |
| `lib/progress/achievements.ts` | **NEW** | Static `ACHIEVEMENTS` catalog (5 entries) |
| `lib/db/progress.ts` | **NEW** | Server-only data layer: getProgress, awardProgress, listXpHistory, listUnlockedAchievements, getProgressStats; degrades gracefully when tables absent |
| `lib/progress/evaluate.ts` | **NEW** | Achievement predicate evaluation (server-only) |
| `lib/progress/award.ts` | **NEW** | `awardProgressForSave` orchestrator; best-effort, never throws |
| `app/(app)/analyzer/actions.ts` | **MODIFIED** | `saveAnalysisAction` calls `awardProgressForSave` (best-effort, catch-logged) |
| `components/progress/level-card.tsx` | **NEW** | Level + XP bar + "X XP to Lvl N+1" widget |
| `components/progress/streak-card.tsx` | **NEW** | Current/longest streak widget |
| `components/progress/achievement-grid.tsx` | **NEW** | Locked/unlocked achievement tiles |
| `components/progress/activity-chart.tsx` | **NEW** | 30-day XP activity chart (inline SVG) |
| `app/(app)/dashboard/page.tsx` | **MODIFIED** | Fetches progress in parallel; renders new widgets; graceful empty state |
| `types/index.ts` | **MODIFIED** | Added `ProgressState`, `DailyXp`, `ProgressStats`, `UnlockedAchievement` |
| `tests/unit/levels.test.ts` | **NEW** | 20 tests: xpForLevel, levelFromXp (inverse, monotonic), progressToNextLevel |
| `tests/unit/achievements.test.ts` | **NEW** | 17 tests: predicate boundaries, idempotency, DB-failure graceful handling |
| `tests/unit/progress-award.test.ts` | **NEW** | 6 tests: best-effort award, error logging, achievement chaining |
| `tests/components/progress-widgets.test.tsx` | **NEW** | 17 tests: all 4 widgets (data + empty states) |
| **Health check** | ✅ Green | 36 files / 299 tests · typecheck ✅ · lint ✅ · build ✅ (16 routes) |

**Important:** `20260616000100_progress.sql` must be applied to Supabase **after** the
base init migration (B1). Until then, progress widgets show empty states and award
calls silently no-op — no errors surface to users.

---

## Active Work & Open Items

### Immediate Code Fixes

All H1–H3 items resolved 2026-06-17. Phase 2 F2 + F3 + F4 Backend completed 2026-06-18. Branch `feature/next-sprint-v1` health check **green**: 41 files / 379 tests.

| # | Item | Priority | Status |
|---|---|---|---|
| H1 | **Fix JSX parse error in `analyzer-workbench.tsx`** | P1 | ✅ Done |
| H2 | **Re-run health check** | P1 | ✅ Done — 41 files / 379 tests |
| H3 | **Fix `results-panel.test.tsx`** | P2 | ✅ Done |
| F2 | **Phase 2 F2 — Progress System** | Feature | ✅ Done (2026-06-18) |
| F3 | **Phase 2 F3 — Code Execution Backend** | Feature | ✅ Done (2026-06-18) |
| F4 | **Phase 2 F4 — AI Chat Backend** | Feature | ✅ Done (2026-06-18) |

### Beta Blockers

| # | Issue | Owner | Status |
|---|---|---|---|
| B1 | **DB migrations unapplied** — `_init.sql`, `_progress.sql`, `_executions.sql` not applied to project `hhnmxyyrihrpyerdmgdw`. Apply in order. Saves/dashboard/quota tracking broken until applied. | Ext. developer | 🔵 External — not this sprint |
| B2 | **Leaked secrets** — Clerk, Supabase (incl. service-role), Groq | User | ✅ Done (2026-06-18) |
| B4 | **AUTH-03/04 manual QA** — Google SSO completes + error resets spinner | QA | ⬜ Pending |
| B5 | **SEC-02/03 manual QA** — cross-account ownership test (two Google accounts) | QA | ⬜ Pending |
| B6 | **F3 migration unapplied** — `20260616000200_executions.sql` not applied; quota tracking silently no-ops (graceful degrade) | Manual | ⬜ Pending — apply after B1 |

### Phase 2 Remaining Features

Full specs in `PHASE2_PLAN.md` and `docs/phase2/02-05-*.md`. These are post-beta.

| Feature | Size | Status | Owner |
|---|---|---|---|
| F2 — Progress (XP, levels, streaks, achievements) | M | ✅ Done (2026-06-18) | Backend |
| F3 — Compiler Backend | M | ✅ Done (2026-06-18) | Backend |
| F3 — Compiler Frontend (`/playground` UI) | M | ⬜ Not started | **Frontend developer** |
| F4 — Chat Backend | L | ✅ Done (2026-06-18) | Backend |
| F4 — Chat Frontend (`/chat` UI) | L | ⬜ Not started | **Frontend developer** |
| F5 — Community (share, feed, likes, comments, moderation) | XL | ⬜ Not started | Both |

### Recommended Before Public Launch

- Provision a **production Clerk instance** (replace `pk_test` / accounts.dev)
- Add **CI gate** (GitHub Actions: typecheck + lint + test + build)

---

## Feature Status Matrix

Single source of truth for all feature status. Completed features are detailed in
[Completed Work](#completed-work); remaining features in [Active Work](#active-work--open-items).

| Feature | Status | Notes |
|---|---|---|
| Foundation / auth / shell | ✅ Done | Next 16 · React 19 · Clerk v7 Google-only · protected `(app)` shell |
| Dark Lab design system | ✅ Done | Tokens + primitives — **source of truth, do not redesign** |
| Landing page | ✅ Done | Hero, 3D readout, features, gradient band |
| Analyzer (Monaco + heuristic engine + results panel) | ✅ Done | 7 languages, 18 samples, SVG timeline, scanline animation |
| AI layer (Groq + heuristic fallback) | ✅ Done | `lib/ai` registry; `AI_PROVIDER=groq` live; auto-fallback on any failure |
| Database layer | ✅ code · ⚠️ ops | Schema + RLS + server-only `lib/db/*`; **migration not yet applied to prod** |
| App flows (analyses, snippets, settings, save/delete) | ✅ Done | Empty/error/loading states; no mock data |
| `/analyses/[id]` detail view | ✅ Done | Stored code + result JSONB; delete-with-redirect |
| Rate limiting + structured logging | ✅ Done | Per-user sliding-window; JSON logs; code never logged |
| Legal pack | ✅ Done | `/privacy`, `/terms`, forced consent gate |
| UX polish (P1–P5) | ✅ Done | Onboarding, mobile, toasts, round-trips |
| Beta stabilization | ✅ Done | 5 P1 fixes, QA docs, 211 tests — `main` at `5829ac4` |
| Deployment (Vercel, auto-deploy from `main`) | ✅ Done | complexity-lab-eight.vercel.app · Root Dir = `frontend` |
| **Phase 2 F1 — Save Flow (Dialog + SaveDialog)** | ✅ Done | On `feature/next-sprint-v1`; all health gates green |
| **Phase 2 F2 — Progress (XP · levels · streaks · achievements)** | ✅ Done | On `feature/next-sprint-v1`; 379 tests green; DB migration pending B1 |
| **Phase 2 F3 — Compiler (Backend)** | ✅ Done (backend) | `POST /api/execute`, Judge0 client, quota, 42 tests — 2026-06-18. Frontend UI pending (other developer). |
| Phase 2 F3 — Compiler (Frontend/UI) | ⬜ Not started (other dev) | `/playground/page.tsx` + `components/playground/`. API contract: `POST /api/execute` → `{ result: ExecutionResult }`. |
| **Phase 2 F4 — Chat (Backend)** | ✅ Done (backend) | `POST /api/chat`, ChatProvider, prompts, DB layer, quota, 38 tests — 2026-06-18. Frontend UI pending (other developer). |
| Phase 2 F4 — Chat (Frontend/UI) | ⬜ Not started (other dev) | `/chat/page.tsx` + `components/chat/`. API contract: `POST /api/chat` → SSE stream. DB migration B7 required. |
| Phase 2 F5 — Community | ⬜ Not started | `docs/phase2/05-community.md` |
| Lessons / quizzes / progress persistence | 🔮 Future | Not started — see `ROADMAP.md` |

---

## Architecture (summary)

Full detail in `ARCHITECTURE.md`.

- **Routes:** public `/`, `/sign-in`, `/sign-up`, `/sso-callback`; protected `(app)`
  group → `/dashboard`, `/analyzer`, `/analyses`, `/snippets`, `/settings/*`;
  `POST /api/analyze` guards itself with a 401. Protection lives in `proxy.ts`
  (`PROTECTED_ROUTES` exported for tests).
- **Analyzer pipeline:** client workbench → `POST /api/analyze` →
  `getAnalysisProvider()` → heuristic engine → `CodeAnalysis` contract → results panel
  → save server actions (now with `SaveDialog`).
- **Data layer:** `lib/db/*` is server-only (service-role key, `server-only` package
  guard). Every function resolves the Clerk user and returns `DbResult<T>` (never
  throws to pages). RLS is deny-by-default.
- **Tables:** `profiles`, `analyses` (incl. full result JSONB), `saved_snippets`
  (tags[]). Cascade deletes; `(profile_id, created_at desc)` indexes.
- **Testing:** `tests/{unit,components,integration}` — engine vs every sample template;
  route auth; protected-route matcher; save actions; ownership scoping; mappers; stats.

---

## Security Notes

### Standing rules
- `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`, `GROQ_API_KEY` — **server-only**.
  `lib/db/admin.ts` imports `server-only`; a client import fails the build.
- `.env.local` is git-ignored. Never commit it.

### History purge (done 2026-06-09)
The leaked `.env.local` was removed from every commit via `git filter-branch` (+
reflog expire + gc) and force-pushed to GitHub. Old SHAs (`0416f99`, `0c7a42a`,
`d6daf5e`, `4d2e397`) were rewritten; current history starts at `9eb130a`. Verified:
no `.env.local` in any reachable commit.

### ✅ Keys rotated (2026-06-18)
All keys (Clerk, Supabase service-role, Groq) were rotated on 2026-06-18. The
`frontend/.env.local` and Vercel env vars were updated. No outstanding rotation needed.

### ⚠️ Outstanding (action required)
- **Upgrade Clerk.** Current instance is a dev instance (`pk_test`, accounts.dev).
  Create a production instance (custom domain) before public launch.

---

## Session History (detailed)

Narrative log of every working session. For a structured phase summary, see
[Completed Work](#completed-work).

### Phase 0–2 — Foundation (earlier sessions, ~2026-06-09)
- **Phase 0 — Security:** untracked committed secrets; added `.gitignore` /
  `.env.example` / `.nvmrc`, corrected docs.
- **Phase 1 — Foundation:** hand-built Next 16 + React 19 + TS strict + Tailwind v3
  in `frontend/`; token-based theming; ESLint 9 flat config.
- **Phase 2 — Auth + shell:** Google-only Clerk (signals API), custom auth pages,
  `proxy.ts`, dashboard shell + five readouts (mock data at this point).
- **Design pass:** Dark Lab / Signal Green tokens, complexity gradient + tier system
  (`lib/complexity.ts`), DS primitives, real landing page, mobile drawer.

### Functional MVP (2026-06-09)
1. Route restructure to `app/(app)/layout.tsx` (route group → shared chrome, clean URLs).
2. AI architecture: `lib/ai` types/interface/registry; heuristic engine as mock
   provider; growth math; language registry; 18 sample templates across 7 languages.
3. Analyzer MVP: Monaco with Dark-Lab themes, `Select` primitive, results panel, SVG
   `ComplexityTimeline`, scanline sweep animation, `POST /api/analyze`.
4. Supabase: migration + RLS + server-only data layer. *Apply migration manually.*
5. Flows: dashboard on real rows, stats, analyses + snippets pages, settings, save
   actions, `(app)/error.tsx`, loading skeletons, deleted all mock data.
6. Tests: Vitest + Testing Library; engine-vs-samples, API auth, route matcher.
7. Bug hunt: invalid engine regex, stale `.next` types, React 19 ref violation,
   vitest/vite type clash. Smoke test: all routes return correct status codes.

### Hardening + Deployment (2026-06-09, second pass)
1. Groq provider: strict-JSON chat completion, 20s timeout, auto-fallback.
2. Rate limiting: per-user sliding-window on all routes + server actions; 429 + `Retry-After`.
3. Structured logging: JSON events → Vercel runtime logs; code never logged.
4. Legal pack: `/privacy`, `/terms`, site-wide `ConsentGate`, landing footer links.
5. Git history purge of leaked `.env.local` + force-push to GitHub.
6. Deployed + verified in production (Playwright smoke against live URL). Fixed
   `auth.protect()` to redirect to branded `/sign-in` (was bouncing to accounts.dev).
7. Findings: Vercel CLI token on disk is dead (403); claude.ai Supabase MCP is connected
   to the wrong account — migrations are manual.

### Detail View + Product Docs (2026-06-10)
1. `/analyses/[id]` detail page: `getAnalysis()` (PGRST116 → friendly "not found"),
   `AnalysisDetail` type + `mapAnalysisDetail`, `deleteAnalysisAndRedirectAction`,
   loading skeleton; list rows link to detail. Tests 131 → **133**.
2. Product doc system: `PRD.md`, `TRD.md`, `APP_FLOW.md` + four memory files
   (`OPERATING_MANUAL.md`, `MISSION_CONTROL.md`, `SECOND_BRAIN.md`,
   `RULES_OF_ENGAGEMENT.md`); drift fixes across all docs.
3. UX polish sprint (P1–P5): analyzer onboarding (IntroStrip, Ctrl/⌘+Enter,
   preferred-language default, idle CTA) · honest landing + how-it-works · mobile
   (responsive editor height, drawer focus trap, tap targets, reduced-motion) · feedback
   (toast system, delete failures surfaced, `CopyButton`) · round-trips (open-in-analyzer
   from analyses/snippets, expandable snippet code). Tests 133 → **146** (24 files).

### Beta Stabilization (2026-06-13–14 · merged to `main` as `5829ac4`)
1. Five P1 bugs fixed: `tierFromNotation()` mis-tiering, low-contrast text (WCAG AA),
   analyzer result not announced to AT, DB errors exposing internal text, missing
   `loading.tsx` on analyzer route.
2. QA doc system: `testing.md`, `TESTING_READINESS_REPORT.md`, `UX_PRE_BETA_REVIEW.md`,
   `TEST_PLAN.md`.
3. Ownership-scoping tests (10): `db-ownership.test.ts` — all `lib/db/*` functions
   assert `profile_id` filter; cross-account IDOR read/delete simulated. 153 → **163**.
4. Delete + Settings Server Action tests (22): `delete-actions.test.ts`,
   `settings-actions.test.ts`. 163 → **185**.
5. EDG-01 boundary + SEC-04 log-content tests (2): `analyze-route.test.ts`. 185 → **187**.
6. AUTH-04 regression — `GoogleAuthButton` tests (7). 187 → **194**.
7. `ConfirmDeleteButton` tests (9): arm/disarm (3s + blur), pending, toast-on-failure,
   generic fallback. 194 → **203**.
8. `AnalyzerWorkbench` tests (8): real timers required — fake timers deadlock React's
   scheduler in jsdom. 203 → **211**.
9. ⚠️ Merge commit `b477d43` introduced a JSX parse error in `analyzer-workbench.tsx`:
   one missing `</div>` for the toolbar div. Present in `main` as of `5829ac4`.
   Fix documented in H1 (Active Work).

### Phase 2 F1 — Save Flow (2026-06-16 · branch `feature/next-sprint-v1`)

Spec: `docs/phase2/01-save-flow.md`. Replaces silent auto-title save with an explicit
`SaveDialog` modal requiring a confirmed title.

- Created `lib/analysis/derive-title.ts`: `deriveTitle` extracted from server-only
  `actions.ts` to a pure client-safe module (importing `"use server"` modules in client
  components would bundle the service-role key).
- Created `components/ui/dialog.tsx`: accessible Dialog primitive with portal to
  `document.body`, focus trap (Tab/Shift+Tab cycle), Escape key, backdrop click, focus
  return to trigger. Animation removed (violated `react-hooks/set-state-in-effect`).
  Key-based remount (`key` prop in parent) handles form state reset without a `useEffect`.
- Created `components/analyzer/save-dialog.tsx`: title + optional tags form composing
  Dialog; `onSave` callback returns `{ok, error?}`; inline `role="alert"` on failure;
  pending disables both buttons.
- Rewrote `components/analyzer/save-actions.tsx`: Save buttons open SaveDialog; saved
  state (`analysisSavedId`, `snippetSaved`) disables buttons and shows View links;
  `useToastSafe()` for success; `mountedRef` guards post-await setState.
- Modified `app/(app)/analyzer/actions.ts`: `title: string` added to both actions;
  empty/whitespace-only title rejected with `"A title is required."`.
- Tests: `dialog.test.tsx` (11), `save-dialog.test.tsx` (12), plus 3 new rejection
  tests in `save-actions.test.ts`.
- Health check blocked by pre-existing JSX error (H1). Fix H1, then re-run all gates.

---

## Environment Variables

Templated in `frontend/.env.example` (never commit real values):

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=…   # client-safe
CLERK_SECRET_KEY=…                    # SERVER-ONLY
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…       # RLS-guarded (deny-by-default)
SUPABASE_SERVICE_ROLE_KEY=…           # SERVER-ONLY — bypasses RLS
AI_PROVIDER=mock                      # mock | groq | openai | anthropic | gemini
GROQ_API_KEY=…                        # SERVER-ONLY
GROQ_MODEL=llama-3.3-70b-versatile
JUDGE0_API_KEY=…                      # SERVER-ONLY — RapidAPI key for Judge0 CE (F3)
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com  # default; override for self-hosted
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Vercel note:** `JUDGE0_API_KEY` and `JUDGE0_API_HOST` must be added to Vercel
environment variables before the F3 frontend is merged and deployed.

Set these as **Vercel environment variables** in production; Root Directory = `frontend`.

---

## Development Rules

1. **Inspect before coding** — this file, `ARCHITECTURE.md`, `CLAUDE.md`, relevant code.
2. **The design system is the source of truth** — reuse `components/ui` primitives and
   tokens; never hardcode colors; do not redesign.
3. **Server Components by default;** client islands only for interactivity.
4. **DB access only via `lib/db/*`** — server-only, Clerk-scoped, `DbResult` returns.
5. **Keep Vercel/Clerk/Supabase compatibility;** no new deps without strong justification.
6. **Verify before declaring done:**
   `npm run typecheck && npm run lint && npm run build && npm run test`.
7. **Never commit secrets.** Don't push unless asked — pushing `main` deploys production.

---

## Quick Start For New Sessions

- **Stack:** Next.js 16 (App Router) · React 19 · TS strict · Tailwind v3 · Clerk
  (Google-only, dev instance) · Supabase · Groq (live, heuristic fallback) · Vitest.
  App lives in **`frontend/`**.
- **State:** Live at https://complexity-lab-eight.vercel.app. `main` = commit `5829ac4`,
  211 tests green. **Active branch: `feature/next-sprint-v1`** (Phase 2 F1 + F2 + F3 backend done;
  **341/341 tests green**, typecheck ✅, lint ✅).
- **Run:** `cd frontend && npm install && npm run dev` → http://localhost:3000.
  Verify: `npm run typecheck && npm run lint && npm run build && npm run test`.
- **Ownership split:** Backend (AI Platform) = this AI session. Frontend/UX = separate developer.
- **Next task (Backend):** Start Phase 2 F5 (Community) or further improvements — F4 backend is complete.
- **Next task (Frontend dev):** Implement `/playground/page.tsx` (uses `POST /api/execute`) + `/chat/page.tsx` (uses `POST /api/chat` SSE). See F3/F4 API contracts in Active Work section above.
- **DB blocker:** migration `supabase/migrations/20260609000000_init.sql` not applied
  to project `hhnmxyyrihrpyerdmgdw` — saves/dashboard error until applied. Google SSO
  is already enabled and verified.
- **Security:** all keys rotated ✅ (2026-06-18). Only remaining item: upgrade Clerk
  to a production instance before public launch. See [Security Notes](#security-notes).
- **Tooling gotchas:** Vercel CLI token on disk is dead (403) — `vercel login` needed
  for env-var changes; claude.ai Supabase MCP points to the wrong account — migrations
  are manual.
- **Read next:** `MISSION_CONTROL.md` (sprint state) · `PHASE2_PLAN.md` (Phase 2 specs)
  · `ARCHITECTURE.md` + `TRD.md` (system design) · `SECOND_BRAIN.md` (decisions/debt).

---

## Long-Term Vision

Full backlog — every planned feature, AI roadmap item, technical debt, and future
idea — is documented in **`PROJECT_BACKLOG.md`** at the repo root.

Key sections in that file:

| Section | What it tracks |
|---|---|
| **Current Status** | Branch, health gates, next step |
| **Completed Features** | Everything shipped (MVP → Phase 2 F2) |
| **In Progress** | Active work |
| **Planned Features** | Phase 2 F3 (Compiler), F4 (Chat), F5 (Community) with full specs |
| **Beta Blockers** | B1–B5 with status |
| **AI Roadmap** | LeetCode Intelligence, AI tutor, pattern detection — future only |
| **Nice-to-Have** | Improvements that aren't blocking |
| **Technical Debt** | Known debt, accepted for MVP |
| **Future Ideas** | Platform vision, enterprise, integrations — brain dump |

**`PROJECT_BACKLOG.md` is the single source of truth for what we still want to build.**
Update it alongside `MISSION_CONTROL.md` at the start of each working session.

*End of handoff.*
