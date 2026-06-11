# ComplexityLab Handoff Document

> **Audience:** A senior engineer — human or a fresh Claude Code session — opening this
> repository with **zero prior conversation history**.
> **Status as of this handoff (2026-06-10):** **Deployed to production and verified**
> (deployed code = 2026-06-09 state). Functional MVP + hardening complete: analyzer with
> live Groq AI (heuristic fallback), Supabase data layer, real app flows, rate limiting,
> structured logging, legal/consent pack, and a `/analyses/[id]` detail view (2026-06-10).
> All gates green: 0 TS errors · 0 ESLint errors · production build passes ·
> **133/133 tests pass**. All work is committed and pushed to GitHub `main`
> (auto-deploys production). History was **rewritten** on 2026-06-09 to purge a
> leaked `.env.local` — old SHAs are dead.
> **Read `MISSION_CONTROL.md` first for current sprint state.**
> **Live:** https://complexity-lab-eight.vercel.app (auto-deploys from GitHub `main`).
> **Companion docs:** `ARCHITECTURE.md` (technical deep-dive) · `ROADMAP.md` (status ledger +
> plan) · `DESIGN_HANDOFF.md` (design system) · `CLAUDE.md` (session instructions).
> **If you have 2 minutes, read [Quick Start](#quick-start-for-new-sessions) at the bottom.**

---

## Executive Summary

**ComplexityLab** is an interactive complexity-analysis and algorithm-learning platform:
paste code → see time/space complexity broken down visually on a green→red gradient →
save analyses and snippets → track activity. Dark-Lab "instrument panel" aesthetic,
Signal Green accent.

**What works today (signed in):**
- **/analyzer** — Monaco editor, 7 languages, 18 sample templates, an Analyze action that
  runs a **deterministic heuristic engine** (loop nesting, recursion shape, halving
  patterns, sorts, memoization) and renders verdict readouts, metric gauges, an SVG
  growth-timeline chart, and reasoning notes. Results/snippets persist to Supabase.
- **/dashboard** — real data: recent analyses, saved snippets, derived stats
  (counts, weekly activity, day streak, language mix).
- **/analyses, /snippets** — lists with two-step delete, empty/error/loading states.
- **/analyses/[id]** — detail view: stored code + the persisted result JSONB
  re-rendered through the results panel; delete-with-redirect. *(2026-06-10.)*
- **/settings/profile** (display name, preferred language → Supabase) and
  **/settings/account** (Clerk identity, theme, sign-out, delete-all-data danger zone).
- **AI analysis via Groq** (`AI_PROVIDER=groq`) with automatic fallback to the
  deterministic heuristic engine on any failure; OpenAI/Anthropic/Gemini slot
  into `lib/ai` without rewrites.
- **Rate limiting** on the API and every server action, **structured logging**
  (no code content), and a **legal pack**: `/privacy`, `/terms`, and a
  site-wide consent gate (decline → redirected off the site).

**Production verification (2026-06-09, real browser via Playwright against the live URL):**
consent gate appears → Accept sets `cl-consent=v1` and dismisses → Decline lands on
google.com → `/privacy`/`/terms` readable pre-consent → unauthed `/analyzer` 307s to the
branded `/sign-in` → **"Continue with Google" reaches the real accounts.google.com sign-in
screen (Google SSO is enabled in Clerk — confirmed working)** → unauthed API returns 401.

**The one thing blocking the full save flow** (user action, not code):
1. **Apply the DB migration** (`supabase/migrations/20260609000000_init.sql`) in the
   Supabase SQL editor for project `hhnmxyyrihrpyerdmgdw` — the app shows error/empty
   states until then (by design). The MCP-connected Supabase account does NOT contain
   this project, and DDL cannot run through the service key, so no session can automate it.
2. (Strongly recommended) **Rotate the historically leaked keys** — see Security Notes.

---

## Feature Status Matrix

| Feature | Status | Notes |
|---|---|---|
| Foundation / auth / shell | ✅ | Next 16 · React 19 · Clerk v7 Google-only · protected `(app)` shell |
| Dark Lab design system | ✅ | Tokens + primitives — **source of truth, do not redesign** |
| Landing page | ✅ | Hero, 3D readout, features, gradient band |
| **Analyzer MVP** | ✅ | Monaco + heuristic engine + full results panel |
| **AI architecture** | ✅ | `lib/ai` registry; `AI_PROVIDER=mock` default |
| **Database layer** | ✅ code / ⚠️ ops | Schema + RLS + server-only data layer; **migration not yet applied** |
| **App flows** | ✅ | Analyses, snippets, settings, save/delete, empty/error/loading |
| **Tests** | ✅ | Vitest + RTL, 19 files / 133 tests |
| **Analyses detail view** | ✅ | `/analyses/[id]` (2026-06-10) |
| **Groq integration** | ✅ | Live behind `AI_PROVIDER=groq`, auto-fallback to heuristic engine |
| **Rate limiting + logging** | ✅ | Per-user sliding-window limits on API + all actions; structured JSON logs |
| **Legal pack** | ✅ | `/privacy`, `/terms`, forced consent gate (decline → off-site) |
| Lessons / quizzes / progress persistence | 🔮 | Not started (see ROADMAP) |
| **Deployment** | ✅ | **Live**: complexity-lab-eight.vercel.app · project `complexity-lab` (team `tirths-projects-de842079`) · Root Directory `frontend` · GitHub `main` auto-deploys · all env vars uploaded (prod+preview+dev) |

---

## Architecture (summary — full detail in ARCHITECTURE.md)

- **Routes:** public `/`, `/sign-in`, `/sign-up`, `/sso-callback`; protected
  `(app)` group → `/dashboard`, `/analyzer`, `/analyses`, `/snippets`, `/settings/*`;
  `POST /api/analyze` guards itself with a 401. Protection lives in `proxy.ts`
  (`PROTECTED_ROUTES` exported for tests).
- **Analyzer pipeline:** client workbench → `POST /api/analyze` → `getAnalysisProvider()`
  → heuristic engine → `CodeAnalysis` contract → results panel → save server actions.
- **Data layer:** `lib/db/*` is server-only (service-role key, `server-only` package
  guard). Every function resolves the Clerk user itself and returns `DbResult<T>`
  (never throws to pages). RLS is deny-by-default; Clerk-JWT policies are written but
  commented in the migration for the future bridge.
- **Tables:** `profiles` (Clerk user mapping), `analyses` (incl. full result JSONB),
  `saved_snippets` (tags[]). Cascade deletes; `(profile_id, created_at desc)` indexes.
- **Testing:** `tests/{unit,components,integration}` — engine asserted against **every**
  sample template; route auth; protected-route matcher; save actions; mappers; stats.

---

## Security Notes

### Standing rules
- `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`, `GROQ_API_KEY` are **server-only**.
  `lib/db/admin.ts` imports `server-only` so a client leak fails the build.
- `.env.local` is git-ignored — never commit it.

### History purge (done 2026-06-09)
- The leaked `.env.local` was **removed from every commit** via `git filter-branch`
  (+ reflog expire + gc) and **force-pushed** to GitHub. Old SHAs (`0416f99`,
  `0c7a42a`, `d6daf5e`, `4d2e397`) were rewritten; current history starts at
  `9eb130a` → … → `56eaef5` (old "claude setup", now secret-free). Verified: no
  `.env.local` in any reachable commit.

### ⚠️ Outstanding (action required)
- **Rotate all keys anyway.** GitHub can cache orphaned commits after a force-push,
  and the values appeared in prior chat transcripts. Rotation in the vendor dashboards
  (Clerk, Supabase, Groq) is the only true remediation; afterwards update
  `frontend/.env.local` **and the Vercel env vars**.
- RLS is enabled deny-by-default, so leaked anon keys read nothing — but the old
  **service-role** key bypasses RLS: rotate it first.
- The Clerk instance is a **dev instance** (`pk_test`, accounts.dev). Create a
  production Clerk instance (custom domain) before a real public launch.

---

## Completed Work Log

### Earlier sessions
- **Phase 0 — Security:** untracked committed secrets, added `.gitignore` /
  `.env.example` / `.nvmrc`, corrected docs.
- **Phase 1 — Foundation:** hand-built Next 16 + React 19 + TS strict + Tailwind v3
  app in `frontend/`; token-based theming; ESLint 9 flat config.
- **Phase 2 — Auth + shell:** Google-only Clerk (signals API: `signIn.sso(...)`),
  custom auth pages, `proxy.ts`, dashboard shell + five readouts (then mock data).
- **Design pass:** Dark Lab / Signal Green tokens (`app/tokens.css` + `globals.css`),
  complexity gradient + tier system (`lib/complexity.ts`), DS primitives
  (BigOBadge, VerdictReadout, MetricGauge, ComplexityBadge, ProgressBar, Tag, Input,
  Switch, theme toggle), real landing page, mobile drawer.

### This session — Functional MVP
1. **Route restructure:** moved the dashboard shell to `app/(app)/layout.tsx` (route
   group → shared chrome, clean URLs); dynamic topbar `PageTitle`; nav items wired
   (Dashboard, Analyzer, Analyses, Snippets, Progress[soon], Settings); matcher updated.
2. **AI architecture first** (analyzer depends on it): `lib/ai` types/interface/registry;
   deterministic heuristic engine (`lib/analysis/engine.ts`) as the mock provider;
   growth math (`growth.ts`); language registry; 18 sample templates across 7 languages.
3. **Analyzer MVP:** `@monaco-editor/react` (the one requested new dependency) with
   custom Dark-Lab themes that follow the theme toggle; `Select` primitive (new, matches
   Input); results panel composed from existing DS primitives; hand-rolled SVG
   `ComplexityTimeline` (log₁₀ cost axis, highlighted detected class); scanline sweep
   animation; `POST /api/analyze` with auth + validation.
4. **Supabase:** migration with RLS + commented Clerk-JWT policies; server-only data
   layer with user scoping and graceful degradation. *The env's Supabase project wasn't
   reachable from this environment, so the migration ships as a file — apply manually.*
5. **Flows:** dashboard on real rows with derived stats (`lib/stats.ts`); analyses +
   snippets pages with `ConfirmDeleteButton`; settings (profile form, account, danger
   zone); save actions from the analyzer; `(app)/error.tsx`; loading skeletons;
   deleted `lib/mock-data.ts` — **no mock data remains anywhere**.
6. **Tests:** Vitest + Testing Library; `server-only` stubbed via alias; Clerk/`next/*`
   mocked where needed; engine-vs-samples, API auth, route matcher all covered.
7. **Bug hunt:** fixed an invalid engine regex, stale `.next` types, a React 19
   `react-hooks/refs` violation (ref → state), and a vitest/vite type clash (dropped
   `@vitejs/plugin-react`; esbuild handles TSX). Runtime smoke test: `/`+`/sign-in`
   → 200, `/analyzer`+`/dashboard` → 307 redirect, unauthenticated API → 401.

### Hardening + deployment session (2026-06-09, same day, second pass)
1. **Groq provider implemented and live** (`lib/ai/providers/groq.ts`): strict-JSON
   chat completion, validation/clamping, 20s timeout, auto-fallback to the heuristic
   engine on any failure (logged as `groq.fallback`). Registry defaults to groq when a
   real `GROQ_API_KEY` exists and `AI_PROVIDER` is unset (the dead Vercel API token —
   see below — blocked adding env vars remotely, so the smart default ships AI without
   dashboard work).
2. **Rate limiting** (`lib/rate-limit.ts` + `lib/action-limit.ts`): analyze 20/min,
   saves 20/min, deletes 60/min, profile 10/min, wipe-all 3/h — per user, 429 +
   `Retry-After` on the API. In-memory per warm instance (Upstash/KV later).
   Login-attempt cooldowns are N/A: passwordless Google-only auth; Clerk handles
   credential attack protection.
3. **Structured logging** (`lib/log.ts`): JSON events for analyze requests/errors/
   rate-limits/fallbacks → Vercel runtime logs. **Code content is never logged.**
4. **Legal pack:** `/privacy` + `/terms` (match actual data practices), site-wide
   `ConsentGate` (accept → 1-year `cl-consent=v1` cookie; decline → google.com;
   legal pages exempt), auth-page agreement line, landing footer links.
   *Baseline, not legal advice — have counsel review.*
5. **Git history purge** of the leaked `.env.local` + force-push (details above).
6. **Deployed + verified in production** (see verification block at top). Also fixed
   `auth.protect()` to redirect to the branded `/sign-in` via `unauthenticatedUrl`
   (was bouncing to Clerk's hosted accounts.dev page).
7. Findings for future sessions: the Vercel CLI token on disk
   (`~/AppData/Roaming/xdg.data/com.vercel.cli/auth.json`) returns **403 (dead)** —
   env-var changes need a fresh `vercel login`; the claude.ai Vercel MCP works for
   deployments/logs (no env-var tools). The claude.ai Supabase MCP is connected to an
   account that does NOT own the app's project — migrations are manual.

### Detail view + product docs session (2026-06-10)
1. **`/analyses/[id]` detail page:** `getAnalysis()` (user-scoped; PGRST116 →
   friendly "not found"), `AnalysisDetail` type + `mapAnalysisDetail`, page
   rendering stored code + the persisted `result` JSONB through `ResultsPanel`,
   `deleteAnalysisAndRedirectAction`, loading skeleton; list rows link to
   details. Tests 131 → **133**. All gates green. Committed + deployed 2026-06-10.
2. **Product doc system:** `PRD.md`, `TRD.md`, `APP_FLOW.md` + project memory
   (`OPERATING_MANUAL.md`, `MISSION_CONTROL.md`, `SECOND_BRAIN.md`,
   `RULES_OF_ENGAGEMENT.md`); drift fixes across this file, `ARCHITECTURE.md`,
   `ROADMAP.md`, `DESIGN_HANDOFF.md`, `CLAUDE.md`.

---

## Environment Variables

Templated in `frontend/.env.example` (placeholders only — never commit real values):

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=…   # client-safe
CLERK_SECRET_KEY=…                    # SERVER-ONLY
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…       # RLS-guarded (deny-by-default today)
SUPABASE_SERVICE_ROLE_KEY=…           # SERVER-ONLY — bypasses RLS
AI_PROVIDER=mock                      # mock | groq | openai | anthropic | gemini
GROQ_API_KEY=…                        # SERVER-ONLY (scaffolded, unused)
GROQ_MODEL=llama-3.3-70b-versatile
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

In production set these as **Vercel environment variables**; Root Directory = `frontend`.

---

## Development Rules (every future session must follow)

1. **Inspect before coding** — this file, `ARCHITECTURE.md`, `CLAUDE.md`, relevant code.
2. **The design system is the source of truth** — reuse `components/ui` primitives and
   tokens; never hardcode colors; do not redesign.
3. **Server Components by default;** client islands only for interactivity.
4. **DB access only via `lib/db/*`** (server-only, Clerk-scoped, `DbResult` returns).
5. **Keep Vercel/Clerk/Supabase compatibility;** no new deps without strong justification.
6. **Verify before declaring done:**
   `npm run typecheck && npm run lint && npm run build && npm run test`.
7. **Never commit secrets.** Don't commit/push unless asked — note that pushing to
   GitHub `main` **auto-deploys production** on Vercel, so a push is a deploy.

---

## Quick Start For New Sessions

- **Stack:** Next.js 16 (App Router) · React 19 · TS strict · Tailwind v3 · Clerk
  (Google-only, dev instance) · Supabase · Groq (live, with heuristic fallback) ·
  Vitest. App lives in **`frontend/`**.
- **State:** Deployed + verified at **https://complexity-lab-eight.vercel.app**.
  Analyzer with Groq AI, DB-backed flows, settings, rate limiting, logging,
  legal/consent pack, `/analyses/[id]` detail view, 133 tests. Everything
  committed and pushed; GitHub `main` auto-deploys production
  (**a push is a deploy** — never push without explicit instruction).
- **Run it:** `cd frontend && npm install && npm run dev` → http://localhost:3000.
  Verify: `npm run typecheck && npm run lint && npm run build && npm run test`.
- **The one blocker:** the DB migration (`supabase/migrations/…_init.sql`) is **not
  applied** — saves/dashboard show error/empty states until the user runs it in the
  Supabase SQL editor (project `hhnmxyyrihrpyerdmgdw`; not reachable from any tool
  in this environment). Google SSO is already enabled and verified.
- **Security debt:** rotate the once-leaked Clerk/Supabase/Groq keys (history was
  purged + force-pushed, but rotation is the true fix), then update Vercel env vars.
- **Tooling gotchas:** Vercel CLI token on disk is dead (403) — `vercel login` needed
  for env-var changes; claude.ai Vercel MCP handles deployments/logs; claude.ai
  Supabase MCP is connected to the wrong account for this project.
- **Read next:** `MISSION_CONTROL.md` for current sprint state (UX polish, P1–P5);
  `ARCHITECTURE.md` + `TRD.md` for how everything fits; `PRD.md` for product scope;
  `APP_FLOW.md` for flows; `SECOND_BRAIN.md` for decisions/lessons/debt.

*End of handoff.*
