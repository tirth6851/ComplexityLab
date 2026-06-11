# ComplexityLab — Architecture

> Current technical architecture as of the **Functional MVP** milestone
> (analyzer + data layer + flows + tests). For project history and session
> rules see `HANDOFF.md`; for the design system see `DESIGN_HANDOFF.md`;
> for what's next see `ROADMAP.md`.

---

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 | RSC-first; client islands only where interactive |
| Language | TypeScript (strict) | `@/*` alias → `frontend/` root |
| Styling | Tailwind CSS v3.4 + CSS-variable tokens | Dark Lab design system; tokens in `app/tokens.css` + `app/globals.css` |
| Auth | Clerk v7 (Google-only, signals API) | Route protection in `proxy.ts`; no passwords → Clerk/Google handle credential attack protection |
| Database | Supabase Postgres | Server-only service-role access; RLS deny-by-default |
| Editor | `@monaco-editor/react` | Client-only (dynamic import), custom Dark-Lab themes |
| AI | `lib/ai` provider abstraction | **Groq provider live** (`AI_PROVIDER=groq`) with automatic fallback to the deterministic heuristic engine; OpenAI/Anthropic/Gemini scaffolded |
| Abuse control | `lib/rate-limit.ts` + `lib/action-limit.ts` | Sliding-window per-user limits on the API route and every server action |
| Observability | `lib/log.ts` | Structured JSON logs (no code content) → Vercel runtime logs |
| Legal | `/privacy`, `/terms`, `ConsentGate` | Site-wide forced consent (cookie `cl-consent`); decline leaves the site |
| Tests | Vitest + Testing Library (jsdom) | 19 files / 133 tests |
| Deploy | Vercel | Root Directory = `frontend`; GitHub `main` auto-deploys |

---

## Repository layout

```
ComplexityLab/
├─ ARCHITECTURE.md / HANDOFF.md / ROADMAP.md / DESIGN_HANDOFF.md / CLAUDE.md
├─ supabase/
│  └─ migrations/20260609000000_init.sql   # profiles, analyses, saved_snippets (+RLS)
└─ frontend/                               # the app (Vercel root dir)
   ├─ proxy.ts                             # Clerk middleware (Next 16 proxy convention)
   ├─ vitest.config.ts                     # jsdom, @ alias, server-only stub
   ├─ app/
   │  ├─ layout.tsx                        # ClerkProvider, fonts, pre-hydration theme script
   │  ├─ page.tsx                          # public landing
   │  ├─ globals.css / tokens.css          # design tokens (theme-dependent / brand-constant)
   │  ├─ sign-in/ sign-up/ sso-callback/   # Google-only auth pages
   │  ├─ api/analyze/route.ts              # POST: auth → validate → provider → CodeAnalysis
   │  └─ (app)/                            # authenticated shell (sidebar + topbar)
   │     ├─ layout.tsx                     # the shell; route group keeps URLs clean
   │     ├─ error.tsx                      # segment error boundary (keeps chrome alive)
   │     ├─ dashboard/page.tsx (+loading)  # real data: readouts + derived stats
   │     ├─ analyzer/page.tsx (+actions)   # Monaco workbench; save server actions
   │     ├─ analyses/page.tsx (+actions, loading)
   │     │  └─ [id]/page.tsx (+actions, loading)   # detail view: code + stored result
   │     ├─ snippets/page.tsx (+actions, loading)
   │     └─ settings/                      # layout w/ tabs, profile + account pages, actions
   ├─ components/
   │  ├─ ui/                               # design-system primitives (see DESIGN_HANDOFF.md)
   │  ├─ layout/                           # sidebar, topbar, nav, page-title, mobile drawer
   │  ├─ readouts/                         # dashboard panels (now prop-driven, no mock data)
   │  ├─ analyzer/                         # workbench, code-editor, results-panel, timeline, save-actions
   │  └─ settings/                         # tabs, profile-form, danger-zone
   ├─ lib/
   │  ├─ ai/                               # provider abstraction (types, registry, providers/)
   │  ├─ analysis/                         # heuristic engine, growth math, languages, samples
   │  ├─ db/                               # server-only Supabase data layer + pure mappers
   │  ├─ complexity.ts                     # Big-O → tier/level mapping (visual source of truth)
   │  ├─ stats.ts                          # dashboard stat derivations (pure)
   │  ├─ format.ts                         # timeAgo()
   │  ├─ supabase/                         # anon-key clients (reserved for future RLS bridge)
   │  └─ utils.ts                          # cn()
   ├─ tests/                               # unit / components / integration (+setup, stubs)
   └─ types/index.ts                       # domain models (Analysis, Snippet, Profile, …)
```

---

## Route map

| Route | Render | Auth | Purpose |
|---|---|---|---|
| `/` | static | public | Landing |
| `/sign-in`, `/sign-up` | static | public | Google-only Clerk auth |
| `/sso-callback` | client | public | OAuth handshake |
| `/dashboard` | dynamic | **protected** | Readouts on real data + derived stats |
| `/analyzer` | static shell, client island | **protected** | Monaco workbench + results panel |
| `/analyses` | dynamic | **protected** | Saved analyses list + delete (rows link to details) |
| `/analyses/[id]` | dynamic | **protected** | Stored code + persisted `result` JSONB re-rendered through the results panel |
| `/snippets` | dynamic | **protected** | Saved snippets list + delete |
| `/settings` → `/settings/profile` | redirect | **protected** | — |
| `/settings/profile` | dynamic | **protected** | Display name + preferred language (Supabase) |
| `/settings/account` | dynamic | **protected** | Clerk identity, theme, sign-out, danger zone |
| `POST /api/analyze` | route handler | 401 JSON guard | Runs the analysis provider |

Protection is enforced in `proxy.ts` (`PROTECTED_ROUTES`, exported for tests).
`auth.protect({ unauthenticatedUrl: "/sign-in" })` keeps signed-out browsers on
the branded in-app sign-in page (without it, Clerk bounces to its hosted
accounts.dev page). Non-document requests get a 404 from Clerk by design. The
API route intentionally guards itself (`auth()` → 401 JSON) instead of relying
on the redirecting matcher.

Public legal routes: `/privacy` and `/terms` (static), plus the site-wide
consent gate mounted in the root layout.

---

## Analyzer pipeline

```
AnalyzerWorkbench (client)
  ├─ Select language / sample (lib/analysis/languages, samples)
  ├─ CodeEditor (Monaco, dynamic import, theme follows .dark via MutationObserver)
  └─ Analyze → POST /api/analyze { code, language }
                  └─ auth() guard → validation → getAnalysisProvider().analyze()
                        └─ mock provider → lib/analysis/engine.analyzeCode()
       ◄─ CodeAnalysis { time, space, verdict, notes[], metrics[], confidence, provider }
  └─ ResultsPanel
       ├─ VerdictReadout (TIME / SPACE)
       ├─ MetricGauge ×4 (ops @ n=1000, memory, loop depth, confidence)
       ├─ ComplexityTimeline (SVG growth curves, log₁₀ cost axis, detected class highlighted)
       ├─ "What the engine saw" notes
       └─ SaveActions → server actions → lib/db → revalidatePath
```

### The heuristic engine (`lib/analysis/engine.ts`)

Deterministic static scan — no AI, no network. Signals:

- **Loop nesting** — brace tracking for C-like languages, indentation for Python;
  functional iteration (`.map`/`.forEach`/…) counts as one level.
- **Halving patterns** (`/= 2`, `>> 1`, `(lo + hi) / 2`, `mid`) → logarithmic loops
  and divide-and-conquer.
- **Recursion shape** — self-call count per declared function: none / linear /
  branching; memoization detection collapses exponential to linear.
- **Sort calls** → floor of O(n log n).
- **Allocation growth** → linear collections, 2-D tables, recursion stack for space.

Output is ranked (worst signal wins) onto `O(1) … O(2ⁿ)` with a stated
confidence and human-readable notes. Known limitations: no real parsing
(regex/scan heuristics), Python comprehensions aren't counted as loops,
amortized costs ignored. The full result (incl. metrics) is persisted as
`analyses.result` JSONB so future engines can be compared against it.

### AI provider abstraction (`lib/ai`)

- `types.ts` — `AnalyzeCodeInput` / `CodeAnalysis` contract shared by UI, API, DB.
- `provider.ts` — `AnalysisProvider` interface + `ProviderId` (`mock | groq | openai | anthropic | gemini`).
- `index.ts` — registry; selection via `AI_PROVIDER` env (default `mock`).
- `providers/mock.ts` — wraps the heuristic engine.
- `providers/groq.ts` — **live**: OpenAI-compatible chat completions
  (`GROQ_MODEL`, default `llama-3.3-70b-versatile`), temperature 0,
  `response_format: json_object`, 20s timeout. The completion is validated
  (notation shape, confidence clamped, notes capped) before use. On ANY
  failure — missing key, HTTP error, timeout, unparseable JSON — it falls
  back to the heuristic engine and appends a note saying so; the analyzer
  never breaks because the LLM did. Fallbacks are logged (`groq.fallback`).

**Adding a vendor = one provider file + one registry entry.** Nothing in the
UI, route handler, or persistence changes.

### Abuse control & observability

- `lib/rate-limit.ts` — sliding-window limiter (in-memory per warm instance;
  the call signature is store-agnostic so Upstash/KV can slot in for strict
  global limits). `lib/action-limit.ts` wraps it with Clerk auth for Server
  Actions.
- Budgets: analyze 20/min, saves 20/min, deletes 60/min, profile updates
  10/min, delete-all-data 3/hour — all per user. `/api/analyze` returns 429
  with `Retry-After`.
- `lib/log.ts` emits one JSON line per event (`analyze.complete`,
  `analyze.error`, `analyze.rate_limited`, `rate_limited`, `groq.fallback`)
  with metadata only — **submitted code is never logged** (privacy-policy
  commitment).
- Login attempts/cooldown: not applicable — auth is passwordless (Google via
  Clerk); Clerk's attack protection covers the auth surface, our limits cover
  the app surface.

### Legal / consent

- `/privacy` and `/terms` (public, static) describe the actual data practices
  (Clerk/Google identity, code processing, functional-only cookies, Groq
  inference, retention/deletion) and standard liability terms.
- `components/legal/consent-gate.tsx` renders a blocking dialog on every page
  except the legal pages until the visitor accepts; acceptance is a 1-year
  first-party cookie (`cl-consent=v1` — bump the version to re-prompt after
  material policy changes). Declining redirects off the site
  (google.com). Auth pages additionally carry an explicit "by continuing you
  agree" line; the landing footer links both documents.
- These artifacts are a solid baseline, **not legal advice** — have counsel
  review before relying on them commercially.

---

## Data layer

### Schema (`supabase/migrations/20260609000000_init.sql`)

```
profiles        id PK · clerk_user_id UNIQUE · display_name · preferred_language
                created_at · updated_at (trigger-maintained)
analyses        id PK · profile_id FK→profiles (cascade) · title · language · code
                time_complexity · space_complexity · verdict · result JSONB · created_at
saved_snippets  id PK · profile_id FK→profiles (cascade) · title · language · code
                tags text[] · created_at
```

Indexes on `(profile_id, created_at desc)` for both child tables.

### Access model

- **Today:** all reads/writes go through the **server-only** service-role
  client (`lib/db/admin.ts`, guarded by the `server-only` package). Every
  entry point resolves the signed-in Clerk user itself (`auth()` →
  `getOrCreateProfile()`), so queries are always user-scoped. RLS is enabled
  with **no policies** → anon/publishable keys can read nothing.
- **Future:** the migration documents commented Clerk-JWT policies
  (`auth.jwt()->>'sub'`) to flip on when Clerk is wired as a Supabase
  third-party auth provider. Schema needs no changes.
- **Degradation:** every db function returns `DbResult<T>` (`ok | error`)
  instead of throwing; pages render `ErrorState`/banner + empty states when
  the database is unreachable or unprovisioned.

### ⚠️ Migration must be applied manually (still pending as of 2026-06-09)

The app's Supabase project (`hhnmxyyrihrpyerdmgdw`) is **active and the service
key works** (verified via PostgREST: auth OK, `profiles` table missing), but no
tool in this environment can run DDL against it: the claude.ai Supabase MCP is
connected to a different account (only contains inactive project
`lqlqurgthkdknxwwgygx`), there is no Supabase CLI/access token on disk, and
PostgREST can't execute DDL. Apply with either:

- Supabase Dashboard → SQL editor → paste `supabase/migrations/20260609000000_init.sql`, or
- `supabase link --project-ref hhnmxyyrihrpyerdmgdw && supabase db push` (CLI), or
- reconnect the Supabase MCP to the owning account and let a session apply it.

Until then the app runs with empty/error states (by design).

---

## Server actions

| Action | File | Does |
|---|---|---|
| `saveAnalysisAction` | `app/(app)/analyzer/actions.ts` | Validates, derives title from first function name, persists analysis + full result JSONB |
| `saveSnippetAction` | same | Persists the buffer as a snippet |
| `deleteAnalysisAction` | `app/(app)/analyses/actions.ts` | User-scoped delete |
| `deleteAnalysisAndRedirectAction` | `app/(app)/analyses/[id]/actions.ts` | User-scoped delete, then `redirect("/analyses")` (detail page) |
| `deleteSnippetAction` | `app/(app)/snippets/actions.ts` | User-scoped delete |
| `updateProfileAction` | `app/(app)/settings/actions.ts` | Display name + preferred language |
| `deleteAllDataAction` | same | Deletes profile row (cascade wipes all data) |

All actions validate inputs server-side, return `{ ok, error? }` (no throws to
the client), and `revalidatePath` the affected routes.

---

## Testing

```
tests/
├─ setup.ts                 # jest-dom matchers + RTL cleanup
├─ stubs/server-only.ts     # no-op stub (aliased in vitest.config.ts)
├─ unit/                    # engine (every sample template asserted), growth,
│                           # complexity mapping, stats, format, db mappers, ai registry
├─ components/              # badges, empty/error states, results panel, readouts, nav list
└─ integration/             # POST /api/analyze (auth + validation + happy path),
                            # protected-route matcher, save actions (mocked db), db admin guards
```

- `npm run test` / `npm run test:watch`
- Monaco and Clerk UI components are not rendered in tests (mocked or avoided);
  `next/link` / `next/navigation` are mocked where needed.
- The engine suite asserts **every sample template lands on its expected Big-O
  class** — samples double as fixtures.

---

## Deployment (live)

- **Production:** https://complexity-lab-eight.vercel.app — Vercel project
  `complexity-lab` (`prj_LmgNnSjUg2VP5A3c7vr1yDvDLqvm`), team
  `tirths-projects-de842079` (`team_AWtSLsBY0CWnV6UIjpRzmECQ`).
- **Pipeline:** GitHub `main` (`tirth6851/ComplexityLab`, public) auto-deploys
  to production. **Pushing main = deploying.** Root Directory = `frontend`,
  framework nextjs, Node 22.
- **Env vars:** all of `.env.example` uploaded to production+preview+development
  in a prior session. `AI_PROVIDER` is intentionally NOT set there — the
  registry defaults to groq because `GROQ_API_KEY` is present.
- **Tooling state (2026-06-09):** the Vercel CLI token on this machine is dead
  (403) — env-var changes need a fresh `vercel login`. The claude.ai Vercel MCP
  integration works for deployments/builds/logs but has no env-var tools.
- **Verified live (2026-06-09, Playwright):** consent gate accept/decline flows,
  legal pages pre-consent, protected-route redirect to `/sign-in`, Google SSO
  redirect reaching accounts.google.com, API 401 for unauthenticated calls.
- **Clerk:** dev instance (`pk_test`, accounts.dev hosted domain). A production
  Clerk instance is required before public launch.

## Security model

- `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`, `GROQ_API_KEY` are
  server-only; `lib/db/admin.ts` imports `server-only` so a client-bundle leak
  fails the build.
- RLS deny-by-default; service-role queries always scoped by Clerk `userId`.
- API route validates size (100 KB cap), shape, and language allow-list, and is
  rate-limited per user; all server actions are rate-limited too.
- **History purge (2026-06-09):** the once-leaked `.env.local` was removed from
  every commit (filter-branch + force-push); verified absent from all reachable
  history.
- ⚠️ **Outstanding:** rotate the once-leaked keys anyway (GitHub may cache
  orphaned commits; values appeared in chat transcripts). After rotation update
  `.env.local` + Vercel env vars.

---

## Conventions (enforced by review)

1. Reuse `components/ui` primitives; never hardcode colors — tokens only.
2. Server Components by default; `"use client"` only for interactivity.
3. DB access only through `lib/db/*` (server-only); never from client code.
4. All data functions return `DbResult<T>`; pages must handle the error arm.
5. Mono for data (Big-O, metrics, code), sans for prose.
6. Verify with `npm run typecheck && npm run lint && npm run build && npm run test`.
7. Don't commit unless asked.
