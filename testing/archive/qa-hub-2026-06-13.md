# ComplexityLab Testing Hub

> **The QA command center for the beta cycle.** This file is the *tracking
> layer*: status, readiness, the live bug log, and sign-off. For the
> step-by-step manual test cases (AUTH-xx, ANL-xx, ANA-xx, SNP-xx, DSH-xx,
> CON-xx, MOB-xx, SEC-xx, ERR-xx, EDG-xx, A11Y-xx) see **`TEST_PLAN.md`** — the
> two are designed to be used side by side. Companion analyses:
> **`TESTING_READINESS_REPORT.md`** (risk + blocker assessment) and
> **`UX_PRE_BETA_REVIEW.md`** (UX findings).

---

## Project Information

| Field | Value |
|---|---|
| **Version** | 0.1.0 |
| **Branch** | `main` |
| **Commit** | `6979624` (`69796242a9069d1273886ad7751dad1520d141ed`) |
| **Date** | 2026-06-13 |
| **Tester** | _unassigned_ |
| **Environment** | Production: https://complexity-lab-eight.vercel.app · Local: `cd frontend && npm run dev` (http://localhost:3000) |

**Current Status:** `In Progress` _(pre-beta audit complete; code-ready for a QA cycle, gated on operational blockers — see below)_

- [ ] Not Started
- [x] In Progress
- [ ] Blocked
- [ ] Complete

**Quality gates (verified 2026-06-13 on this commit):** `typecheck` 0 errors ·
`lint` 0 errors / 0 warnings · `test` 24 files / 153 tests pass · `build` green
(16/16 routes). Note: gates run **locally only** — there is no CI.

---

# Release Readiness Dashboard

Legend: ☑ = ready to exercise in a QA cycle with no open P0/P1 in-area · ☐ = has
an open beta blocker. "Ready with notes" items are checked but carry a tracked
follow-up.

| Area | State | Note |
|---|:---:|---|
| **Authentication** | ☑ Ready | Code solid (route + API guards). Operational: still a Clerk **dev** instance (`pk_test`) — production instance owed before public launch. |
| **Analyzer** | ☑ Ready | Flow works end-to-end. **P1-1 fixed this session:** `tierFromNotation` now mirrors the engine's `complexityTier()` for every Big-O class (unit-guarded), so AI and heuristic verdicts agree. Follow-up: no route `loading.tsx` yet (P1-5, tracked under UX). |
| **Analyses** | ☑ Ready | List + detail + delete fully wired and ownership-scoped. |
| **Snippets** | ☑ Ready | Create/view/delete fully wired and ownership-scoped. |
| **Dashboard** | ☑ Ready | Real DB-derived stats. Progress polish landed this session (friendly language labels, ARIA progress bars, comment fix). |
| **Accessibility** | ☑ Ready | P1-2 (contrast) + P1-3 (SR announce) fixed this session — meta/hint tints now clear AA and the analyzer result/error is announced via live regions. Remaining: P2 consent focus-trap + some sub-44px touch targets. |
| **Mobile** | ☑ Ready | Strong responsive layout + drawer focus trap. P2: some icon hit-targets < 44px. |
| **Security** | ☐ Not ready | **P0** prod DB migration may be unapplied · **P0** leaked keys never rotated · P1 no DB-enforced RLS policies (app-layer only). |
| **Performance** | ☑ Ready | Acceptable for beta. P2: rate limiter is in-memory per-instance (not global). |

**Overall Beta Readiness: ~89%** (8 of 9 areas green — only Security gated, on operational P0s)

- **Ready to *begin* a QA cycle?** Yes — once a working DB + signed-in session
  exist in the target environment. The app is code-complete, builds clean, and
  153 automated tests pass (146 baseline + 7 added this session).
- **Ready for *public* beta launch?** Not yet — but the **code** punch-list is
  essentially clear. All P1 code fixes (tier mapping, a11y contrast +
  screen-reader announce, DB-error sanitization, analyzer loading state) landed
  this session. Gating now reduces to the **2 operational P0s** (apply the prod
  migration; rotate all leaked secrets) and the mandatory manual passes
  (AUTH-03/04, SEC-02/03). See `TESTING_READINESS_REPORT.md` → *Beta Blockers*.

---

# Critical Bugs (P0)

> P0 = blocks beta launch. The two current P0s are **operational/environment**
> blockers (not code defects); the in-tree code hygiene around them is correct.

### P0-1 — Production database migration may be unapplied

- **ID:** P0-1 · **Reporter:** Pre-beta audit · **Owner:** _project owner (user action)_ · **Date:** 2026-06-13
- **Description:** The init migration (`supabase/migrations/20260609000000_init.sql`) that creates `profiles` / `analyses` / `saved_snippets` and enables RLS may not be applied to the prod Supabase project (`hhnmxyyrihrpyerdmgdw`). The MCP-connected account cannot reach that project, so application must be done manually in the Supabase SQL editor.
- **Steps To Reproduce:** Sign in to prod → analyze code → **Save analysis** → open `/analyses`.
- **Expected Result:** The analysis persists and appears in the list.
- **Actual Result (if unapplied):** Save fails; `/analyses`, `/snippets`, `/dashboard` show their designed error/empty states.
- **Severity:** P0 (Blocker) · **Status:** `Open` (unverified from repo)
- **Notes:** Verify `profiles`/`analyses`/`saved_snippets` exist **with RLS enabled** in prod, then confirm a real save+reload before opening beta.

### P0-2 — Leaked secrets never rotated

- **ID:** P0-2 · **Reporter:** Pre-beta audit · **Owner:** _project owner (user action)_ · **Date:** 2026-06-13
- **Description:** Clerk, Supabase (incl. **service-role**), and Groq keys were historically committed/leaked. Git history was purged, but the keys themselves were never rotated. The service-role key bypasses RLS and is the sole barrier protecting all user data; a leaked-but-unrotated key = full read/write/delete of every row, bypassing all app-layer scoping.
- **Steps To Reproduce:** N/A (credential exposure).
- **Expected Result:** All production secrets are post-leak rotated.
- **Actual Result:** Original (leaked) keys still in use.
- **Severity:** P0 (Blocker) · **Status:** `Open`
- **Notes:** Rotate Clerk secret + publishable, Supabase anon **and** service-role, Groq API key. Update Vercel env + `frontend/.env.local`. Treat old keys as compromised.

---

# High Priority Issues (P1)

### P1-1 — `tierFromNotation()` mis-tiers `O(n log n)` and `O(n²)` — ✅ Fixed

- **ID:** P1-1 · **Reporter:** Pre-beta audit · **Owner:** _unassigned_ · **Date:** 2026-06-13
- **Description:** `lib/complexity.ts:77-85` returns `good` for `O(n log n)` (the `/log/` branch is suppressed by `!/nlog/`) and `fair` for `O(n²)`, while the heuristic engine's `NOTATION_TIER` (`lib/analysis/engine.ts:35-43`) and `complexityTier()` classify them as `fair` and `poor`. The Groq provider builds tiers via `tierFromNotation`, so the **same Big-O class is colored/labeled differently** depending on whether the AI or the engine produced it.
- **Steps To Reproduce:** With a real `GROQ_API_KEY`, analyze a clearly `O(n²)` function; compare the verdict tier/color to the heuristic engine's result for the same code.
- **Expected Result:** Identical Big-O class → identical tier/label/color regardless of provider.
- **Actual Result:** AI `O(n²)` shows "Watch"/amber; engine `O(n²)` shows "Bottleneck"/orange. `O(n log n)` shows as "Good" via AI.
- **Severity:** P1 (core-feature credibility) · **Status:** `Fixed` (2026-06-13, this session)
- **Fix landed:** `tierFromNotation` (`lib/complexity.ts`) rewritten to mirror `complexityTier()` for every class — `n log n` → `fair` (checked before the bare-log branch), `^2`/`²`/`^3`+ → `poor`, base`^n`/`nⁿ`/`!` → `critical`, tolerating ASCII **and** unicode forms. A new unit test asserts `tierFromNotation` agrees with `complexityTier()` across all canonical classes (`tests/unit/complexity.test.ts`). No new deps, no schema change. **Still confirm once with a live `GROQ_API_KEY` during QA.**

### P1-2 — Low-contrast text tints fail WCAG AA on dark surfaces — ✅ Fixed

- **ID:** P1-2 · **Reporter:** Pre-beta audit · **Date:** 2026-06-13 · **Status:** `Fixed` (2026-06-13, this session)
- **Description:** `--text-muted` (`#556478`, ≈2.8:1) and `--text-faint` (`#3a4a5c`, ≈1.7–2.2:1) in `app/globals.css` were applied to genuinely informative text — list timestamps/language labels, input/select hints + placeholder, the analyzer char-count + "code never logged" line, the result "Heuristic engine · confidence N%" footer, danger-zone help — all below the 4.5:1 AA threshold for normal text.
- **Fix landed:** Raised `--text-muted` → `#8493ac` (≈5.4:1) and `--text-faint` → `#7c8aa3` (≈4.8:1), measured against `surface-panel`/`surface-card`; both now clear AA while preserving the muted→faint hierarchy. Single-file token change (`app/globals.css`).

### P1-3 — Analyzer result/error never announced to screen readers — ✅ Fixed

- **ID:** P1-3 · **Reporter:** Pre-beta audit · **Date:** 2026-06-13 · **Status:** `Fixed` (2026-06-13, this session)
- **Description:** `components/analyzer/results-panel.tsx` swapped idle/analyzing/done/error with no live region (only `aria-busy` on the skeleton). When the verdict appeared or analysis failed, screen-reader users got no announcement — the app's core output was not perceivable non-visually.
- **Fix landed:** Added two persistent visually-hidden regions to `ResultsPanel` — `role="status"`/`aria-live="polite"` announcing "Analysis complete. Time complexity …, space complexity …" on success and "Analyzing code…" during the run, plus a `role="alert"` region announcing failures. Covered by new tests in `tests/components/results-panel.test.tsx`.

### P1-4 — User-facing error states expose developer-only / raw DB text — ✅ Fixed

- **ID:** P1-4 · **Reporter:** Pre-beta audit · **Date:** 2026-06-13 · **Status:** `Fixed` (2026-06-13, this session)
- **Description:** `dbError()` (`lib/db/admin.ts`) returned the raw Postgres/PostgREST `error.message`, rendered verbatim on `/analyses`, `/analyses/[id]`, `/snippets`, `/settings/profile` and in the dashboard banner. Error-state hints also told end users to "apply supabase/migrations and check the Supabase env vars". With the prod migration possibly unapplied (P0-1), real users could see internal text like `relation "public.analyses" does not exist`.
- **Fix landed:** `dbError` now logs the raw provider detail **server-side only** (`console.error`) and returns the caller's friendly fallback to the UI (`Could not load your analyses.`, etc.); `PGRST116` not-found handling already runs before `dbError`, so it is unaffected. The three error-state pages' dev hint + the dashboard banner were rewritten to user-facing copy. Test updated in `tests/integration/db-admin.test.ts`.

### P1-5 — Analyzer route has no `loading.tsx` — ✅ Fixed

- **ID:** P1-5 · **Reporter:** Pre-beta audit · **Date:** 2026-06-13 · **Status:** `Fixed` (2026-06-13, this session)
- **Description:** `app/(app)/analyzer/page.tsx` awaits `getOrCreateProfile()` before render. Unlike dashboard/analyses/snippets/settings, the analyzer had no route `loading.tsx`, so on a cold/degraded DB the app's primary feature showed a blank content area until the profile resolved.
- **Fix landed:** Added `app/(app)/analyzer/loading.tsx` mirroring the workbench's two-pane layout (header selects + editor + footer skeleton on the left, idle-style results placeholder on the right), so first paint never blocks on the DB.

### P1-6 — Multi-tenant ownership boundary has no automated test (+ no DB RLS policy)

- **ID:** P1-6 · **Reporter:** Pre-beta audit · **Date:** 2026-06-13 · **Status:** `Open`
- **Description:** Per-user ownership is enforced **only** in app code (`.eq('profile_id', …)` on every `lib/db` query) — the migration enables RLS deny-by-default but **all user-scoped policies are commented out** (`init.sql:87-111`). There is also no test exercising the profile-scoped queries / `PGRST116` not-found mapping. Today every query is correctly scoped and no Server Action accepts a caller-supplied user/profile id (no known IDOR), but there is zero DB backstop and zero regression guard.
- **Severity:** P1 (defense-in-depth) · **Recommended fix:** (a) manual cross-account test (SEC-02/03) with two Google accounts is **mandatory** before beta; (b) add an integration test that fails if a `lib/db` path omits the scope; (c) longer-term, wire Clerk↔Supabase third-party auth and enable the RLS policies.

> Google SSO button (`google-auth-button.tsx`) — the recently-fixed "stuck spinner"
> regression (AUTH-04) — also has **no test**. Manual AUTH-03/04 is mandatory each
> cycle until covered. Tracked under Developer Experience below.

---

# Needs Improvement (P2)

### UI Improvements
- ✅ **Save success has no path to the saved item** — fixed: "View" link appears after "Saved"/"Snippet saved" (`save-actions.tsx`; actions now return `id`).
- ✅ **List deletes have no success confirmation** — fixed: `ConfirmDeleteButton` accepts a `successMessage` prop; wired to "Analysis deleted" / "Snippet deleted" in list views.

### UX Improvements
- ✅ **Empty code buffer disables Analyze with no explanation** — fixed: "Paste code to analyze" hint appears inline when the buffer is empty (`analyzer-workbench.tsx`).
- ✅ **"Delete all lab data" ends in a stranded state** — fixed: redirects to `/dashboard` 1.2s after deletion so a fresh profile is created (`danger-zone.tsx`).
- ✅ **Copy-to-clipboard fails silently** — fixed: shows an error toast when clipboard access is denied (`copy-button.tsx`).

### Accessibility Improvements
- **Consent dialog lacks a focus trap / Escape handling** (`consent-gate.tsx`) — keyboard/SR users can Tab behind the `aria-modal` overlay. Reuse the working trap from `mobile-nav.tsx`.
- **Interactive `Tag` is a click-only `<span>`** with no `role`/`tabIndex`/key handler (`tag.tsx`) — latent (only used non-interactively today).
- **Form save-state changes not announced** (`profile-form.tsx`) — add `aria-live`.

### Performance Improvements
- **Rate limiter is in-memory per serverless instance** (`lib/rate-limit.ts`) — limits are per warm instance, reset on cold start. Acceptable for beta; before public launch move the window to Upstash/Vercel KV behind the existing `rateLimit()` signature (call sites unchanged).
- **No platform-level body-size cap** on `/api/analyze` (only the in-handler 100k-char check after JSON parse).

### Mobile Improvements
- **Secondary icon buttons below the 44px touch target** — toast dismiss 24px (`toaster.tsx`), CopyButton 28px, IntroStrip dismiss 28px. Enlarge hit areas to ≥ 36px (ideally 44px).
- **Analyzer is a long scroll on phones** — tall editor then stacked results; save actions sit at the very bottom.

### Developer Experience Improvements
- **No CI** — quality gates run locally only; a contributor can push `main` (= deploy prod) without running them. Add a GitHub Actions gate (typecheck + lint + test + build).
- **Coverage gaps in beta-critical paths** — delete/settings Server Actions, `ConfirmDeleteButton`, `AnalyzerWorkbench` orchestration (double-trigger guard, Ctrl/⌘+Enter, language-preserves-buffer), Google SSO error reset, `logEvent` "code never logged" guarantee, and the exactly-100,000-char accept boundary all have **no automated test**. See `TESTING_READINESS_REPORT.md` → *Missing Coverage*.
- **Persisted analysis-result JSON rendered without shape validation** (`mappers.ts:63-69`) — a corrupt/legacy row throws in `ResultsPanel` instead of falling back. Add a lightweight runtime guard → treat invalid as `result=null`.

---

# Enhancement Ideas

| Feature | Business Value | Complexity | Priority |
|---|---|---|---|
| Streak / activity history chart (derive from existing `createdAt`; no new table) | Reinforces the "intuition that compounds" promise; daily-return hook | M (existing SVG/ProgressBar primitives) | Should |
| Rename / re-tag snippets at save time | "Library that compounds" gets unwieldy with auto-derived titles | S | Should |
| Cancel an in-flight analysis | Polish for slow Groq calls (mitigated today by 20s timeout + fallback) | S | Could |
| Tooltip on the disabled "Soon" Progress nav item | Sets expectations honestly for curious users | XS | Could |
| Lessons / quizzes / persisted skill mastery | Core PRD vision (§5) | L (needs content model + tables) | Deferred (post-beta) |
| Achievements / badges | Engagement/gamification | L (needs tables + content) | Deferred (post-beta) |

---

# Test Execution Log

> Tick each as you run it; record anomalies under **Notes**. Detailed steps for
> each line live in **`TEST_PLAN.md`** (referenced IDs in parentheses).
> Recommended order: **Consent → Auth → Analyzer → Analyses → Snippets →
> Dashboard → Settings → Errors/Security → Accessibility → Mobile**
> (see `TESTING_READINESS_REPORT.md` → *Recommended Test Order* for the rationale).

### Authentication
- [☑] Google Login (AUTH-03 — **regression-prone, untested**)
- [☑] Logout (AUTH-07)
- [☑] Session Persistence (AUTH-08)
- [☑] Unauthorized Access → redirect to `/sign-in` (AUTH-02)
- [X] Error States — failed SSO resets spinner + shows alert (AUTH-04 — **untested**)

**Notes:
1) ✅ Fixed: already-logged-in users visiting `/sign-in` or `/sign-up` are now redirected to `/dashboard` via a server-side `auth()` check.




---

### Analyzer
- [☑] Small Input (ANL-02)
- [☑] Large Input — accept at 100,000 chars; 413 above (EDG-01)
- [X] Invalid Code / empty buffer disables Analyze (ANL-04)
- [☑] AI Analysis (real `GROQ_API_KEY`) — **verify tier matches engine** _(P1-1 fixed + unit-guarded; confirm with a live key)_
- [X] AI Fallback to heuristic engine (ERR-05)
- [X] Timeout Handling (20s AbortController → fallback)
- [X] Rate Limiting — 20/min → 429 + Retry-After (SEC-06)
- [☑] Error Recovery (ERR-06)

**Pick:**
![alt text](image.png)
![alt text](image-1.png)
**Notes:
1. in testign i realisd the weebsite is allowing same user to run simutaliasy on scans
2. the auto compleat is only availabe to tpye script not for other languages
3. no rate limit i spamed same code to analise alot of time and it allowed and i evern trd by changing the code but still no limit or colldown 
4. allow users to name a custom code so i want if user bring their code pastes and then when use speses save and snipet or any make use to ask user for the name of the code.
5. i removes the curly brackes and it yet run not it was in java and that would be a major syntax error 
**

**Sugetion: this is a random suggetion that to make the side bar hiden just like how windows tasks bar is it goes but when coursor gone the it apeares again and make the logo of complxty lab in the tab to like how other apps here have:**
![alt text](image-2.png)

---

### Analyses
- [☑] Save (ANA-02)
- [☑] View detail (ANA-05)
- [☑] Delete — two-step + auto-disarm (ANA-07/08)
- [☑] Ownership — User B cannot see/open User A's analysis (SEC-02/03 — **mandatory, untested**)
- [X] Mobile layout (rows truncate; secondary columns hidden < sm)

**Notes:**

---

### Snippets
- [☑] Create (SNP-02)
- [☑] Edit — _N/A: snippets are create/view/delete only (no rename/tag UI)_
- [☑] Delete — two-step (SNP-06)
- [X] Visibility — tags hidden < sm; expand/collapse code
- [☑] Ownership — cross-account isolation (SEC-02/03)

**Notes:**

---

### Dashboard
- [☑] Stats — analyses/snippets/day-streak + this-week (DSH-03)
- [☑] Empty States — new account shows encouraging empty widgets (DSH-05)
- [☑] Navigation — Quick actions + Welcome CTAs
- [X] Mobile — 3-col → stacked
- [☑] Language mix shows **friendly labels** (C++/TypeScript) + accessible progress bars _(fixed this session)_

**Notes:**

---

### Accessibility
- [☑] Keyboard Navigation — skip links; Ctrl/⌘+Enter; **consent dialog focus trap (P2)**
- [ ] Screen Reader — **analyzer result/error announced via live regions (P1-3 fixed; confirm with a real SR)**
- [ ] Focus States — visible rings on all controls
- [ ] Color Contrast — **meta/hint text clears AA (P1-2 fixed; spot-check the raised tints)**

**Notes:**

---

### Mobile
- [ ] iPhone (375px) — drawer focus trap/restore (MOB-01..03)
- [ ] Android — analyzer editor height clamp; save reachable
- [ ] Tablet (768px) — gets the mobile drawer by design; touch targets ≥ 44px? (P2)

**Notes:**

---

# Final Sign Off

**Tester:** Tirth.M  **Date:** 14/06/2026

**Ready For Beta?**

- [ ] Yes
- [X] No

**Known Issues at sign-off:** _(carry over any still-Open P0/P1 from above)_

**Recommendations:**
1. Clear both P0s first: confirm prod migration applied (P0-1) + rotate all secrets (P0-2).
2. ✅ All P1 **code** fixes landed this session (tier mapping, a11y contrast + screen-reader announce, DB-error sanitization, analyzer `loading.tsx`). Remaining gating work is operational + manual (items 1, 3, 4).
3. Run the **mandatory manual** checks that have no automated guard: AUTH-03/04 (Google SSO) and SEC-02/03 (cross-account ownership).
4. Provision a **production** Clerk instance and add a CI gate before public launch.


