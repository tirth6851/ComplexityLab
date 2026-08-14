# ComplexityLab — Technical Requirements Document (TRD)

> **Status:** living document · Last updated 2026-06-10 · production URL and
> deployment section spot-corrected 2026-08-11 (see `MISSION_CONTROL.md` for
> current details — this file's API contracts were not re-audited this session)
> This is the **contracts-and-requirements** view: what must hold true.
> Implementation detail and history live in `ARCHITECTURE.md`; flows in
> `APP_FLOW.md`. Where they conflict, the code is truth — fix the docs.

---

## 1. Architecture

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict ·
Tailwind v3.4 + CSS-variable tokens · Clerk v7 (Google-only) · Supabase
Postgres · Groq (OpenAI-compatible chat completions) · Vitest. App root:
`frontend/` (also the Vercel Root Directory). Node 22 (root `.nvmrc`).

```
Browser
  │  RSC pages (server-rendered, data via lib/db)
  │  Client islands (analyzer workbench, theme, nav drawer, consent gate…)
  ▼
Next.js ── proxy.ts (Clerk middleware: route protection)
  ├── POST /api/analyze ──► lib/ai registry ──► Groq ──(any failure)──► heuristic engine
  └── Server Actions ─────► lib/action-limit ──► lib/db (service role) ──► Supabase
```

**Requirements**
- Server Components by default; `"use client"` only for interactivity.
- All rendering of complexity values goes through `lib/complexity.ts`
  (single Big-O → tier/color mapping).
- Pages never throw on data failure — they render `ErrorState`/banner + empty
  states (`DbResult` discipline, §2).

## 2. Data model

Domain types in `frontend/types/index.ts`:

| Type | Shape (summary) |
|---|---|
| `Analysis` | id, title, language, timeComplexity, spaceComplexity, verdict, createdAt |
| `AnalysisDetail` | `Analysis` + code + `result: CodeAnalysis \| null` |
| `Snippet` | id, title, language, tags[], savedAt |
| `Profile` | id, clerkUserId, displayName, preferredLanguage, createdAt |
| `CodeAnalysis` (lib/ai/types.ts) | time/space `ComplexityFinding`, verdict, notes[], metrics[], confidence 0–1, provider |

**Requirements**
- DB rows (snake_case) map to domain types (camelCase) only through the pure
  mappers in `lib/db/mappers.ts` (unit-testable, no client imports).
- Every `lib/db` function returns `DbResult<T> = {ok:true,data} | {ok:false,error}`
  — **never throws to callers**. Callers must handle both arms.
- Every `lib/db` entry point resolves the signed-in Clerk user itself
  (`auth()` → `getOrCreateProfile()`); no caller-supplied user ids.

## 3. API contracts

### `POST /api/analyze` (`app/api/analyze/route.ts`)

Request: `{ code: string, language: string }`

| Status | Trigger | Body |
|---|---|---|
| 200 | success | `{ analysis: CodeAnalysis }` |
| 400 | invalid JSON · empty/non-string code · unsupported language | `{ error }` |
| 401 | no Clerk session | `{ error }` |
| 413 | code > 100,000 chars | `{ error }` |
| 429 | > 20 analyses/min/user · header `Retry-After: <sec>` | `{ error }` |
| 500 | provider threw unexpectedly | `{ error }` |

Language allow-list = `lib/analysis/languages.ts` (7 ids: typescript,
javascript, python, java, go, rust, cpp).

### Server actions (all return `{ ok: boolean, error?: string }`)

| Action | File | Budget (per user) | After-effects |
|---|---|---|---|
| `saveAnalysisAction` | `(app)/analyzer/actions.ts` | 20/min | revalidate /analyses, /dashboard |
| `saveSnippetAction` | same | 20/min | revalidate /snippets, /dashboard |
| `deleteAnalysisAction` | `(app)/analyses/actions.ts` | 60/min | revalidate /analyses, /dashboard |
| `deleteAnalysisAndRedirectAction` | `(app)/analyses/[id]/actions.ts` | 60/min (shared key) | revalidate + `redirect("/analyses")` |
| `deleteSnippetAction` | `(app)/snippets/actions.ts` | 60/min | revalidate /snippets, /dashboard |
| `updateProfileAction` | `(app)/settings/actions.ts` | 10/min | revalidate /settings/profile, /dashboard |
| `deleteAllDataAction` | same | 3/hour | revalidate all data routes |

**Requirements:** every action validates inputs server-side, checks
`checkActionLimit` first, and never throws to the client. Save titles derive
from the first declared function name (`deriveTitle`), capped at 200 chars in
the DB layer.

## 4. Authentication

- Clerk v7, **Google SSO only** (signals API) — no passwords; Clerk handles
  credential-attack protection.
- Route protection in `frontend/proxy.ts` (Next 16 middleware convention):
  `PROTECTED_ROUTES = /dashboard|/analyzer|/analyses|/snippets|/settings (.*)`,
  enforced via `auth.protect({ unauthenticatedUrl: "/sign-in" })` so signed-out
  browsers land on the **branded** sign-in page, not Clerk's hosted page.
- `/api/analyze` self-guards with `auth()` → 401 JSON (no redirect for APIs).
- ⚠️ Current Clerk instance is a **dev instance** (`pk_test`, accounts.dev).
  A production instance is a launch requirement.

## 5. Database schema

Single migration: `supabase/migrations/20260609000000_init.sql`
(pgcrypto extension; `CREATE TABLE IF NOT EXISTS` semantics).

```
profiles        id uuid PK default gen_random_uuid()
                clerk_user_id text NOT NULL UNIQUE
                display_name text NULL
                preferred_language text NOT NULL default 'typescript'
                created_at / updated_at timestamptz NOT NULL default now()
                └─ trigger profiles_set_updated_at (BEFORE UPDATE → updated_at = now())

analyses        id uuid PK · profile_id uuid NOT NULL FK→profiles ON DELETE CASCADE
                title/language/code text NOT NULL
                time_complexity/space_complexity text NOT NULL
                verdict text NOT NULL default '' · result jsonb NULL
                created_at timestamptz NOT NULL default now()

saved_snippets  id uuid PK · profile_id uuid NOT NULL FK→profiles ON DELETE CASCADE
                title/language/code text NOT NULL · tags text[] NOT NULL default '{}'
                created_at timestamptz NOT NULL default now()
```

Indexes: `analyses_profile_created_idx (profile_id, created_at DESC)`,
`saved_snippets_profile_created_idx (profile_id, created_at DESC)`.

**RLS:** enabled on all three tables with **zero active policies**
(deny-by-default — anon keys read nothing). Three commented-out policies in
the migration implement per-user access via `auth.jwt()->>'sub'` for the
future Clerk↔Supabase third-party-auth bridge; enabling them requires no
schema change.

**Access requirement:** all reads/writes go through the server-only
service-role client (`lib/db/admin.ts`, guarded by the `server-only` package —
client-bundle leak = build error). Because service role bypasses RLS, **every
query must be user-scoped in application code** (enforced by the
`getOrCreateProfile()` pattern).

⚠️ **Operational:** the migration was **not applied** to the production
Supabase project (`hhnmxyyrihrpyerdmgdw`) as of 2026-06-09 and could not be
re-verified on 2026-06-10 (no authorized tool reaches that project). Until
applied, the app intentionally degrades to error/empty states.

## 6. AI provider architecture

- Contract: `AnalysisProvider { id, name, analyze(input) → CodeAnalysis }`
  (`lib/ai/provider.ts`). Valid ids: `mock | groq | openai | anthropic | gemini`;
  implemented: `mock`, `groq`. Adding a vendor = one provider file + one
  registry entry — **nothing else changes** (hard requirement).
- **Selection precedence** (`lib/ai/index.ts`): explicit arg → `AI_PROVIDER`
  env → default. Default = `groq` iff `GROQ_API_KEY` exists and doesn't start
  with `<` (placeholder guard), else `mock`. Unknown id → throw; scaffolded-
  but-unimplemented id → throw.
- **Groq provider** (`lib/ai/providers/groq.ts`): OpenAI-compatible chat
  completions, model `GROQ_MODEL` (default `llama-3.3-70b-versatile`),
  temperature 0, `response_format: json_object`, **20s timeout**. Responses
  are validated (notation must match `^O\(.{1,24}\)$`, confidence clamped,
  notes capped) before use.
- **Fallback requirement:** on ANY failure — missing key, HTTP error, timeout,
  unparseable/invalid JSON — fall back to the deterministic heuristic engine
  (`lib/analysis/engine.ts`), append a note saying so, and log
  `groq.fallback` with a reason. The analyzer must never fail because the LLM did.
- The mock provider wraps the heuristic engine (regex/scan-based: loop
  nesting, halving patterns, recursion shape, memoization, sort calls,
  allocation growth). Known blind spots are documented in `ROADMAP.md` tech debt.

## 7. Deployment architecture

- **Vercel**, project `complexity-lab` (team `tirths-projects-de842079`),
  Root Directory `frontend`, framework nextjs, Node 22.
- **GitHub `main` auto-deploys production** → *a push is a deploy*. Never push
  without explicit instruction.
- Production URL: https://www.complexitylab.top (custom domain;
  `complexity-lab-eight.vercel.app` also still resolves)
- Env vars (all environments): Clerk pair, Supabase URL + anon + service-role,
  `GROQ_API_KEY`, `GROQ_MODEL`, `NEXT_PUBLIC_APP_URL`. `AI_PROVIDER` is
  intentionally unset in prod — the registry's smart default selects groq.
  Optional: `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (global rate
  limiting; unset = in-memory per-instance, the historical default).
- CI: `.github/workflows/ci.yml` runs typecheck/lint/build/test on every
  push/PR to `main` (added 2026-08-11; does not gate the Vercel auto-deploy).
- Observability: structured JSON logs (`lib/log.ts`) → Vercel runtime logs.
  Events: `analyze.complete`, `analyze.error`, `analyze.rate_limited`,
  `rate_limited`, `groq.fallback`. **Submitted code is never logged.**
- Rate limiting is in-memory per warm serverless instance (sliding window,
  10k-key safety valve). Strict global limits require a shared store
  (Upstash/Vercel KV) behind the same `rateLimit()` signature.

## 8. Testing strategy

- Vitest + Testing Library (jsdom). Current: **24 files / 146 tests**, all
  green with typecheck, lint, and production build (verified 2026-06-10).
- Layout: `tests/unit` (engine, growth, complexity, stats, format, mappers,
  rate limiter, ai registry, groq parse/fallback) · `tests/components`
  (badges, states, results panel, readouts, nav, consent gate) ·
  `tests/integration` (analyze route incl. 401/429, protected-route matcher,
  save actions, db admin guards).
- **Invariant:** every sample template must land on its expected Big-O class —
  samples double as engine fixtures.
- Config: `server-only` aliased to a no-op stub; Clerk and `next/*` mocked;
  Monaco never rendered in tests.
- Gate (from `frontend/`):
  `npm run typecheck && npm run lint && npm run build && npm run test`.
- ⚠️ No CI pipeline yet — gates run locally.

## 9. Security requirements

1. `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`, `GROQ_API_KEY` are
   server-only; `lib/db/admin.ts` imports `server-only` so leaks fail builds.
2. RLS deny-by-default; every service-role query user-scoped in code.
3. Input hardening: 100KB code cap, language allow-list, JSON-shape checks on
   the API; all server actions validate + rate-limit.
4. Privacy: submitted code never logged; consent gate (1-year `cl-consent`
   cookie, versioned); in-app full data deletion (cascade).
5. Secrets only in `frontend/.env.local` (git-ignored) and Vercel env vars.
6. **Outstanding debt:** the once-leaked `.env.local` keys (purged from git
   history 2026-06-09 via filter-branch + force-push) must still be **rotated**
   in Clerk/Supabase/Groq dashboards, then updated in Vercel + locally.

---

*Maintained by the lead product engineer. Update when contracts change;
record the decision in `SECOND_BRAIN.md`.*
