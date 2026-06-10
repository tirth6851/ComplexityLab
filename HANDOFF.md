# ComplexityLab Handoff Document

> **Audience:** A senior engineer — human or a fresh Claude Code session — opening this
> repository with **zero prior conversation history**.
> **Status as of this handoff:** **Functional MVP complete** (analyzer, Supabase data layer,
> real app flows, AI provider architecture, test suite). All gates green:
> 0 TS errors · 0 ESLint errors · production build passes · **111/111 tests pass**.
> Work is staged/unstaged in the working tree, **not committed** (per project rule).
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
- **/settings/profile** (display name, preferred language → Supabase) and
  **/settings/account** (Clerk identity, theme, sign-out, delete-all-data danger zone).
- **AI analysis via Groq** (`AI_PROVIDER=groq`) with automatic fallback to the
  deterministic heuristic engine on any failure; OpenAI/Anthropic/Gemini slot
  into `lib/ai` without rewrites.
- **Rate limiting** on the API and every server action, **structured logging**
  (no code content), and a **legal pack**: `/privacy`, `/terms`, and a
  site-wide consent gate (decline → redirected off the site).

**The two things blocking real usage** (user actions, not code):
1. **Apply the DB migration** (`supabase/migrations/20260609000000_init.sql`) to the
   Supabase project — the app shows error/empty states until then (by design).
2. **Enable Google SSO in the Clerk dashboard** (and rotate the historically leaked keys).

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
| **Tests** | ✅ | Vitest + RTL, 19 files / 129 tests |
| **Groq integration** | ✅ | Live behind `AI_PROVIDER=groq`, auto-fallback to heuristic engine |
| **Rate limiting + logging** | ✅ | Per-user sliding-window limits on API + all actions; structured JSON logs |
| **Legal pack** | ✅ | `/privacy`, `/terms`, forced consent gate (decline → off-site) |
| Lessons / quizzes / progress persistence | 🔮 | Not started (see ROADMAP) |
| Deployment | ⚙️ | Vercel-ready; Root Directory = `frontend`; env vars needed |

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

### ⚠️ Outstanding (action required)
- **Rotate all keys.** Live Clerk/Supabase(incl. service-role)/Groq keys were committed
  in early history (commit `0416f99`) and remain there. Rotation in the vendor
  dashboards is the only real remediation; then update `frontend/.env.local` + Vercel.
- RLS is enabled deny-by-default, so even leaked anon keys read nothing — but the old
  **service-role** key bypasses RLS: rotate it first.

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
   mocked where needed; 111 tests incl. engine-vs-samples, API auth, route matcher.
7. **Bug hunt:** fixed an invalid engine regex, stale `.next` types, a React 19
   `react-hooks/refs` violation (ref → state), and a vitest/vite type clash (dropped
   `@vitejs/plugin-react`; esbuild handles TSX). Runtime smoke test: `/`+`/sign-in`
   → 200, `/analyzer`+`/dashboard` → 307 redirect, unauthenticated API → 401.

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
7. **Never commit secrets. Don't commit at all unless asked** — leave changes staged.

---

## Quick Start For New Sessions

- **Stack:** Next.js 16 (App Router) · React 19 · TS strict · Tailwind v3 · Clerk
  (Google-only) · Supabase · Vitest. App lives in **`frontend/`**.
- **State:** Functional MVP. Analyzer (heuristic engine, no AI yet), real DB-backed
  flows, settings, tests. All gates green; nothing committed.
- **Run it:** `cd frontend && npm install && npm run dev` → http://localhost:3000.
  Verify: `npm run typecheck && npm run lint && npm run build && npm run test`.
- **Runtime prerequisites:** apply `supabase/migrations/…_init.sql` to the Supabase
  project; enable Google in the Clerk dashboard; rotate the historically leaked keys.
- **Read next:** `ARCHITECTURE.md` for how everything fits; `ROADMAP.md` for what to
  build next (recommended: operational unblock, then the Groq provider).

*End of handoff.*
