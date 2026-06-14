# ComplexityLab — UX Pre-Beta Review

> First-time-and-returning-user UX audit of every primary surface. Branch `main`
> · commit `6979624` · 2026-06-13. Companions: **`testing.md`** (QA hub) ·
> **`TESTING_READINESS_REPORT.md`** (risk/blockers) · **`TEST_PLAN.md`** (test
> cases).
>
> **Headline:** The product is honest, coherent, and well-stated — the landing
> page promises only shipped features, empty states are encouraging, loading
> skeletons mirror real layouts, and the mobile drawer is genuinely
> best-in-class. The friction that remains is mostly **missing feedback after
> actions** and a few **error/loading edge cases**, not broken flows.

---

# Must Fix Before Beta

### MF-1 — ✅ Fixed — End-user error/empty states exposed developer-only instructions & raw DB text
- **Where:** Analyses, Snippets, Settings/Profile error states + the Dashboard "Database unavailable" banner (`analyses/page.tsx`, `snippets/page.tsx`, `settings/profile/page.tsx`, `dashboard/page.tsx`).
- **Problem:** When the DB was unreachable — a *documented, likely-in-prod state until the migration is applied* — users were told to "apply supabase/migrations and check the Supabase env vars," and the dashboard rendered the raw error string verbatim. This was operator language + a backend-wiring leak shown to real users.
- **Fixed (this session):** `dbError` now logs the raw provider detail **server-side only** and returns the caller's friendly fallback to the UI; the three error-page hints + the dashboard banner were rewritten to user-facing copy ("Your data is temporarily unavailable — please refresh in a moment"). One change at the `dbError` source covered every surface. *(= P1-4 in the bug log.)*

### MF-2 — ✅ Fixed — Analyzer had no route-level loading state
- **Where:** `app/(app)/analyzer/page.tsx` (no `loading.tsx`).
- **Problem:** The analyzer is an async server component that awaits `getOrCreateProfile()` before rendering. Unlike every other app route, it had no skeleton, so on a cold or degraded DB the app's **primary, most-visited feature** showed a blank content area until the profile resolved — the worst first impression on the most important page.
- **Fixed (this session):** Added `app/(app)/analyzer/loading.tsx` mirroring the workbench's two-pane layout (header selects + editor + footer skeleton on the left, idle-style results placeholder on the right), so first paint never blocks on the DB. *(= P1-5.)*

> Both MF items were small and localized — **both landed this session**, closing the two pre-beta Must-Fixes.

---

# Should Improve

### SI-1 — Successful save gives no path to the saved item
- **Where:** Analyzer results panel (`save-actions.tsx`).
- The buttons flip to "Saved" / "Snippet saved" (good that it confirms), but there's no toast and **no link** to "View analysis" / "View in Analyses." The user must self-navigate to confirm what they just saved, breaking the save→review loop the product is built around. Add a "View" link or a success toast with an action.

### SI-2 — "Delete all lab data" ends in a stranded state
- **Where:** Settings → Account danger zone (`danger-zone.tsx:46-56`).
- After deletion the button becomes permanently disabled showing "Data deleted" and the user is left on the now-stale Account page — no success toast, no redirect. The destructive action feels unconfirmed. Fire a success toast and/or redirect to `/dashboard` (now in its clean empty state).

### SI-3 — Empty code buffer disables Analyze with no explanation
- **Where:** Analyzer (`analyzer-workbench.tsx:170,222`).
- A first-timer who clears the sample to paste their own code sees **two** greyed-out buttons ("Analyze" + "Run first analysis") and no hint. Add a short inline cue ("Paste code to analyze") when the buffer is empty.

### SI-4 — Copy-to-clipboard fails silently
- **Where:** `copy-button.tsx:32-34` (used on analysis detail + expanded snippets).
- On insecure contexts / denied permissions the catch leaves state unchanged, so the user clicks "Copy" and gets *zero* feedback. The toast system already exists — surface an error toast on catch so the action never appears to no-op.

### SI-5 — List deletes have no success confirmation
- **Where:** Analyses, Snippets (`confirm-delete-button.tsx:47-50`).
- Deletes only toast on *failure*; on success the row just vanishes via `revalidatePath`. For a destructive action a brief "Deleted" success toast would make the outcome explicit and match the detail-page delete (which redirects). Cheap — the toast provider is already mounted in the `(app)` layout.

### SI-6 — ✅ Fixed — Analyzer result/error is now announced to assistive tech
- **Where:** `results-panel.tsx`.
- **Fixed (this session):** `ResultsPanel` now carries a `role="status"`/`aria-live="polite"` region (announcing the verdict + "Analyzing code…" progress) and a `role="alert"` region (failures), so a keyboard/screen-reader user who triggers Analyze (incl. via Ctrl/⌘+Enter) hears the outcome. Covered by new tests. *(Also tracked as a11y P1-3 — it was both a UX and an accessibility gap.)*

---

# Nice To Have

### NTH-1 — Rename / tag snippets at save time
- Titles are auto-derived (first function name or first line, `analyzer/actions.ts:21-27`) and the "Save snippet" path always sends empty tags, so libraries of similarly-named helpers ("binarySearch()") become hard to scan and the tag UI on rows is always empty in practice. A rename/tag affordance would deliver on the "library that compounds" promise.

### NTH-2 — Tooltip on the disabled "Soon" Progress nav item
- The Progress item is an honest `aria-disabled` span with a "Soon" pill (`nav-list.tsx:50-58`) — good. A small `title`/tooltip ("Coming soon — lessons & progress tracking") would set expectations for users who hover it. (Also helps screen-reader users, who currently can't focus the span to discover the "Soon" label.)

### NTH-3 — Cancel an in-flight analysis
- Once analysis starts the button reads "Analyzing…" and is disabled with no cancel. Minor — the min-scan floor + 20s timeout + heuristic fallback keep waits short.

### NTH-4 — Stale "mock data" comment in the dashboard *(fixed this session)*
- `welcome-card.tsx` claimed "the rest of the dashboard is mock data." It is real Supabase-derived data. Comment corrected during the progress pass so future contributors don't reintroduce fake data.

### NTH-5 — Language-mix labels & accessible progress bars *(fixed this session)*
- Language-mix bars showed raw ids ("cpp"); they now render friendly labels ("C++") and the `ProgressBar` primitive now exposes `role="progressbar"` + `aria-valuenow/min/max` + an accessible name.

---

# Per-Page Notes

### Landing (`app/page.tsx`)
- **First-time:** Strong. Every claim maps to a shipped feature — "18 curated samples," "7 languages," heuristic fallback, save/revisit, "streaks and language stats" — and the *How it works* section is explicitly scoped to shipped behavior. Honesty principle upheld.
- **Friction:** Three CTAs ("Start analyzing" / "Get started free" / "Get started") all route to `/sign-up`; fine, but a returning user's only path *in* is the small header "Sign in."
- **Empty/Loading:** N/A (static). **Mobile:** responsive grid collapses cleanly; 3D card + gradient band stack.

### Analyzer
- **First-time:** `IntroStrip` explains load→analyze→save with the Ctrl/⌘+Enter shortcut; a sample is preloaded so the first Analyze always works. Excellent first-run path.
- **Feedback:** Analyze itself is well-feedbacked ("Analyzing…" + sweep + skeleton → verdict; errors → `ErrorState`). Gaps: empty-buffer has no hint (SI-3), save success has no view link (SI-1). Result/error now announced to SRs (SI-6 fixed).
- **Loading:** Excellent *within* the client flow; **route-level `loading.tsx` added** (MF-2 fixed). **Mobile:** editor height clamped (`clamp(300px,55dvh,460px)`); single-column until xl → heavy but workable scroll; save actions sit at the very bottom.

### Dashboard
- **First-time:** Greets by first name; Recent/Saved/Progress all degrade to encouraging empty states with "Open analyzer" CTAs — a clean, honest zero-data experience.
- **Friction:** DB-error banner now shows friendly copy (MF-1 fixed). Welcome card + Quick actions overlap destinations (fine for a hub).
- **Loading:** `dashboard/loading.tsx` mirrors the layout; WelcomeCard is Suspense-wrapped. **Mobile:** 3-col → stacked. Progress overview now shows friendly labels + accessible bars.

### Analyses (list + detail)
- **Empty/Not-found:** Clear list empty state with CTA; detail handles not-found / wrong-owner with a sensible hint. **Loading:** both list and detail `loading.tsx` exist and match.
- **Friction:** list delete has no success toast (SI-5); error hint now user-facing (MF-1 fixed); copy can fail silently (SI-4). **Mobile:** secondary columns (space badge, verdict) hidden < sm to reduce clutter — reasonable.

### Snippets
- **Feedback:** expand/collapse is well-feedbacked (chevron rotates, `aria-expanded`); copy + open-in-analyzer present (copy silent-fail risk, SI-4).
- **Friction:** auto-derived titles only, no rename/tag (NTH-1); delete has no success toast (SI-5); error hint now user-facing (MF-1 fixed). **Mobile:** tags hidden < sm; expanded code is scrollable.

### Settings (Profile + Account)
- **Feedback:** Profile save is well-handled ("Saving…" → "Saved" + check, auto-reset, inline errors). Danger zone is a two-step arm with 4s disarm but no success confirmation and a stranded end state (SI-2).
- **First-time:** Profile prefilled from the Google name with helpful hint copy. **Profile error path** now shows friendly copy (MF-1 fixed).

### Auth (sign-in / sign-up)
- **Feedback:** `GoogleAuthButton` correctly handles the Clerk `sso() → {error}` contract: shows "Redirecting to Google…", and on error resets loading + shows a `role="alert"` message. Solid. *(But it has no automated test — manual AUTH-03/04 mandatory each cycle.)*
- **Friction:** Google-only, no email fallback — acceptable for beta, but a single point of failure if Google OAuth is misconfigured. Landing's "Sign in with Google · No credit card" matches reality.

### Shell / Navigation (sidebar, topbar, mobile-nav)
- **Strength:** `MobileNav` is the accessibility high-water mark of the app — focus trap, Escape to close, body-scroll lock, focus restoration, backdrop click, closes on navigate, `aria-label`/`aria-expanded` on the hamburger.
- **Honesty:** "Free plan · early access" badge and the disabled "Soon" Progress item set honest expectations (NTH-2 would polish it). Active route via `aria-current`.

---

## Summary scoreboard

| Bucket | Count | Notes |
|---|:---:|---|
| Must Fix Before Beta | 0 | **MF-1 + MF-2 both fixed this session** |
| Should Improve | 6 | SI-6 (SR announce) fixed; 5 post-action feedback gaps remain |
| Nice To Have | 5 | 2 already fixed this session |

**UX readiness: ~90%.** No broken flows; the product reads as finished and
honest. Both Must-Fixes and the screen-reader-announce gap closed this session;
the remaining Should-Improve items are post-action feedback polish (save→view
link, success toasts, silent copy-fail) — none launch-blocking.
