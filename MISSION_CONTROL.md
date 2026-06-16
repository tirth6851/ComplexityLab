# ComplexityLab — Mission Control

> **Project memory · volatile layer.** Current sprint, tasks, blockers.
> **Read this first each session.** Update it every working session.
> Last updated: **2026-06-14**

---

## Current sprint: Beta Stabilization

**Goal:** clear all beta blockers — no new features. Priority order: Security →
Reliability → Accessibility → Testing → UX polish.

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

### Previously shipped (on main, 2026-06-10)
- UX polish sprint P1–P5: analyzer onboarding, landing honesty, mobile,
  toast system, round-trips (open-in-analyzer from analyses + snippets).
- `/analyses/[id]` detail view; product doc system.

## Beta blockers (must clear before public beta)

| # | Issue | Owner | Status |
|---|---|---|---|
| B1 | **DB migration unapplied** — `supabase/migrations/20260609000000_init.sql` not applied to project `hhnmxyyrihrpyerdmgdw`; saves/dashboard broken | User | 🔴 Open |
| B2 | **Leaked secrets unrotated** — Clerk, Supabase (incl. service-role), Groq; service-role bypasses RLS | User | 🔴 Open |
| B3 | **`beta-prep-audit` branch not merged** — 5 code fixes + QA docs + ownership tests undeployed | Code | 🟡 Ready |
| B4 | **AUTH-03/04 manual QA** — Google SSO completes + error resets spinner; zero automated coverage | QA | ⬜ Pending |
| B5 | **SEC-02/03 manual QA** — cross-account ownership (two Google accounts) | QA | ⬜ Pending |

## Strongly recommended before public launch

- Provision a **production Clerk instance** (replace `pk_test` / accounts.dev)
- Add **CI gate** (GitHub Actions: typecheck + lint + test + build)
- Add **CI gate** (GitHub Actions: typecheck + lint + test + build)

## Quality gates — last verified 2026-06-14 (beta-prep-audit branch)

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors / 0 warnings |
| `npm run build` | ✅ green (16 routes) |
| `npm run test` | ✅ 30 files / **211 tests** |
