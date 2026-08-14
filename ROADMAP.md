# ComplexityLab — Roadmap

> Status ledger + forward plan. Architecture details live in
> `ARCHITECTURE.md`; session rules and history in `HANDOFF.md`.

---

## ✅ Completed

### Foundation (earlier sessions)
- **Phase 0 — Security baseline:** untracked committed secrets, `.gitignore`,
  `.env.example`, corrected docs. (Key rotation still owed — see below.)
- **Phase 1 — App foundation:** Next 16 + React 19 + TS strict + Tailwind v3,
  Clerk + Supabase clients, token-based design system scaffold.
- **Phase 2 — Auth + dashboard shell:** Google-only Clerk auth (signals API),
  protected dashboard with five readouts, `proxy.ts` route protection.
- **Design pass:** Dark Lab / Signal Green tokens (`tokens.css`), complexity
  gradient, DS primitives (BigOBadge, VerdictReadout, MetricGauge,
  ComplexityBadge, ProgressBar, Tag, Input, Switch…), landing page, mobile
  drawer, theme toggle.

### Functional MVP (this session)
- **Route architecture:** `(app)` route group shares the shell across
  `/dashboard · /analyzer · /analyses · /snippets · /settings/*`; dynamic
  topbar title; nav with active states; protected matcher updated.
- **Analyzer MVP (`/analyzer`):** Monaco editor (Dark-Lab themes, theme-toggle
  aware), language selector (7 languages), 18 sample templates, scanline
  analyze animation, results panel (TIME/SPACE verdict readouts, 4 metric
  gauges, SVG growth-timeline visualization, reasoning notes), save actions.
- **AI architecture (`lib/ai`):** provider interface + registry
  (`AI_PROVIDER` env), deterministic heuristic engine as the live mock
  provider, Groq scaffold; OpenAI/Anthropic/Gemini slot in without rewrites.
- **Supabase data layer:** migration for `profiles` / `analyses` /
  `saved_snippets` with cascade deletes, indexes, RLS deny-by-default +
  documented Clerk-JWT policies; server-only `lib/db` with Clerk scoping and
  graceful `DbResult` degradation.
- **Real flows:** dashboard on real data (stats + language mix derived from
  rows), analyses/snippets pages with two-step delete, profile settings
  (Supabase), account settings (Clerk + theme + sign-out + danger zone),
  loading skeletons, error boundary, empty states everywhere.
- **Testing:** Vitest + Testing Library — 16 files / 111 tests (engine vs.
  every sample, route auth, protected-route matcher, save actions, mappers,
  stats, components).
- **Quality gates:** 0 TS errors · 0 ESLint errors · production build green ·
  runtime smoke test (public 200s, protected 307s, API 401).

### Hardening + AI + legal (second session pass)
- **Groq provider is live** (`lib/ai/providers/groq.ts`): chat-completions with
  strict-JSON output, validation/clamping, 20s timeout, and automatic fallback
  to the heuristic engine on any failure. Enabled via `AI_PROVIDER=groq`.
- **Rate limiting:** sliding-window in-memory limiter (`lib/rate-limit.ts`);
  `/api/analyze` 20/min/user (429 + Retry-After), saves 20/min, deletes
  60/min, profile updates 10/min, delete-all-data 3/hour. (Per-instance on
  serverless; swap to Upstash/KV for strict global limits.)
- **Observability:** structured JSON logging (`lib/log.ts`) for analysis
  requests (language, size, duration, result class, provider, rate-limit and
  fallback events) — visible in Vercel runtime logs. Code content is never
  logged.
- **Legal pack:** `/privacy` + `/terms` pages, footer + auth-page links, and a
  site-wide **consent gate** (accept → 1-year cookie; decline → redirected off
  the site). Data deletion already supported in-app (danger zone).
- **Login attempts/cooldown:** not applicable as passwords don't exist —
  auth is Google-only via Clerk, which enforces its own bot/attack protection;
  our own endpoints are covered by the rate limits above.
- Tests grew to **19 files / 131 tests** (rate limiter, Groq parse/fallback,
  consent gate, 429 path, provider-default resolution).
- **Secrets purge:** leaked `.env.local` removed from all git history
  (filter-branch + force-push); rotation still recommended.
- **Deployed + verified live** (complexity-lab-eight.vercel.app): consent
  accept/decline, legal pages, `/sign-in` redirect for protected routes
  (fixed via `unauthenticatedUrl`), Google SSO redirect to
  accounts.google.com confirmed in a real browser.

### UX polish sprint (2026-06-10, P1–P5 complete)
- **P1 onboarding:** dismissible `IntroStrip` guide; **Ctrl/⌘+Enter** to
  analyze (window listener + in-Monaco command); analyzer opens on the
  profile's `preferred_language` (finally consumed); idle-panel
  "Run first analysis" CTA.
- **P2 landing honesty:** feature trio rewritten to shipped truth (no phantom
  lessons/AI-optimization); dead-end dashboard CTA → "#how-it-works" anchor;
  new How-it-works section.
- **P3 mobile:** Monaco height `clamp(300px, 55dvh, 460px)`; drawer **focus
  trap** + focus restore; 36px delete tap targets; global
  `prefers-reduced-motion` support.
- **P4 feedback:** dependency-free toast system (`useToast`/`useToastSafe`);
  failed deletes now toast (previously silent); `CopyButton` on the detail page.
- **P5 round-trips:** sessionStorage analyzer handoff from saved analyses
  ("Open in analyzer" keeps the code) **and** snippets; snippet rows expand to
  reveal code with copy + open-in-analyzer (code was write-only before).
- Tests **133 → 146** (24 files); all gates green.

### Detail view + product docs (2026-06-10)
- **`/analyses/[id]` detail view shipped:** stored code + the persisted
  `result` JSONB re-rendered through `ResultsPanel`; `getAnalysis()`
  (user-scoped, friendly not-found), `AnalysisDetail` type, delete-with-
  redirect, loading skeleton; analyses list rows now link to details.
  Tests **131 → 133**.
- **Product doc system created:** `PRD.md`, `TRD.md`, `APP_FLOW.md` + project
  memory (`OPERATING_MANUAL.md`, `MISSION_CONTROL.md`, `SECOND_BRAIN.md`,
  `RULES_OF_ENGAGEMENT.md`). Doc drift in the older files corrected.

---

## 🔜 Immediate (operational, before features)

1. **Apply the database migration** — `supabase/migrations/20260609000000_init.sql`
   via the Supabase SQL editor (project `hhnmxyyrihrpyerdmgdw`) or
   `supabase db push`. The app intentionally degrades to error/empty states
   until this runs. **This is the only step blocking the full save flow.**
2. **Rotate the historically leaked keys** (Clerk, Supabase incl. service
   role, Groq). The leaked `.env.local` has been **purged from git history**
   (force-pushed 2026-06-09), but GitHub can cache orphaned commits and the
   values appeared in chat transcripts — rotation remains the real fix.
   After rotating: update Vercel env vars + local `.env.local`.
3. ~~Enable Google SSO~~ — **verified enabled**: the live sign-in button
   redirects to accounts.google.com (checked 2026-06-09 via browser).
4. ~~Vercel env vars / deploy~~ — **done**: production live at
   complexity-lab-eight.vercel.app, auto-deploys from GitHub `main`.
   Note: the Clerk instance is a **dev instance** (pk_test keys,
   accounts.dev); create a production Clerk instance before real launch.

---

## 🧭 Near-term (next build phases)

- ~~Analysis detail view~~ — **shipped 2026-06-10** (`/analyses/[id]`).
- ~~Snippet → analyzer round-trip~~ — **shipped 2026-06-10**; tags editing UI
  still open (Tag primitive already supports remove/select).
- ~~Keyboard shortcut + preferred-language default~~ — **shipped 2026-06-10**;
  shareable results still open.
- ~~Landing honesty + how-it-works~~ — **shipped 2026-06-10**; a deeper visual
  upgrade pass remains optional.
- **Global rate limiting** — move the limiter window to Upstash/Vercel KV.

## 🗺️ Mid-term

- **Lessons** — content model + RSC lesson pages (sorting, search, graphs,
  DP, recursion), tied to the analyzer.
- **Quizzes** — attempts, scoring, feedback; per-lesson.
- **Real progress tracking** — replace derived language-mix with persisted
  skill/topic metrics; streak history.
- **Clerk ↔ Supabase RLS bridge** — wire Clerk as third-party auth provider,
  enable the commented policies, move reads to the anon client where it
  simplifies things.

## 🌅 Long-term

- AI tutor (chat) with streaming; multi-provider failover via `lib/ai`.
- Algorithm catalog + animated visualizers (the original product vision).
- Community content, sharing, premium tier.

---

## ⚠️ Technical debt (known, accepted for MVP)

- **Migration not applied** to the live Supabase project (env project wasn't
  reachable from the build environment) — first item above.
- **Heuristic engine limits:** regex-based (no AST); Python comprehensions
  not counted as loops; some space-complexity cases undercounted (e.g. dict
  growth via index assignment); amortized costs ignored.
- `getOrCreateProfile()` runs per data call (2–3 small queries per page) —
  fine at this scale; memoize per-request (React `cache()`) when it matters.
- Monaco themes mirror token hexes by hand (documented exception to the
  no-hardcoded-colors rule) — keep in sync when tokens change.
- ~~No CI pipeline~~ — ✅ fixed 2026-08-11: `.github/workflows/ci.yml` runs
  `typecheck · lint · build · test` on every push/PR to `main`.
- 3 low/moderate `npm audit` advisories in dev tooling (down from 10, 7 high,
  as of 2026-08-11 — remaining are transitive: `dompurify`/`monaco-editor`,
  `esbuild`/vitest chain).

---

## Next recommended phase

**UX & product polish sprint** (tracked in `MISSION_CONTROL.md`):
P1 analyzer onboarding → P2 landing-page honesty/quality → P3 mobile
responsiveness → P4 micro-interactions & action feedback → P5 analysis/snippet
experience. No architectural change; design system reused throughout. The
operational items above (migration, key rotation, production Clerk) remain
user actions that can proceed in parallel.

---

## 2026-08-11 — Production-readiness audit

Confirmed production live at a new custom domain (`www.complexitylab.top`,
alongside the original `complexity-lab-eight.vercel.app`) and shipped every
production-readiness gap that didn't require external account access: CI
pipeline, optional Upstash-backed global rate limiting, `npm audit` cleanup
(10 → 3 advisories), the queued F4 Chat UI polish, and `.env.example` gaps.
Confirmed the production Clerk instance is still `accounts.dev` (dev, not
prod) — the last real blocker this session couldn't act on. Full detail in
`MISSION_CONTROL.md` and `PROJECT_BACKLOG.md`.
