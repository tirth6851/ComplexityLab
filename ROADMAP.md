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
  111/111 tests · runtime smoke test (public 200s, protected 307s, API 401).

---

## 🔜 Immediate (operational, before features)

1. **Apply the database migration** — `supabase/migrations/20260609000000_init.sql`
   via the Supabase SQL editor or `supabase db push`. The app intentionally
   degrades to error/empty states until this runs.
2. **Rotate the historically leaked keys** (Clerk, Supabase incl. service
   role, Groq) — they exist in git history (`0416f99`).
3. **Enable Google SSO** in the Clerk dashboard (runtime prerequisite).
4. **Vercel env vars** — set all of `frontend/.env.example` (Production +
   Preview), Root Directory = `frontend`.

---

## 🧭 Near-term (next build phases)

- **Analysis detail view** — `/analyses/[id]`: stored code + full persisted
  `result` JSONB re-rendered through the results panel.
- **Snippet → analyzer round-trip** — "Open in analyzer" on snippet rows;
  tags editing UI (Tag primitive already supports remove/select).
- **Groq provider integration** — implement `providers/groq.ts` (strict-JSON
  prompt → `CodeAnalysis`, fallback to mock on failure), streaming later.
- **Analyzer polish** — shareable results, keyboard shortcut (⌘⏎ to analyze),
  per-user preferred language default from profile.

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
- Mobile drawer doesn't trap focus (Escape/backdrop close only).
- No CI pipeline yet — gates run locally (`typecheck · lint · build · test`).
- No `/analyses/[id]` detail view yet; saved `result` JSONB is stored but
  unread.
- 4 moderate `npm audit` advisories in dev tooling (vitest/jsdom chain).

---

## Next recommended phase

**Operational unblock + Groq:** apply the migration, rotate keys, deploy to
Vercel with env vars, then implement the Groq provider behind `AI_PROVIDER`
with mock fallback. That turns the MVP into a genuinely AI-powered product
with zero architectural change.
