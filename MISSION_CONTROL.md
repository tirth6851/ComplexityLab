# ComplexityLab — Mission Control

> **Project memory · volatile layer.** Current sprint, tasks, blockers.
> **Read this first each session.** Update it every working session.
> Last updated: **2026-06-18**

---

## Current sprint: Phase 2 — F4 AI Chat Backend (complete, awaiting frontend)

**Active branch:** `feature/next-sprint-v1` — all health gates green.
**Gate status:** `typecheck ✅ · lint ✅ · build ✅ (17 routes) · test 41 files / 379 tests ✅`

**Ownership split (active):** Backend (AI Platform) = this AI session. Frontend/UX = separate developer.

**Now:** Phase 2 F4 backend complete. Backend next = F5 (Community) or other backlog items. Frontend developer next = `/playground` UI (F3) and `/chat` UI (F4).

**F3 API contract (for frontend developer):**
- Endpoint: `POST /api/execute`
- Request: `{ code: string, language: string, stdin?: string }`  
- Response: `{ result: ExecutionResult }` — type in `lib/execute/types.ts`
- Languages: `python | javascript | typescript | java | go | rust | cpp`
- Auth: Clerk session required (401 if signed out)

### Shipped (2026-06-13, beta-prep-audit branch — NOT YET MERGED TO MAIN)

The `beta-prep-audit` branch is 4 commits ahead of `main`. All gates green.
**Must be merged before QA begins on production.**

- **P1 fix — `tierFromNotation()` mis-tiered O(n log n) / O(n²)** (`lib/complexity.ts`)
  — rewritten to mirror `complexityTier()` for every Big-O class; unit test added.
- **P1 fix — Low-contrast text** — `--text-muted` → `#8493ac`, `--text-faint` →
  `#7c8aa3`; both clear WCAG AA on dark surfaces (`app/globals.css`).
- **P1 fix — Analyzer result/error not announced to screen readers** —
  `role="status"` + `aria-live="polite"` + `role="alert"` live regions added to
  `ResultsPanel`; covered by new tests.
- **P1 fix — DB errors exposed internal text to users** — `dbError()` now logs
  raw provider text server-side only; all error-state pages updated to friendly copy.
- **P1 fix — Analyzer route had no `loading.tsx`** — added skeleton mirroring
  the workbench layout.
- **QA doc system:** `testing.md` (hub), `TESTING_READINESS_REPORT.md` (risk +
  blockers), `UX_PRE_BETA_REVIEW.md` (per-page UX audit), `TEST_PLAN.md`
  (manual QA checklist).

### Shipped (2026-06-14, beta-prep-audit branch)

- **P1 gap — No ownership-scoping tests** (`tests/integration/db-ownership.test.ts`)
  — 10 new tests covering SEC-02/03: all `lib/db/analyses` + `lib/db/snippets`
  functions assert `profile_id` filter is always applied; cross-account IDOR
  read/delete simulated via PGRST116; insert payload verified to use resolved
  profile id, not a caller-supplied value. Tests: 153 → **163**.
- **P1 gap — Delete/settings Server Actions untested**
  (`tests/integration/delete-actions.test.ts`, `tests/integration/settings-actions.test.ts`)
  — 22 new tests covering `deleteAnalysisAction`, `deleteAnalysisAndRedirectAction`,
  `deleteSnippetAction`, `updateProfileAction`, `deleteAllDataAction`. Asserts:
  rate-limit guard fires first, empty id rejected, DB failures surfaced, all
  `revalidatePath` calls and redirect confirmed on success. Tests: 163 → **185**.
- **EDG-01 fix + SEC-04 coverage** (`tests/integration/analyze-route.test.ts`)
  — EDG-01: boundary test for exactly 100,000-char payload (uses realistic
  multi-line code to avoid regex scan overhead on a single huge line); SEC-04:
  asserts submitted code content never appears in `console.log` output. Tests:
  185 → **187**.
- **AUTH-04 regression covered** (`tests/components/google-auth-button.test.tsx`)
  — 7 new tests for `GoogleAuthButton`: idle state, loading/disabled during
  SSO flight, `sso()` resolving with `{ error }` (the regression path), throw
  path, error-message priority (`longMessage` → `message` → generic fallback),
  sign-up mode calling `signUp.sso()`. Tests: 187 → **194**.
- **`ConfirmDeleteButton` covered** (`tests/components/confirm-delete-button.test.tsx`)
  — 9 new tests: idle state, arm on click, 3s auto-disarm (fake-timer isolated
  describe + `fireEvent` to avoid user-event timer hang), blur-disarm, pending
  state, toast-on-failure, generic-toast fallback, no-toast-on-success. Tests:
  194 → **203**.
- **`AnalyzerWorkbench` covered** (`tests/components/analyzer-workbench.test.tsx`)
  — 8 new tests: initial sample preload, language-switch preserves buffer, sample
  selection, double-trigger guard (ANL-09), Ctrl/⌘+Enter keyboard shortcut,
  successful analysis result + SaveActions render, HTTP error state, network error
  state. Uses real timers + 2s `waitFor` to clear the 650ms MIN_SCAN_MS floor
  (fake timers deadlock React's scheduler in jsdom). Tests: 203 → **211**.

### Shipped (2026-06-17, feature/next-sprint-v1)

- **H1 — JSX parse error fixed** (`components/analyzer/analyzer-workbench.tsx`) —
  Added missing `</div>` closing the toolbar div (merge artifact from `b477d43`).
- **H3 — ResultsPanel a11y + test alignment** — Added `role="status"` and
  `role="alert"` sr-only live regions to `ResultsPanel` (the P1 a11y fix that was
  missing from the component). Fixed stale text assertions in `results-panel.test.tsx`
  and `analyzer-workbench.test.tsx` to match current component text/layout.
- **Dialog type fix** — `initialFocusRef` widened to `RefObject<HTMLElement | null>`
  for React 19 compatibility (previously failed typecheck).
- **Workbench test assertion hardened** — `analyzer-workbench.test.tsx` now checks
  `MOCK_ANALYSIS.time.notation` ("O(n)") in the done-state tests instead of the static
  "Complexity breakdown" heading; proves analysis data actually reaches the screen.
- **Health check: 32 files / 239 tests green.** All four gates re-verified:
  `typecheck ✅ · lint ✅ · build ✅ (16 routes) · test ✅`.

### Shipped (2026-06-18, feature/next-sprint-v1) — Phase 2 F2: Progress System

- **`lib/progress/levels.ts`** — Pure `xpForLevel` / `levelFromXp` / `progressToNextLevel`
  (no server-only; testable in isolation).
- **`lib/progress/achievements.ts`** — Static `ACHIEVEMENTS` catalog (5 entries).
- **`supabase/migrations/20260616000100_progress.sql`** — `user_progress` + `xp_events`
  tables, `level_from_xp` SQL function, `apply_progress_event` atomic RPC. Mirrors the
  TypeScript formulas exactly.
- **`lib/db/progress.ts`** — Server-only data layer: `getProgress`, `awardProgress`,
  `listXpHistory`, `listUnlockedAchievements`, `getProgressStats`. Degrades gracefully
  (DbResult ok:false) when tables are absent — dashboard never 500s.
- **`lib/progress/evaluate.ts`** — Achievement predicate evaluation (server-only).
- **`lib/progress/award.ts`** — `awardProgressForSave` orchestrator; best-effort,
  never throws, never fails the save.
- **`app/(app)/analyzer/actions.ts`** — `saveAnalysisAction` wires in `awardProgressForSave`
  (best-effort, catch-logged).
- **Dashboard widgets** — `LevelCard`, `StreakCard`, `AchievementGrid`, `ActivityChart`
  (all Server Components, hand-rolled inline SVG, no new deps).
- **`app/(app)/dashboard/page.tsx`** — Fetches progress data in parallel with analyses/
  snippets; renders new widgets (degraded empty state when DB absent).
- **Tests: 36 files / 299 tests.** +60 new tests across 4 files:
  `tests/unit/levels.test.ts` (20), `tests/unit/achievements.test.ts` (17),
  `tests/unit/progress-award.test.ts` (6), `tests/components/progress-widgets.test.tsx` (17).
- **Health check (final): 36 files / 299 tests green.**
  `typecheck ✅ · lint ✅ · build ✅ (16 routes) · test ✅`.
- **Merged upstream UI/typography improvements** (`b527363`) — resolved conflicts in
  `dashboard/page.tsx` and `results-panel.tsx`, fixed auto-merge JSX error in
  `analyzer-workbench.tsx` (extra closing div), installed `framer-motion`, updated
  test assertions to match upstream text changes. Branch pushed to origin.

### Shipped (2026-06-18, feature/next-sprint-v1) — Phase 2 F3: Code Execution Backend

**Ownership note:** Backend built here. Frontend (`/playground/page.tsx`, `components/playground/`) owned by the other developer.

- **`supabase/migrations/20260616000200_executions.sql`** — `code_executions` table with RLS enabled; indexed by `(profile_id, created_at desc)` for quota queries.
- **`lib/execute/types.ts`** — `ExecutionStatus` union + `ExecutionResult` interface (transient API shape, not persisted).
- **`lib/execute/languages.ts`** — `JUDGE0_LANGUAGES` map (7 languages → RapidAPI IDs) + `isExecutable()` guard.
- **`lib/execute/judge0.ts`** — Judge0 HTTP client: `buildJudge0Request` (base64 encode, resource limits), `normalizeResult` (status map, base64 decode, 64 KB truncation), `callJudge0` (POST with `wait=true&base64_encoded=true`, `cache:"no-store"`, AbortSignal).
- **`lib/db/executions.ts`** — Server-only DB layer: `countExecutionsToday` (UTC-midnight window, exact count) + `recordExecution` (metadata only — no code/stdout/stdin).
- **`lib/limits.ts`** — Added `MAX_EXEC_CODE_LENGTH` (20k), `MAX_EXEC_STDIN_LENGTH` (4k), `EXECUTE_RATE_LIMIT` (10/min), `EXECUTE_DAILY_QUOTA` (100).
- **`app/api/execute/route.ts`** — `POST /api/execute` with `maxDuration=15`: auth → 10/min burst limit → 100/day DB quota (graceful degrade on check failure) → validate → AbortController(12s) + Judge0 → record metadata (best-effort) → return result. Privacy: code/stdin/stdout never logged or persisted.
- **`proxy.ts`** — Added `/playground(.*)` to `PROTECTED_ROUTES`.
- **`components/layout/nav.ts`** — Added Playground nav item (Terminal icon, `ready: false`).
- **`.env.example`** — Added `JUDGE0_API_KEY` + `JUDGE0_API_HOST` with server-only warning.
- **Tests: 38 files / 341 tests** (+42 new tests):
  - `tests/unit/judge0-normalize.test.ts` (25): normalizeResult, buildJudge0Request, isExecutable
  - `tests/integration/execute-route.test.ts` (17): auth, validation, rate-limiting, graceful degradation, happy path, error paths, privacy/SEC
- **Health check: 38 files / 341 tests green.** `typecheck ✅ · lint ✅ · test ✅`

**Next (F3):** Frontend developer implements `/playground/page.tsx` + `components/playground/` UI; connects to `POST /api/execute`.

### Shipped (2026-06-18, feature/next-sprint-v1) — Phase 2 F4: AI Chat Backend

**Ownership note:** Backend complete. Chat UI (`/chat/page.tsx`, `components/chat/`) is for the frontend developer. **F4 migration must be applied manually before any chat data can persist.**

- **`supabase/migrations/20260616000300_chat.sql`** — `chat_conversations` + `chat_messages` + `ai_usage` tables, `bump_ai_usage` atomic upsert RPC. `context_metadata jsonb` for RAG extensibility. RLS deny-by-default on all three tables. **Must be applied to `hhnmxyyrihrpyerdmgdw` before B7 can close.**
- **`lib/ai/groq-client.ts`** (extended) — Added `groqStream()` async generator, `GroqStreamOptions` with `onUsage` callback; `stream_options.include_usage:true` for real token counts.
- **`lib/ai/chat-provider.ts`** — `ChatProvider` interface + `ChatStreamOpts`; separate from `AnalysisProvider` (ISP).
- **`lib/ai/providers/groq-chat.ts`** — Groq streaming chat; throws on missing key (no fallback for chat).
- **`lib/ai/providers/mock-chat.ts`** — Deterministic test mock; fires `onUsage` callback for coverage.
- **`lib/ai/chat.ts`** — Provider registry; `getChatProvider()`; env-driven (`CHAT_PROVIDER`); defaults to groq-if-key-else-mock.
- **`lib/ai/prompts/chat.ts`** — `chatSystemPrompt()` (tutor persona, anchored analysis context, 2000-char code truncation, untrusted-data instruction); `buildChatMessages()` (history windowing).
- **`lib/db/chat.ts`** — Server-only chat data layer: `createConversation`, `getConversation`, `listMessages`, `appendMessage`, `getUsageToday`, `bumpUsage`. All functions accept explicit `profileId` (resolved once at route entry).
- **`lib/limits.ts`** — Added: `MAX_CHAT_MESSAGE_LENGTH=4000`, `CHAT_HISTORY_LIMIT=12`, `CHAT_RATE_LIMIT={limit:20,windowMs:60000}`, `CHAT_DAILY_QUOTA=50`.
- **`types/index.ts`** — Added `Conversation`, `Message`, `AiUsageToday` interfaces.
- **`lib/db/mappers.ts`** — Added `ConversationRow`, `MessageRow`, `mapConversation`, `mapMessage`.
- **`app/api/chat/route.ts`** — `POST /api/chat` with `maxDuration=30`. Full pipeline: auth → parse/validate → getOrCreateProfile (once) → daily quota gate (graceful degrade) → burst rate-limit → get/create conversation → listMessages + buildChatMessages → appendMessage(user, PRE-STREAM) → `ReadableStream` SSE → `finally`: appendMessage(assistant) + bumpUsage(1 turn). Privacy: message content never in `logEvent`.
- **`proxy.ts`** — `/chat(.*)` added to `PROTECTED_ROUTES`.
- **`components/layout/nav.ts`** — Chat nav item added (MessageSquare icon, `ready: false`).
- **Tests: 41 files / 379 tests** (+38 new tests across 3 files).
- **Health check: 41 files / 379 tests green.** `typecheck ✅ · lint ✅ · build ✅ (17 routes) · test ✅`

### Previously shipped (on main, 2026-06-10)
- UX polish sprint P1–P5: analyzer onboarding, landing honesty, mobile,
  toast system, round-trips (open-in-analyzer from analyses + snippets).
- `/analyses/[id]` detail view; product doc system.

## Beta blockers (must clear before public beta)

| # | Issue | Owner | Status |
|---|---|---|---|
| B1 | **DB migrations unapplied** — `_init.sql`, `_progress.sql`, `_executions.sql` not applied to project `hhnmxyyrihrpyerdmgdw`; saves/dashboard/quota broken. Apply in order. | Ext. developer | 🔵 External dependency |
| B2 | **Leaked secrets unrotated** | User | ✅ Done (2026-06-18) |
| B3 | **`beta-prep-audit` branch not merged** — 5 code fixes + QA docs + ownership tests undeployed | Code | 🟡 Ready — in `feature/next-sprint-v1`, merge → `main` to deploy |
| B4 | **AUTH-03/04 manual QA** — Google SSO completes + error resets spinner | QA | ⬜ Pending |
| B5 | **SEC-02/03 manual QA** — cross-account ownership (two Google accounts) | QA | ⬜ Pending |
| B6 | **F3 migration unapplied** — `supabase/migrations/20260616000200_executions.sql` not applied; quota tracking silently no-ops (graceful degrade, execution still works) | Manual | ⬜ Pending — apply after B1 |
| B7 | **F4 migration unapplied** — `supabase/migrations/20260616000300_chat.sql` not applied; chat conversations/messages/usage cannot be persisted (graceful degrade — route still works but history is lost) | Manual | ⬜ Pending — apply after B6 |

## Strongly recommended before public launch

- Provision a **production Clerk instance** (replace `pk_test` / accounts.dev)
- Add **CI gate** (GitHub Actions: typecheck + lint + test + build)
- Add **CI gate** (GitHub Actions: typecheck + lint + test + build)

## Quality gates — last verified 2026-06-18 (feature/next-sprint-v1, post-F4 backend)

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors / 0 warnings |
| `npm run build` | ✅ green (17 routes, including `/api/chat`) |
| `npm run test` | ✅ **41 files / 379 tests** |
