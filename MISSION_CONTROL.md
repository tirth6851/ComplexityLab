# ComplexityLab — Mission Control

> **Project memory · volatile layer.** Current sprint, tasks, blockers.
> **Read this first each session.** Update it every working session.
> Last updated: **2026-06-10**

---

## Current sprint: UX & Product Polish

**Goal:** make the existing MVP feel finished — onboarding, honesty, mobile,
feedback — without architectural change. Reuse the design system; no new deps.

### Recently shipped (2026-06-10)
- `/analyses/[id]` detail page: stored code + persisted result JSONB re-rendered
  through `ResultsPanel`; delete-with-redirect; loading skeleton.
- Analyses list rows link to detail pages.
- `AnalysisDetail` type, `mapAnalysisDetail`, `getAnalysis()` (user-scoped,
  PGRST116 → "not found"). Tests 131 → **133**.
- Product doc system: `PRD.md`, `TRD.md`, `APP_FLOW.md` + project memory
  (`OPERATING_MANUAL.md`, this file, `SECOND_BRAIN.md`, `RULES_OF_ENGAGEMENT.md`).

## Active tasks (priority order — plan approved 2026-06-10, all P1–P5)

| # | Task | Status | Notes |
|---|---|---|---|
| P1 | Analyzer onboarding | 🔨 in progress | first-run guide strip · ⌘/Ctrl+Enter · preferred-language default · idle-panel CTA |
| P2 | Landing page | 📋 planned | honest feature copy (lessons/optimization don't exist) · signed-out-aware CTAs · "how it works" |
| P3 | Mobile responsiveness | 📋 planned | responsive editor height · drawer focus trap · tap targets · reduced-motion |
| P4 | Micro-interactions | 📋 planned | tiny toast system (no deps) · surface delete failures · copy-to-clipboard |
| P5 | Analysis experience | 📋 planned | open-in-analyzer round-trip (analyses + snippets) · snippet code visibility · copy code |
| P6 | Lessons & quizzes | 🔮 deferred | needs content model + tables → separate proposal + approval |

## Blockers

1. **DB migration unapplied** (last verified 2026-06-09; re-check on 2026-06-10
   was not authorized) — `supabase/migrations/20260609000000_init.sql` must run
   in the Supabase SQL editor for project `hhnmxyyrihrpyerdmgdw`. Until then,
   prod saves/dashboard show designed error/empty states. **User action.**
2. **Key rotation owed** — historically leaked Clerk/Supabase/Groq keys (history
   purged 2026-06-09, but rotation is the real fix). **User action.**
3. **Clerk dev instance** (`pk_test`, accounts.dev) — production instance
   required before public launch. **User action.**
4. No CI — quality gates run locally only.

*(Resolved 2026-06-10: the detail-page work + doc system were committed and
pushed to `main` with explicit approval — production auto-deploys.)*

## Next priorities (after sprint)
Launch readiness: migration → key rotation → production Clerk → CI → analytics
instrumentation (PRD §5 metrics are defined but unwired) → global rate limits (KV).

## Quality gates — last verified 2026-06-10
| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors |
| `npm run build` | ✅ green (16 routes) |
| `npm run test` | ✅ 19 files / 133 tests |
