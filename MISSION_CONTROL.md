# ComplexityLab — Mission Control

> **Project memory · volatile layer.** Current sprint, tasks, blockers.
> **Read this first each session.** Update it every working session.
> Last updated: **2026-06-23**

---

## Current sprint: Phase 3 — Learning Hub + sample balance shipped · Migration blockers remain

**Active branch:** `feature/phase3-product-enhancements` — PR open, not yet merged.
**Gate status:** `typecheck ✅ · lint ✅ · build ✅ (24 routes) · test 48 files / 476 tests ✅`

**PR:** https://github.com/tirth6851/ComplexityLab/pull/new/feature/phase3-product-enhancements

**Now:** Learning Hub (DSA Coach + OOP Coach) shipped. Samples balanced to 4–5 per language. Custom editor option added. Remaining blockers are still external — DB migrations and Vercel env keys.

### Shipped (2026-06-23, feature/phase3-product-enhancements)

- **Balanced analyzer samples** — all 7 languages now have 4–5 samples covering O(log n)→O(n)→O(n log n)→O(n²)→O(2ⁿ). Engine test fixed (was hardcoded to index [2], now uses `.find()` by ID).
- **Custom (blank) option** — "✏️ Custom (blank)" added to sample dropdown; clears editor, adapts empty-state hint text.
- **Learning Hub** at `/learning` — card grid with DSA Coach + OOP Coach as active links; Git/CLI/SQL coaches as "coming soon" roadmap cards.
- **DSA Coach** at `/learning/dsa` — Groq chat with specialized DSA system prompt; 6 starter prompts (sliding window, brute-force improvement, DP tutorial, pattern detection, BFS vs DFS, next topic).
- **OOP Coach** at `/learning/oop` — Groq chat with specialized OOP system prompt; 6 starter prompts (encapsulation, composition vs inheritance, class design review, SOLID, polymorphism, common mistakes).
- **`coachType` param** added to `/api/chat` — selects DSA or OOP system prompt when present; fully backwards-compatible (optional field).
- **README rewritten** — now accurately reflects all current features, stack, architecture, and env vars.
- **Security audit** — no leaked secrets found in git history or source; `.env.local` correctly gitignored; `.claude/settings.json` tracked but contains only infra IDs (not keys).

**Next session — start here:**

1. Merge PR #6 (feature/phase3-product-enhancements → main)
2. Apply B7 migration in Supabase SQL editor:
   `ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS context_metadata jsonb;`
3. Set `JUDGE0_API_KEY` in Vercel environment variables (enables Playground execution)
4. Optional follow-ups: wire RAG context into coach prompts, add chat history UI, email opt-in scaffold

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

### Shipped (2026-06-18, feature/next-sprint-v1) — Phase 2 F4: AI Chat Backend (Backend)

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

### Shipped (2026-06-21, backup-before-refactor) — Bug fixes, F3/F4 UI, RAG, Chat Markdown

- **4 pre-existing test failures fixed (0 regressions remaining):**
  - `results-panel.tsx`: `"Analyzing code..."` → `"Analyzing code…"` (unicode ellipsis)
  - `results-panel.test.tsx`: corrected assertion from inaccessible `aria-hidden` FluxLabel text to actual visible `AnalyzingState` body copy
  - `google-auth-button.tsx`: `"Redirecting to Google..."` → `"Redirecting to Google…"`
  - `save-dialog.tsx`: wrapped `HoloPulseLoader` in `aria-hidden="true"` span; `"Saving..."` → `"Saving…"` — fixes accessible name mismatch caused by `role="status"` contributing animated dots to button label
- **Favicon 404 fixed:** Created `public/brand/icon.svg` (dark bg + green checkmark); wired via `app/layout.tsx` metadata `icons` field
- **F3 Playground UI shipped:** `components/playground/playground-shell.tsx` — Monaco editor, language selector, STDIN toggle, Run button, output panel with terminal icon empty state. Connected to `POST /api/execute`. Nav item `ready: true`. `tests/components/playground-shell.test.tsx` (15 tests).
- **F5 Progress UI shipped:** `app/(app)/progress/page.tsx` + `components/progress/progress-page-client.tsx` — hero, stats cards (Level/XP/Streak), Level card with XP bar, streak calendar grid, achievements section, XP history chart (inline SVG), first-analysis CTA. Nav item `ready: true`. `tests/components/progress-page-client.test.tsx` (11 tests).
- **Chat markdown rendering:** Created `components/chat/chat-markdown.tsx` — zero-dependency inline renderer (bold, italic, inline code, fenced code blocks with lang label, headings, lists, paragraphs). Updated `chat-shell.tsx` to use `ChatMarkdown` for assistant messages, plain text for user messages, `aria-label="Loading response"` `…` placeholder during streaming. `tests/components/chat-markdown.test.tsx` (14 tests).
- **In-process RAG shipped:** `lib/ai/rag/knowledge-base.ts` (15 CS complexity knowledge chunks) + `lib/ai/rag/retriever.ts` (keyword-overlap retrieval with tag/title scoring). Updated `chatSystemPrompt()` to accept `ragContext`. Updated `app/api/chat/route.ts` to call `retrieveContext(trimmedMessage, 3)` before prompt. `tests/unit/rag-retriever.test.ts` (15 tests). No new dependencies.
- **Mobile layout verified** (390 × 844): Dashboard, Playground, Progress all correct.
- **Health check: 45 files / 441 tests green.** `typecheck ✅ · lint ✅ · build ✅ (20 routes) · test ✅`

### Shipped (2026-06-18, feature/next-sprint-v1) — Phase 2 F4: AI Chat Frontend (UI)

**Ownership note:** Chat UI implemented in this session (backend dev). Implements the `/chat` page consuming `POST /api/chat` SSE.

- **`components/layout/nav.ts`** — Chat nav item: `ready: true` (was `false`) — now renders as a live link in the app shell.
- **`app/(app)/chat/page.tsx`** — Server Component wrapper; `metadata.title = "Chat · ComplexityLab"`.
- **`app/(app)/chat/loading.tsx`** — Skeleton loading UI matching chat layout (Card + Skeleton primitives).
- **`components/chat/chat-shell.tsx`** — Full `"use client"` Chat UI: state machine (`messages`, `input`, `streaming`, `conversationId`, `error`); hand-rolled `ReadableStream.getReader()` SSE loop; Enter-to-send / Shift+Enter-for-newline; `role="log" aria-live="polite"` message list; empty state; `role="alert"` on error. 14 tests pass covering all behavior paths.
- **`tests/components/chat-shell.test.tsx`** — 14 new tests: empty state, input updates, Shift+Enter guard, user message visible immediately, input cleared, streaming chunks concat, input re-enabled after stream, API 429/SSE error alerts, empty-assistant-placeholder cleanup, conversationId forwarded on second turn.
- **Health check: 42 files / 393 tests green.** `typecheck ✅ · lint ✅ · build ✅ (19 routes) · test ✅`

**B7 graceful degrade:** Chat conversations do not persist between page loads until `20260616000300_chat.sql` is applied to Supabase. No errors surface to users.

**F4 UI Polish (queued — not yet started):**
Visual restyle of the existing `/chat` page. No rebuild — CSS-first enhancement only.
- Animated fade-up empty state using `.animate-rise` (already in `globals.css`)
- Elevated glassy composer using `.premium-panel` + `shadow-glow-green` focus token
- Auto-resize textarea (replace fixed `rows={3}`)
- Pulsing 3-dot thinking indicator using `animate-pulse` (replaces `…` text during streaming)
- **CRITICAL constraints:** keep `id="chat-input"` + `<label htmlFor="chat-input">`, `aria-label="Send message"`, `role="log"`, `role="alert"`, `[class*='rounded-ds-lg px-3']` bubble class substring (test 10 queries this), and both empty-state text strings in DOM at render time (tests assert synchronously). Do NOT use framer-motion — it is not validated in jsdom test paths (only present in `hero-section-nexus.tsx` which has no tests).

### Shipped (2026-06-24, main) — Cross-page integration + Bug fixes

**Tasks completed (LOOP MODE):**
- **Task 1 — Playground execution polling fallback** (`lib/execute/judge0.ts`): RapidAPI free tier returns `{ token }` instead of a result when `wait=true` is unsupported. Added `isTokenOnly()` detection + `pollSubmission()` (5×1s polls until terminal status). `callJudge0()` now transparently handles both synchronous and async Judge0 responses. Confirmed: no `/api/execute` errors in Vercel runtime logs.
- **Task 2 — Chat backend graceful degrade** (`app/api/chat/route.ts`): `getOrCreateProfile()` or `createConversation()` failure no longer returns 500. Route continues in stateless mode (Groq streams regardless of DB state). Confirmed: chat streams a full Groq response locally. Production runtime log shows the expected `conversation_create_failed` logEvent (handled, non-fatal).
- **Task 3 — Analyzer syntax error UI** (`lib/ai/types.ts`, `lib/ai/providers/groq.ts`, `components/analyzer/results-panel.tsx`): Groq system prompt instructs model to emit `"syntaxError"` field for unparseable code. `parseGroqAnalysis` extracts it. `ResultsPanel` shows a red `role="alert"` banner + card gets red border/bg tint. Browser-verified: Groq detected "invalid function keyword and incomplete code".
- **Task 4 — Chat with AI from Analyzer** (`components/analyzer/analyzer-workbench.tsx`, `lib/chat-handoff.ts`): New "Chat with AI" button on results panel. Sets `sessionStorage` handoff with code block + complexity results context. `ChatShell` consumes on mount. Browser-verified: pre-loaded message appears in chat textarea.
- **Task 5 — Open in Playground from Analyzer** (`lib/playground-handoff.ts`): New "Open in Playground" button. Sets `sessionStorage` handoff. `PlaygroundShell` consumes on mount. Browser-verified: Java binary search code pre-loaded in Playground with correct language set.
- **Task 6 — Send to AI Chat from Playground** (`components/playground/playground-shell.tsx`): "Send to AI Chat" button appears when `runState === "done" && result` (any terminal state — including errors, so users can ask AI about failures). Builds context message with code + execution output. Requires production testing (JUDGE0_API_KEY not in .env.local).
- **Task 7 — Send to Analyzer from Playground** (`lib/analyzer-handoff.ts` reuse): "Analyze" button in Playground toolbar. Sets analyzer handoff and navigates to `/analyzer`. Browser-verified: code appears pre-loaded, language preserved, sample selector shows "Load a sample..." (not a sample).
- **Task 8 — Progress section** — NOT TOUCHED.

**Additional fixes this session:**
- **DB schema fix** (`lib/db/chat.ts`, `lib/db/mappers.ts`, `types/index.ts`): `context_metadata` column absent from live `chat_conversations` table. Removed from INSERT payload; made optional in `ConversationRow` and `Conversation` types. Production `PGRST204` error eliminated.
- **Task 6 gate** widened: "Send to AI Chat" now shows for any finished run (not just `accepted`), so users can ask AI about compile/runtime errors too.

**New tests (18 added, 441 → 459):**
- `tests/unit/chat-handoff.test.ts` (5 tests): round-trip, one-shot clear, null on empty, invalid payload rejection, storage error swallowing
- `tests/unit/playground-handoff.test.ts` (6 tests): same pattern + all 7 language IDs
- `tests/unit/judge0-polling.test.ts` (6 tests): direct response path, token-only → poll → accepted, poll retry on In Queue, missing key, non-2xx, exhausted polls
- `tests/unit/groq-provider.test.ts` (+3 tests): `syntaxError` field set, omitted when absent, truncated to 200 chars

**Playwright verified:** Analyzer analysis, Open in Playground (code pre-load), Analyze from Playground (code handoff), Chat with AI (pre-loaded message), Chat streaming (Groq response), Syntax error red banner.

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
| B7 | **F4 migration schema mismatch** — `chat_conversations` table exists but is missing the `context_metadata` column. Chat still streams (stateless mode) but conversations don't persist. Fix: add the column via SQL editor: `ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS context_metadata jsonb;` | Manual | 🟡 Partial — table exists, column missing |
| B8 | **`JUDGE0_API_KEY` missing from Vercel env** — execution works (polling fallback shipped) but requires the key to be set in Vercel project env vars. Without it every run returns "JUDGE0_API_KEY is not configured". | User | ⬜ Pending |

## Strongly recommended before public launch

- Provision a **production Clerk instance** (replace `pk_test` / accounts.dev)
- Add **CI gate** (GitHub Actions: typecheck + lint + test + build)

## Quality gates — last verified 2026-06-24 (main, post-cross-page-integration sprint)

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors / 0 warnings |
| `npm run build` | ✅ green (21 routes) |
| `npm run test` | ✅ **48 files / 459 tests** |
