# ComplexityLab — Mission Control

> **Project memory · volatile layer.** Current sprint, tasks, blockers.
> **Read this first each session.** Update it every working session.
> Last updated: **2026-06-18**

---

## Current sprint: Phase 2 — F2 Progress System (in progress)

**Active branch:** `feature/next-sprint-v1` — all health gates green.
**Gate status:** `typecheck ✅ · lint ✅ · build ✅ · test 239/239 ✅`

**Now:** Phase 2 F2 (Progress: XP, levels, streaks, achievements) is actively being implemented on `feature/next-sprint-v1`.

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

### Previously shipped (on main, 2026-06-10)
- UX polish sprint P1–P5: analyzer onboarding, landing honesty, mobile,
  toast system, round-trips (open-in-analyzer from analyses + snippets).
- `/analyses/[id]` detail view; product doc system.

## Beta blockers (must clear before public beta)

| # | Issue | Owner | Status |
|---|---|---|---|
| B1 | **DB migration unapplied** — `supabase/migrations/20260609000000_init.sql` not applied to project `hhnmxyyrihrpyerdmgdw`; saves/dashboard broken | Ext. developer | 🔵 External dependency — not this sprint |
| B2 | **Leaked secrets unrotated** — Clerk, Supabase (incl. service-role), Groq; service-role bypasses RLS | User | ✅ Done (2026-06-18) |
| B3 | **`beta-prep-audit` branch not merged** — 5 code fixes + QA docs + ownership tests undeployed | Code | 🟡 Ready |
| B4 | **AUTH-03/04 manual QA** — Google SSO completes + error resets spinner; zero automated coverage | QA | ⬜ Pending |
| B5 | **SEC-02/03 manual QA** — cross-account ownership (two Google accounts) | QA | ⬜ Pending |

## Strongly recommended before public launch

- Provision a **production Clerk instance** (replace `pk_test` / accounts.dev)
- Add **CI gate** (GitHub Actions: typecheck + lint + test + build)
- Add **CI gate** (GitHub Actions: typecheck + lint + test + build)

## Quality gates — last verified 2026-06-18 (feature/next-sprint-v1, post-F2)

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors / 0 warnings |
| `npm run build` | ✅ green (16 routes) |
| `npm run test` | ✅ **36 files / 299 tests** |
