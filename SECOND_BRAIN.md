# ComplexityLab — Second Brain

> **Project memory · knowledge layer.** Architectural decisions, lessons
> learned, known issues, technical debt, reusable patterns. Append-mostly;
> prune only when something becomes false. Last updated: 2026-08-11.

---

## Architectural decisions (ADR-lite)

| # | Date | Decision | Why / consequences |
|---|---|---|---|
| D1 | 2026-06 | `(app)` route group carries the authenticated shell | Shared sidebar/topbar chrome, clean URLs; error boundary keeps chrome alive |
| D2 | 2026-06 | AI behind `AnalysisProvider` registry, env-selected | Vendor swap = config change; UI/persistence never know the provider |
| D3 | 2026-06 | Groq falls back to the heuristic engine on ANY failure | Analyzer can never break because an LLM did; fallback noted in results + logged |
| D4 | 2026-06 | Heuristic engine doubles as the `mock` provider AND the test oracle | Deterministic, network-free dev/test; every sample asserts its Big-O class |
| D5 | 2026-06 | Service-role DB access + RLS enabled with zero policies | Deny-by-default for anon keys; queries user-scoped in code; commented Clerk-JWT policies ready for the future bridge (no schema change needed) |
| D6 | 2026-06 | Full `CodeAnalysis` persisted as `analyses.result` JSONB | Future engines comparable against stored history; powered the detail page with zero migration |
| D7 | 2026-06 | `DbResult<T>` everywhere; db functions never throw to pages | Graceful degradation (error/empty states) instead of crashes when DB is unprovisioned |
| D8 | 2026-06 | Route protection in `proxy.ts` with `unauthenticatedUrl: "/sign-in"` | Without it Clerk bounces to its hosted accounts.dev page (looked broken) |
| D9 | 2026-06 | In-memory sliding-window rate limiter, store-agnostic signature | Per-warm-instance is acceptable now; Upstash/KV can slot in without call-site changes — **done, see D20** |
| D10 | 2026-06 | Consent via versioned 1-year cookie (`cl-consent=v1`) | Bump version to force re-consent after material policy changes |
| D11 | 2026-06-10 | Detail-page delete uses a separate `deleteAnalysisAndRedirectAction` | `redirect()` throws NEXT_REDIRECT — can't bolt it onto the list action that returns `{ok}` |
| D12 | 2026-06-10 | Four-file project memory (manual/control/brain/rules) at repo root | Different update cadences; root-level matches existing doc convention; indexed from CLAUDE.md |
| D13 | 2026-06-10 | "Open in analyzer" round-trips use a one-shot **sessionStorage handoff** (`lib/analyzer-handoff.ts`), not URL params | Code can be 100KB — too big for URLs; one-shot take() prevents stale replays |
| D14 | 2026-06-10 | Hand-rolled toast system (`components/ui/toaster.tsx`), provider in the `(app)` layout | No dependency; `useToastSafe()` no-op fallback keeps shared primitives testable outside the shell |
| D15 | 2026-06-18 | Progress awarded best-effort in `awardProgressForSave` — never throws, never fails the save | Awarding XP is a side-effect; a DB failure must not roll back the user's primary action (saving an analysis) |
| D16 | 2026-06-18 | DB-backed daily quota + graceful degrade on quota-check failure | In-memory rate limits can't enforce per-day caps across serverless instances; if `countXxxToday()` returns `{ok:false}`, ALLOW the operation and log — never block a user on a transient DB issue |
| D17 | 2026-06-18 | Three-layer kill switch for external code execution — AbortController (12s, route) + Judge0 `wall_time_limit` (8s, service) + Vercel `maxDuration` (15s) | Defensive-in-depth: each layer guards a different failure mode (runaway code, slow Judge0, Vercel billing); all three must coexist |
| D18 | 2026-06-18 | AI provider infrastructure extracted to `lib/ai/groq-client.ts`; feature-specific providers (analysis, chat) import it | Avoids duplicating auth, timeout, AbortController, and error normalization across N provider files; interfaces stay per-feature (ISP) |
| D19 | 2026-06-18 | **F4 token accounting strategy:** quota gate uses `ai_usage.message_count` (user turns only, 1 per exchange); token counts are analytics-only and recorded post-stream. Tokens read from Groq's final SSE chunk (`stream_options.include_usage: true`); fallback estimate is `chars/4`. Persisted via `bump_ai_usage` SQL function (atomic upsert — avoids read-modify-write races on concurrent requests). `CHAT_DAILY_QUOTA` is the gate; `tokens_in/out` are never gated — they feed a future usage-analytics panel. |
| D20 | 2026-08-11 | Rate limiting fulfills D9: `rateLimit()` is now async, tries Upstash Redis (REST API, sorted-set sliding window via `/pipeline` — no SDK dependency) when `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are set, else in-memory (`rateLimitMemory()`, unchanged, still exported). Any Redis failure (non-2xx, error in pipeline reply, timeout via `AbortSignal.timeout(1500)`, thrown exception) returns `null` from `rateLimitRedis()` and falls through to the in-memory path — a rate-limiter outage must never itself become an outage. Check-then-add across two pipeline calls (not one atomic op) admits a small race under concurrent bursts on the same key; accepted because this module only governs abuse-guard burst limits — anything that must be exact (billing caps) already goes through DB-backed counts (D16), unaffected by this change. |

## Lessons learned

- **Secrets:** `.env.local` was once committed → required `git filter-branch`
  + force-push + (still owed) key rotation. Prevention is the only cheap path.
- **PostgREST:** `.single()` returns error code `PGRST116` for zero rows — map
  it to a friendly "not found" instead of surfacing a raw error (`getAnalysis`).
- **Next 16:** middleware is `proxy.ts`, not `middleware.ts`; route handlers
  and pages get `params` as a `Promise` (must `await`).
- **React 19 + vitest:** `@vitejs/plugin-react` clashed with vitest's vite
  types — dropped it; esbuild compiles TSX fine. `react-hooks/refs` forbids
  render-time ref reads (use state).
- **`server-only` in tests:** alias it to a stub in `vitest.config.ts`;
  the real package throws outside RSC environments.
- **Monaco:** requires concrete hex colors → the one sanctioned exception to
  "tokens only" (keep in sync manually). Load with `dynamic(..., {ssr:false})`.
- **Clerk redirects:** non-document requests to protected routes get a 404 by
  design; APIs should self-guard with `auth()` → 401 JSON.
- **Tooling (2026-06-09):** local Vercel CLI token is dead (403) — env-var
  changes need fresh `vercel login`; claude.ai Vercel MCP does deployments/logs
  only; claude.ai Supabase MCP is connected to an account that does NOT own
  the app's project → migrations are manual, by the user.
- **framer-motion in jsdom (2026-06-18):** `framer-motion ^12.40.0` is installed (merged from upstream) but is ONLY used in `hero-section-nexus.tsx` which has no Vitest tests. Before using `<motion.*>` or `AnimatePresence` in any `"use client"` component that has Vitest coverage, verify it doesn't break jsdom. The safe default is CSS-first: `.animate-rise` (already in `globals.css`), `animate-pulse` + `[animation-delay:]` Tailwind arbitrary values, and token-based shadow/glow for focus states. If framer-motion is needed, add `useReducedMotion()` and confirm `AnimatePresence` without an `exit` prop causes instant unmount (no delayed DOM removal that could break test selectors queried after `waitFor`).
- **SSE streaming in jsdom (2026-06-18):** `ReadableStream` + `TextEncoder`-based SSE helpers work cleanly in jsdom. The `makeSSEBody()` pattern (enqueue `data: {...}\n\n` blocks then `controller.close()`) is the right test helper shape. Do not use `TransformStream` or `Response.body.pipeThrough()` — jsdom support is inconsistent.
- **Org limits (2026-06-10):** parallel subagent fan-outs can hit session
  usage limits — keep inline-audit fallback in mind for doc work.
- **React 19 lint (2026-06-10):** `react-hooks/set-state-in-effect` forbids
  synchronous setState in effects. For client-only reads of browser storage,
  prefer `useSyncExternalStore` (consent gate, intro strip); for genuine
  one-shot consume-on-mount (analyzer handoff) use a scoped, commented
  eslint-disable. Also: don't reference `ref.current` in effect cleanups —
  capture it in a local at effect setup.

## Known issues

*(The 12 issues from the 2026-06-10 UX audit — silent delete failures,
write-only snippets, unused `preferred_language`, landing overpromises,
dead-end dashboard CTA, code-losing re-analyze, fixed editor height, missing
focus trap, no keyboard shortcut, no reduced-motion handling, small tap
targets, no copy-to-clipboard — were **all resolved in the same-day UX polish
sprint**, P1–P5.)*

| Issue | Evidence | Severity |
|---|---|---|
| Stored-code view has no syntax highlighting (plain `<pre>`) | `analyses/[id]/page.tsx`, `snippet-item.tsx` — deliberate: read-only Monaco islands are too heavy for view-only | Low |
| Snippet tags can't be edited after save | Tag primitive supports it; no UI wired | Low |

## Technical debt (carried, accepted)

- Heuristic engine is regex/scan-based (no AST); Python comprehensions not
  counted as loops; amortized costs ignored.
- `getOrCreateProfile()` runs per DB call — 5× per dashboard render (RSC).
  `React.cache()` deduplicates within an RSC render tree but NOT in route
  handlers. Both `/api/execute` and `/api/chat` already resolve `getOrCreateProfile()`
  once at the top and pass `profile.id` through — this is the correct pattern for
  all new route handlers.
- Rate limits are per warm instance, not global.
- No CI pipeline; gates run locally. (Recommend adding before F5.)
- 4 moderate `npm audit` advisories in dev tooling (vitest/jsdom chain).
- Judge0 language IDs are hardcoded — must verify against live `/languages`
  endpoint before first deploy. `wait=true` synchronous mode assumed available
  on RapidAPI free tier — confirm before deploy.
- F3 migration (`20260616000200_executions.sql`) not yet applied to production
  (B6) — quota tracking silently degrades (graceful, execution still works).
- F4 migration (`20260616000300_chat.sql`) not yet applied to production (B7) —
  chat history not persisted between page loads (graceful degrade, no errors surfaced).

## Reusable patterns

- **`DbResult<T>`** — non-throwing result union; pages branch on `.ok`.
- **`buttonClassName({variant,size})`** — share button styling with `<Link>`s.
- **`ConfirmDeleteButton`** — two-step destructive confirm (arm → 3s window).
- **`EmptyState` / `ErrorState` / `Skeleton`** — the three designed non-happy states.
- **`checkActionLimit(action, opts)`** — first line of every server action.
- **`logEvent(name, meta)`** — structured logs; never include user code.
- **Samples-as-fixtures** — every analyzer sample is also an engine test case.
- **Snapshot-at-analyze** — workbench captures `{code, language}` per result so
  later edits can't corrupt a save; `SaveActions` remounts per result via `key`.
- **`useSyncExternalStore` over a cookie** — consent gate re-renders on accept
  without context plumbing (same pattern: intro strip over localStorage).
- **`useToast()` / `useToastSafe()`** — action feedback; the Safe variant
  no-ops without a provider so shared primitives stay portable/testable.
- **`CopyButton`** — clipboard write + ✓ flash, mono-label styling.
- **Analyzer handoff** — `setAnalyzerHandoff()` → navigate → workbench
  `takeAnalyzerHandoff()` on mount; validated, one-shot.
- **`SnippetItem`** — expandable row revealing code + copy + open-in-analyzer;
  bound server actions passed from the server page into the client row.
- **Route proxy pipeline** — template for any route that proxies to an external
  service or AI: `auth() → rateLimit (in-memory, burst) → countXxxToday (DB, daily,
  graceful degrade on failure) → validate body → AbortController + external call
  → recordXxx best-effort (never blocks) → logEvent (metadata only, never user
  content) → return result`. Implemented in both `/api/execute` (Judge0) and
  `/api/chat` (Groq SSE). The SSE variant uses `ReadableStream` + `finally` block
  for post-stream DB writes; the sync variant returns JSON directly.
- **Best-effort side-effect** — `recordExecution`, `awardProgressForSave`, and
  future equivalents: call them, log failure, never await their result to block
  the primary response. Applied consistently across all Phase 2 features.
