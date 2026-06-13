# ComplexityLab — Testing Readiness Report

> **Pre-beta audit.** Branch `main` · commit `6979624` · 2026-06-13. Produced by
> a 6-agent parallel audit (progress, security/API, features, UX,
> accessibility/mobile, test coverage), cross-checked against the source.
> Companions: **`testing.md`** (QA tracking hub) · **`TEST_PLAN.md`** (manual
> test cases) · **`UX_PRE_BETA_REVIEW.md`** (UX detail).
>
> **Quality gates (verified this commit):** `typecheck` 0 errors · `lint` clean ·
> `test` 24 files / 153 tests pass · `build` green (16/16 routes). Gates run
> **locally only** — no CI.

---

# Ready For Testing

These systems are code-complete, build clean, and can be exercised in a QA cycle
**as soon as a working DB + signed-in session exist in the target environment.**

| System | State | Why it's ready |
|---|:---:|---|
| **Authentication (Clerk)** | ✅ Ready | Route protection (`proxy.ts`) + independent 401 re-check in `/api/analyze`. Branded `/sign-in`. SSO callback forces `/dashboard`. *(Op note: still a `pk_test` dev instance.)* |
| **Analyzer flow + `/api/analyze`** | ✅ Ready | Auth → rate-limit → validate (empty / 100k cap / language allowlist) → provider → generic 500. Idle/analyzing/error/done states; Ctrl/⌘+Enter (window + Monaco); min-scan anti-flash. DB-independent. *P1-1 tier mismatch fixed this session — AI verdicts now match the engine.* |
| **AI provider + heuristic fallback** | ✅ Ready | Env-driven registry; Groq falls back to the deterministic engine on every failure mode (no/placeholder key, non-200, empty, unparseable, network, 20s timeout) with an honest note. Scaffolded providers never exposed in UI. Code never logged. |
| **Saved Analyses (list + detail + delete)** | ✅ Ready | Profile-scoped, ordered, limited; distinct error/empty/loading states; not-found via `PGRST116`; two-step ownership-scoped delete with `revalidatePath`. |
| **Snippets (list + inline view + delete)** | ✅ Ready | Profile-scoped; expandable code; copy + open-in-analyzer; two-step delete. |
| **Dashboard (stats + readouts)** | ✅ Ready | Parallel fetch with graceful degrade + banner; real, pure-function stats (totals, this-week, day-streak, language mix); honest empty states. Progress polish landed this session. |
| **Settings (profile + account + danger zone)** | ✅ Ready | Validated/clamped inputs; idle/saving/saved/error; real Clerk identity; rate-limited two-step destructive wipe (3/hr). |
| **Consent flow + legal pages** | ✅ Ready | Versioned first-party cookie; `/privacy` + `/terms` exempt; comprehensive, honest policies. *(Op note: client-side UX, not an access control.)* |
| **Error / empty / loading states** | ✅ Ready | Route `loading.tsx` for dashboard/analyses/detail/settings **and now analyzer** (P1-5 fixed this session); segment error boundary; consistent `EmptyState`/`ErrorState`. |
| **Reduced motion** | ✅ Ready | `prefers-reduced-motion` honored globally; status always conveyed by text, not motion alone. |
| **Mobile layout + drawer** | ✅ Ready | Desktop-only sidebar + slide-over drawer with focus trap, Escape, scroll-lock, focus restore; dvh-clamped editor; `overflow-x-hidden`. |
| **Focus states** | ✅ Ready | Consistent `focus-visible` rings across all controls; no suppressed outlines. |

**Automated test coverage that backs the above** (24 files / 153 tests, all green):
analysis engine (data-driven across all languages), provider registry + Groq
parse/fallback, `/api/analyze` (401/400/413/429/200), save Server Actions,
route-protection matcher, DB admin config + error shaping, row mappers, dashboard
stats, rate limiter, analyzer handoff, time formatting, UI primitives + readouts,
consent gate, nav, snippet item, intro strip.

---

# Risks

Ordered by severity. (Full repro/fix detail in `testing.md` bug log.)

### Correctness
- **✅ RESOLVED (this session) — `tierFromNotation()` mis-tiered `O(n log n)` / `O(n²)`** (`lib/complexity.ts`). Rewritten to mirror `complexityTier()` for every Big-O class (ASCII **and** unicode), so Groq-produced verdicts now agree with the heuristic engine. Guarded by a new unit test asserting agreement across all canonical classes. *(Confirm once with a live `GROQ_API_KEY` during QA.)*
- **P2 — Persisted result JSON rendered without validation** (`mappers.ts:63-69`). A corrupt/legacy `result` row throws inside `ResultsPanel` and trips the error boundary instead of the graceful `result=null` fallback. Low likelihood (all writes are full payloads) but one bad row breaks its detail page.

### Security / Privacy
- **P0 (operational) — Prod DB migration may be unapplied** → all persistence broken in prod; if tables exist *without* RLS, the anon key could read rows.
- **P0 (operational) — Leaked secrets never rotated** → the service-role key bypasses RLS and is the sole barrier protecting all data.
- **P1 — Authorization is 100% application-layer** — RLS is enabled deny-by-default but **all policies are commented out** (`init.sql:87-111`). Watertight today (every query scoped; no caller-supplied identity), but a single future unscoped service-role query exposes all tenants with no DB backstop.
- **✅ RESOLVED (this session) — User-facing surfaces leaked raw DB error text + dev-only "apply supabase/migrations" hints** (`dbError`, `lib/db/admin.ts`). `dbError` now logs the raw detail server-side only and returns the friendly fallback; the page hints + dashboard banner were rewritten to user-facing copy.
- **P2 — Rate limiting is in-memory per instance** (`lib/rate-limit.ts`) — per warm-instance, resets on cold start; not a global cap. Stops single-client bursts; insufficient against a distributed abuser at public scale.

### Accessibility
- **✅ RESOLVED (this session) — Low-contrast meta/hint text** — `--text-muted`/`--text-faint` raised to `#8493ac`/`#7c8aa3` (≈5.4:1 / ≈4.8:1 on `surface-panel`), now clearing WCAG AA.
- **✅ RESOLVED (this session) — Analyzer result/error not announced** — `ResultsPanel` now carries `role="status"`/`aria-live="polite"` (verdict + progress) and `role="alert"` (failure) live regions; covered by tests.
- **P2 — Consent dialog lacks focus trap / Escape**; **P2 — several icon buttons < 44px touch target**; **P2 — interactive `Tag` not keyboard-operable** (latent).

### UX
- **✅ RESOLVED (this session) — Analyzer route had no `loading.tsx`** — added `app/(app)/analyzer/loading.tsx` mirroring the workbench, so the primary page never shows a blank area on a cold/degraded DB.
- **P2 cluster** — save success offers no link to the saved item; empty-buffer disables Analyze with no hint; list deletes give no success toast; copy fails silently; "Delete all data" ends stranded. (See `UX_PRE_BETA_REVIEW.md`.)

### Process
- **No CI** — gates run locally only; pushing `main` deploys prod. A contributor can ship without running them.

---

# Missing Coverage

Automated tests are strong on **pure logic + presentational** code but absent on
several **beta-critical** paths. Green CI therefore gives *false confidence* in:

| Area | What's untested | Severity |
|---|---|:---:|
| **DB ownership scoping** | `profile_id`-scoped queries in `lib/db/{analyses,snippets,profiles}.ts`; `PGRST116` not-found mapping. The core multi-tenant boundary (SEC-02/03) rests entirely on manual QA + (currently inactive) RLS. | **P0-gap** |
| **Delete / settings Server Actions** | `deleteAnalysisAction`, `deleteSnippetAction`, `deleteAllDataAction`, `updateProfileAction` — rate-limit branches, missing-id rejection, `revalidatePath` fan-out, DB-error surfacing. (Save actions *are* tested; the delete side was skipped.) | P1 |
| **Google SSO button** | `google-auth-button.tsx` — the exact recently-fixed "stuck spinner" regression (AUTH-04): `sso()` resolves with `{error}` not throw, so the button must reset loading + show `role="alert"`. | P1 |
| **`ConfirmDeleteButton`** | Two-step arm/disarm, 3s auto-disarm, disarm-on-blur, pending, toast-on-failure. Reused across analyses + snippets. | P1 |
| **`AnalyzerWorkbench` orchestration** | Double-trigger guard (ANL-09), Ctrl/⌘+Enter window handler, language-switch-preserves-buffer, sample selection, analyzed-snapshot vs later-edit save semantics, fetch error path. Mock `fetch` to cover without Monaco. | P1 |
| **Settings input normalization** | `displayName` trim/cap (80) + `preferredLanguage` fallback. Pure + easily testable. | P1 |
| **`ProfileForm` / `DangerZone`** | Save-state machine + delete-all confirmation flow. | P2 |
| **DB-unavailable page rendering** | The dashboard banner + graceful empty widgets at the page level (only `db-admin` config guards are tested). | P2 |
| **`logEvent` privacy guarantee** | No test asserts the logged payload excludes the submitted `code` (SEC-04). | P2 |
| **100,000-char accept boundary** | 413 at 100,001 is tested; 200 at exactly 100,000 is not (EDG-01). One-line add. | P2 |
| **Theme toggle persistence / Mobile drawer behavior** | `localStorage` theme (EDG-10); drawer focus trap/scroll-lock/restore — manual only (jsdom limits). | P2 |

---

# Recommended Test Order

Dependency-ordered so each step's prerequisites already pass. (Rationale
condensed; IDs map to `TEST_PLAN.md`.)

1. **Consent (CON-01..06)** — a blocking dialog covers every non-legal page on first visit; until `cl-consent=v1` is set nothing else is reachable. Fast (well-covered automatically).
2. **Authentication (AUTH-01..09)** — gates all protected routes. **Prioritize AUTH-03/04** (Google sign-in completes / error resets the spinner): recently-fixed regression with **zero** automated coverage and on the critical path to everything.
3. **Analyzer (ANL-01..11)** — the core feature and the producer of all downstream data. Workbench client orchestration is untested; manual QA must carry it. **While here, verify P1-1**: AI vs heuristic tier agreement.
4. **Analyses (ANA-01..10) + cross-account isolation (SEC-02/03)** — needs a saved analysis. Pair functional checks with the **mandatory** two-account ownership test (the P0 untested boundary). Exercise `ConfirmDeleteButton` two-step + auto-disarm.
5. **Snippets (SNP-01..06)** — same save/delete/ownership machinery; confirms the shared delete path behaves identically.
6. **Dashboard (DSH-01..06)** — read-only aggregation; needs data from steps 3–5. Verify the DB-unavailable banner via a forced bad-Supabase-env build.
7. **Settings (EDG-08/09, SEC-08, SEC-10)** — run late: `deleteAllDataAction` is destructive and wipes the data from steps 3–5. Validate name trim/cap, preferred-language→analyzer default, delete-all rate limit, then SEC-10 (wipe clears data but not the Google identity) last.
8. **Errors + Security probes (ERR-01..11, SEC-01/04/05/06/07/09)** — API/infra-level (curl probes, log + bundle inspection), independent of UI state. Confirm SEC-04 (code never logged) against real logs.
9. **Accessibility spot-checks (A11Y-01..03)** — run on now-working flows: keyboard-only sign-in → analyze (Ctrl+Enter) → save → delete; verify analyzer announcement (P1-3) and consent focus (P2).
10. **Mobile (MOB-01..07)** — last; re-traverse verified flows at 375/768px so layout bugs aren't conflated with logic bugs.

---

# Beta Blockers

**Must be cleared before a public beta launch:**

1. **[P0] Apply the production DB migration** and verify `profiles`/`analyses`/`saved_snippets` exist **with RLS enabled** in project `hhnmxyyrihrpyerdmgdw`. Confirm a real save+reload as a user. *(Owner: project owner — MCP account cannot reach this project.)*
2. **[P0] Rotate all leaked secrets** — Clerk secret + publishable, Supabase anon **and** service-role, Groq key; update Vercel + `.env.local`; treat old keys as compromised.
3. **[P1] Pass the two mandatory manual checks that have no automated guard:** AUTH-03/04 (Google SSO completes + error resets spinner) and SEC-02/03 (cross-account ownership isolation, two Google accounts).
4. **[P1] ✅ DONE — `tierFromNotation` fixed** so AI and heuristic verdicts agree; consistency unit test added this session. *(No longer launch-gating.)*

**Strongly recommended before public launch (not strictly launch-gating for a controlled/invite beta):**

5. **[P1] ✅ DONE — Accessibility:** `--text-muted`/`--text-faint` lifted to AA; `aria-live`/`role="alert"` announcements added to the analyzer result/error. *(No longer launch-gating.)*
6. **[P1] ✅ DONE — DB errors sanitized** (raw text + the "apply supabase/migrations" hint removed from the user view) and analyzer `loading.tsx` added. *(No longer launch-gating.)*
7. **[P1] Provision a production Clerk instance** (replace `pk_test`/accounts.dev).
8. **[Process] Add a CI gate** (typecheck + lint + test + build) — pushing `main` deploys prod.
9. **[P1] Move rate limiting to a shared store** (Upstash/Vercel KV) before scale; **back-fill the missing tests** above (ownership scoping, delete/settings actions, Google SSO, `ConfirmDeleteButton`, workbench).

**Explicitly NOT blockers** (correctly deferred, no phantom UI): lessons/quizzes,
persisted skill mastery, achievements — all require new tables/content model and
are honestly absent from the product today.

---

# Confidence Assessment

- **Confidence the app is ready to *begin* a structured QA cycle: 88%.** It is
  code-complete, builds clean, has a strong automated base (153 tests), honest
  states throughout, and a detailed manual test plan. The only thing standing
  between "now" and "QA can start" is a working DB + session in the target
  environment.

- **Confidence the app is ready for *public* beta launch right now: ~80%.**
  All P1 **code** fixes — tier mapping, a11y contrast + screen-reader announce,
  DB-error sanitization, and the analyzer `loading.tsx` — landed this session.
  The remaining gates are the two operational P0s (migration, key rotation) and
  the mandatory manual passes (AUTH-03/04, SEC-02/03). Once the P0s are verified
  resolved, projected launch confidence is ~90%.

**Per-domain confidence** (post-fix this session): Progress 90% · Features 86% ·
Tests 88% · UX 90% · Security 72% · Accessibility 90%. **Security is now the clear
floor** — the two unverified operational P0s are the dominant remaining risk.
Accessibility rose sharply once the contrast + screen-reader-announce P1s landed;
UX rose once the analyzer loading state + DB-error sanitization landed.

> **Bottom line:** The codebase is in good, honest shape and is ready to be
> tested hard. It is **not** yet ready to be opened to the public until the two
> operational P0s are verified resolved and the P1 fixes land. Treat the green
> local quality gates as proof that *analysis correctness and UI rendering* are
> well-protected — **not** as proof that multi-tenant security, auth
> regressions, destructive delete flows, or mobile/a11y behavior are; those rest
> on manual QA today.
