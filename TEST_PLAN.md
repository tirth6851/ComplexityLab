# TEST_PLAN.md — ComplexityLab Manual QA Checklist

> **Scope:** End-to-end manual QA for the shipped ComplexityLab web app
> (Next.js App Router + Clerk + Supabase + Groq/heuristic AI). Derived from a
> repository audit on 2026-06-13. Covers Authentication, Analyzer, Analyses,
> Snippets, Dashboard, Consent flow, Mobile responsiveness, Security, Error
> handling, and Edge cases.
>
> **How to use:** Work top to bottom. Each case lists **Preconditions**,
> **Steps**, **Expected result**, and a **Result** field. Mark `☐ Pass` /
> `☐ Fail` and record anything surprising under **Notes**. File a bug for every
> Fail with the case ID (e.g. `AUTH-03`).

---

## Environment & test data

| Item | Value |
| --- | --- |
| Production URL | https://complexity-lab-eight.vercel.app |
| Local dev | `cd frontend && npm run dev` → http://localhost:3000 |
| Auth | Clerk, **Google OAuth only** (no email/password) |
| Protected routes | `/dashboard`, `/analyzer`, `/analyses`, `/snippets`, `/settings` (+children) |
| Public routes | `/`, `/sign-in`, `/sign-up`, `/sso-callback`, `/privacy`, `/terms` |
| Languages | TypeScript, JavaScript, Python, Java, Go, Rust, C++ |
| AI provider | Groq if `GROQ_API_KEY` set, else deterministic heuristic (“mock”); Groq falls back to heuristic on failure |
| Key limits | analyze 20/min; save analysis/snippet 20/min; delete 60/min; update profile 10/min; delete-all-data 3/hour; max code 100,000 chars |

**Recommended accounts:** two distinct Google accounts — **User A** (primary)
and **User B** (for cross-account isolation tests).

**Test snippets to keep handy:**
- *Tiny:* `const x = 1;`
- *Nested loop (O(n²)):* a function with two nested `for` loops.
- *Empty:* whitespace only.
- *Oversized:* a buffer > 100,000 characters (e.g. paste a long string ×).

---

## 1. Authentication

### AUTH-01 — Landing page reachable when signed out
- **Preconditions:** Signed out; consent already accepted (or accept it first).
- **Steps:** Visit `/`.
- **Expected:** Marketing landing renders (hero, “How it works”, features, footer). Header shows **Sign in** and **Get started**. No redirect to sign-in.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### AUTH-02 — Protected route redirects when signed out
- **Preconditions:** Signed out.
- **Steps:** Navigate directly to `/dashboard` (repeat for `/analyzer`, `/analyses`, `/snippets`, `/settings`).
- **Expected:** Each redirects to the branded `/sign-in` page (not Clerk’s hosted `accounts.dev` page).
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### AUTH-03 — Google sign-in completes (regression: stuck spinner)
- **Preconditions:** Signed out; Google provider enabled in Clerk dashboard.
- **Steps:** Go to `/sign-in` → click **Continue with Google** → pick a Google account.
- **Expected:** Button shows “Redirecting to Google…”, browser redirects to Google, returns to `/sso-callback` (“Completing sign-in…”), then lands on `/dashboard`. Spinner never hangs indefinitely.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### AUTH-04 — Sign-in error surfaces instead of hanging
- **Preconditions:** Force a failure (e.g. cancel the Google consent screen, or test on an instance where Google is misconfigured).
- **Steps:** Start Google sign-in and cancel/deny at Google, or trigger an OAuth error.
- **Expected:** The button resets out of the loading state and an inline error (red text, `role="alert"`) appears under the button — it does **not** stay stuck on “Redirecting to Google…”.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### AUTH-05 — Sign-up path
- **Preconditions:** Signed out; use a Google account with no existing ComplexityLab profile.
- **Steps:** Go to `/sign-up` → **Continue with Google** → complete OAuth.
- **Expected:** Account is created and user lands on `/dashboard`. A profile row is created on first authenticated visit.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### AUTH-06 — Sign-in ⇄ sign-up cross links
- **Preconditions:** On `/sign-in`.
- **Steps:** Click “Create an account” → confirm `/sign-up`. From `/sign-up` click “Sign in” → confirm `/sign-in`.
- **Expected:** Links navigate correctly between the two pages.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### AUTH-07 — Sign out
- **Preconditions:** Signed in, on any app page.
- **Steps:** Click the Clerk **UserButton** (top-right) → **Sign out**.
- **Expected:** Session ends; `afterSignOutUrl` returns user to `/`. Re-visiting a protected route redirects to `/sign-in`.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### AUTH-08 — Session persistence
- **Preconditions:** Signed in.
- **Steps:** Refresh the page; close and reopen the tab; reopen the app.
- **Expected:** User remains signed in; no re-auth required.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### AUTH-09 — Already-signed-in user visiting auth pages
- **Preconditions:** Signed in.
- **Steps:** Manually visit `/sign-in` and `/sign-up`.
- **Expected:** App behaves sensibly (either redirects into the app or shows the auth shell without breaking). No crash/loop.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

---

## 2. Analyzer

### ANL-01 — Analyzer loads with default buffer
- **Preconditions:** Signed in.
- **Steps:** Open `/analyzer`.
- **Expected:** Workbench renders with Language = user’s preferred language (default TypeScript), a sample pre-loaded in the editor, char counter, and an empty results panel with a “Run first analysis” CTA.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANL-02 — Run an analysis (happy path)
- **Preconditions:** On `/analyzer` with non-empty code.
- **Steps:** Click **Analyze**.
- **Expected:** Button shows “Analyzing…”, a scan animation sweeps the editor for ≥ ~650 ms, then the results panel shows time + space complexity, gauges, growth curve, and verdict. **Save analysis** / **Save snippet** buttons appear.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANL-03 — Keyboard shortcut Ctrl/⌘+Enter
- **Preconditions:** On `/analyzer` with non-empty code.
- **Steps:** Press Ctrl+Enter (Windows/Linux) or ⌘+Enter (Mac), both with the editor focused and with focus elsewhere on the page.
- **Expected:** Analysis triggers in both cases (Monaco registers its own command; window-level handler covers the rest).
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANL-04 — Analyze disabled on empty buffer
- **Preconditions:** On `/analyzer`.
- **Steps:** Clear the editor (whitespace only). Observe the **Analyze** button and the idle CTA.
- **Expected:** **Analyze** and **Run first analysis** are disabled; char counter shows 0. Shortcut does nothing.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANL-05 — Language switch preserves code
- **Preconditions:** Edit the buffer so it differs from any sample.
- **Steps:** Change the **Language** dropdown.
- **Expected:** The code buffer is **not** cleared/overwritten; only syntax highlighting changes. Sample selector resets to “Load a sample…”.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANL-06 — Sample loading
- **Preconditions:** On `/analyzer`.
- **Steps:** For each language, open the **Sample** dropdown and pick each sample.
- **Expected:** Selecting a sample replaces the buffer with that sample’s code. All 7 languages have samples (18 total advertised). No empty/broken entries.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANL-07 — All languages analyze
- **Preconditions:** On `/analyzer`.
- **Steps:** For each of the 7 languages, load a sample and Analyze.
- **Expected:** Each returns a valid complexity verdict without error.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANL-08 — Char counter accuracy
- **Preconditions:** On `/analyzer`.
- **Steps:** Type/paste and watch the “N chars” counter.
- **Expected:** Counter matches the buffer length and updates live.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANL-09 — Double-trigger guard
- **Preconditions:** On `/analyzer`.
- **Steps:** Click **Analyze** rapidly multiple times (or spam the shortcut).
- **Expected:** Only one analysis runs while status is “analyzing”; no duplicate/overlapping requests.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANL-10 — Privacy reassurance copy present
- **Preconditions:** On `/analyzer`.
- **Steps:** Read the editor footer.
- **Expected:** Shows “analyzed server-side · code never logged”.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANL-11 — Open-in-analyzer handoff
- **Preconditions:** Have a saved analysis or snippet.
- **Steps:** From a snippet/analysis, click **Open in analyzer**.
- **Expected:** `/analyzer` opens with that code + language loaded (replacing the default sample once on mount).
- **Result:** ☐ Pass ☐ Fail — **Notes:**

---

## 3. Analyses

### ANA-01 — Empty state
- **Preconditions:** Signed-in account with no saved analyses.
- **Steps:** Open `/analyses`.
- **Expected:** Empty state: “No analyses saved yet” with an **Open analyzer** action.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANA-02 — Save an analysis
- **Preconditions:** On `/analyzer` with a completed analysis.
- **Steps:** Click **Save analysis**.
- **Expected:** Button → “Saving…” → “Saved” (check icon). Analysis now appears at the top of `/analyses` and in dashboard “Recent analyses”.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANA-03 — Auto-derived title
- **Preconditions:** Analyze code whose first function is e.g. `quickSort`.
- **Steps:** Save the analysis; view `/analyses`.
- **Expected:** Title is `quickSort()` (first declared function) — or, if no function, the first non-empty line truncated to 60 chars.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANA-04 — List renders correctly
- **Preconditions:** Several saved analyses.
- **Steps:** Open `/analyses`.
- **Expected:** Each row shows title, language, relative time, time/space complexity badges, and (on ≥ sm) the verdict line. Newest first.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANA-05 — Detail view
- **Preconditions:** At least one saved analysis.
- **Steps:** Click a row → `/analyses/[id]`.
- **Expected:** Header (title, language, time, badges), source code block with line count + copy, and full results panel. If no stored result: a fallback card with “Re-analyze in editor”.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANA-06 — Copy source from detail
- **Preconditions:** On an analysis detail page.
- **Steps:** Click the copy button on the source block.
- **Expected:** Source copied to clipboard; copy affordance confirms.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANA-07 — Delete from list (two-step)
- **Preconditions:** A saved analysis in the list.
- **Steps:** Click the trash button (arms → “Sure?”), then click again to confirm.
- **Expected:** First click arms (disarms after ~3 s or on blur); second click deletes the row. It disappears and the dashboard count updates.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANA-08 — Delete arm auto-disarms
- **Preconditions:** A saved analysis in the list.
- **Steps:** Click trash once (armed), wait ~3 s without a second click, or click elsewhere (blur).
- **Expected:** Button reverts to unarmed; nothing is deleted.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANA-09 — Delete from detail redirects
- **Preconditions:** On an analysis detail page.
- **Steps:** Use the delete control and confirm.
- **Expected:** Analysis deleted and user is redirected back to `/analyses`; the item is gone.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ANA-10 — Re-open in analyzer from detail
- **Preconditions:** On an analysis detail page.
- **Steps:** Click **Open in analyzer**.
- **Expected:** `/analyzer` loads with that analysis’s code + language.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

---

## 4. Snippets

### SNP-01 — Empty state
- **Preconditions:** Account with no snippets.
- **Steps:** Open `/snippets`.
- **Expected:** Appropriate empty state with a path to the analyzer.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### SNP-02 — Save a snippet
- **Preconditions:** On `/analyzer` with a completed analysis.
- **Steps:** Click **Save snippet**.
- **Expected:** Button → “Saving…” → “Snippet saved”. Appears in `/snippets` and dashboard “Saved snippets”.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### SNP-03 — Expand / collapse code
- **Preconditions:** At least one snippet.
- **Steps:** Click the snippet title row.
- **Expected:** Inline code view expands (chevron rotates, `aria-expanded` toggles); clicking again collapses it.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### SNP-04 — Copy & open-in-analyzer from snippet
- **Preconditions:** A snippet expanded.
- **Steps:** Use **Copy** and **Open in analyzer**.
- **Expected:** Copy puts code on clipboard; open loads it into `/analyzer`.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### SNP-05 — Tags display (desktop only)
- **Preconditions:** A snippet that has tags.
- **Steps:** View on desktop (≥ sm) then narrow to mobile.
- **Expected:** Tags show on ≥ sm; hidden on small screens (no layout break either way).
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### SNP-06 — Delete snippet (two-step)
- **Preconditions:** A snippet in the list.
- **Steps:** Trash → arm → confirm.
- **Expected:** Snippet removed; dashboard count updates.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

---

## 5. Dashboard

### DSH-01 — Welcome card
- **Preconditions:** Signed in.
- **Steps:** Open `/dashboard`.
- **Expected:** Welcome card renders (skeleton briefly via Suspense, then greeting using display name or Google name).
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### DSH-02 — Recent analyses & snippets widgets
- **Preconditions:** Account with > 5 analyses and > 5 snippets.
- **Steps:** View dashboard.
- **Expected:** “Recent analyses” shows the 5 newest; “Saved snippets” shows 5 newest. Links open the respective items.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### DSH-03 — Progress overview / language mix
- **Preconditions:** Several analyses across languages.
- **Steps:** View the Progress Overview panel.
- **Expected:** Stats (counts/streaks) and a language-mix breakdown reflect actual saved data.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### DSH-04 — Quick actions
- **Preconditions:** On dashboard.
- **Steps:** Use each quick action link/button.
- **Expected:** Each routes to the correct destination (e.g. analyzer).
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### DSH-05 — Empty/new account dashboard
- **Preconditions:** Brand-new account (no data).
- **Steps:** Open dashboard.
- **Expected:** Widgets show graceful empty states; no errors; stats show zeros.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### DSH-06 — Database-unavailable banner
- **Preconditions:** Simulate DB failure (e.g. bad Supabase env in a local/staging build).
- **Steps:** Open dashboard.
- **Expected:** Amber “Database unavailable. Showing empty data — <reason>” banner; the page still renders with empty widgets rather than crashing.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

---

## 6. Consent flow

### CON-01 — Gate blocks first visit
- **Preconditions:** Fresh browser (no `cl-consent` cookie). Signed out is fine.
- **Steps:** Visit `/` (or any non-legal page).
- **Expected:** Blocking consent dialog (“Before you enter the lab”) covers the page; underlying UI not interactive.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### CON-02 — Accept persists
- **Preconditions:** Consent dialog showing.
- **Steps:** Click **Accept and continue**.
- **Expected:** Dialog closes; `cl-consent=v1` cookie set (max-age ~1 year, SameSite=Lax). Reloading does not re-prompt.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### CON-03 — Decline leaves the site
- **Preconditions:** Consent dialog showing.
- **Steps:** Click **Decline**.
- **Expected:** Browser navigates away to google.com (off-site).
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### CON-04 — Legal pages exempt
- **Preconditions:** No consent cookie.
- **Steps:** Directly visit `/privacy` and `/terms`.
- **Expected:** Both render **without** the consent gate (so the policies are readable before consenting). Links inside the dialog also reach them.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### CON-05 — Consent links work from dialog
- **Preconditions:** Consent dialog showing.
- **Steps:** Click **Privacy Policy** and **Terms of Service** links in the dialog.
- **Expected:** Navigates to `/privacy` / `/terms` respectively.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### CON-06 — No flash for consented users
- **Preconditions:** Consent cookie present.
- **Steps:** Load any page and watch on first paint.
- **Expected:** No flicker of the consent dialog (SSR assumes consented; client confirms via cookie).
- **Result:** ☐ Pass ☐ Fail — **Notes:**

---

## 7. Mobile responsiveness

> Test on a real device or DevTools device emulation at ~375px (mobile) and
> ~768px (tablet); confirm desktop ≥ 1280px (xl) for the analyzer two-column.

### MOB-01 — Mobile nav drawer
- **Preconditions:** Signed in, viewport < lg (1024px).
- **Steps:** Tap the hamburger (top-left of topbar).
- **Expected:** Slide-over drawer opens with the logo, nav list, and “Free plan · early access” footer; backdrop dims the page.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### MOB-02 — Drawer closes correctly
- **Preconditions:** Drawer open.
- **Steps:** (a) Tap a nav item; (b) reopen, tap the backdrop; (c) reopen, press Esc; (d) reopen, tap the X.
- **Expected:** Each closes the drawer. On nav-item tap, route changes. Body scroll is locked while open and restored on close.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### MOB-03 — Drawer focus trap & restore
- **Preconditions:** Drawer open (keyboard available).
- **Steps:** Tab through; Shift+Tab past the first element; close the drawer.
- **Expected:** Focus stays trapped inside the drawer and cycles; on open, focus moves to the close button; on close, focus returns to the hamburger trigger.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### MOB-04 — Analyzer layout on mobile
- **Preconditions:** Signed in, mobile viewport, `/analyzer`.
- **Steps:** Inspect editor + results stacking.
- **Expected:** Columns stack (single column < xl); editor height clamps (~55dvh, min 300px) so **Analyze** and results remain reachable. Controls wrap without overflow.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### MOB-05 — Consent dialog on mobile
- **Preconditions:** No consent cookie, mobile viewport.
- **Steps:** Load the site.
- **Expected:** Dialog anchors to the bottom (sheet style) and is fully usable; buttons wrap, not clipped.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### MOB-06 — Lists adapt on mobile
- **Preconditions:** Mobile viewport with saved analyses/snippets.
- **Steps:** View `/analyses` and `/snippets`.
- **Expected:** Space-complexity badge and verdict line hide on small screens (analyses); snippet tags hide; rows remain tappable and readable; no horizontal scroll.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### MOB-07 — Landing page responsive
- **Preconditions:** Mobile viewport, signed out.
- **Steps:** Scroll `/`.
- **Expected:** Hero, steps, feature grid, CTA, and footer reflow to single column; the 3D readout card doesn’t overflow horizontally.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

---

## 8. Security

### SEC-01 — Unauthenticated API is rejected
- **Preconditions:** No valid session (use curl/Postman without Clerk cookies).
- **Steps:** `POST /api/analyze` with a valid JSON body.
- **Expected:** `401` with `{ "error": "Sign in to analyze code." }`. No analysis performed.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### SEC-02 — Cross-account analysis isolation
- **Preconditions:** User A has a saved analysis at `/analyses/<idA>`. Sign in as User B.
- **Steps:** As User B, visit `/analyses/<idA>` directly.
- **Expected:** “Analysis not found” error state (queries are scoped by `profile_id`); User B cannot read User A’s data.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### SEC-03 — Cross-account delete blocked
- **Preconditions:** User A’s analysis/snippet id known; signed in as User B.
- **Steps:** Attempt to delete User A’s analysis id via the bound delete action (e.g. replay the server action with A’s id).
- **Expected:** Deletion is scoped to B’s profile; A’s row is unaffected (no rows match `id AND profile_id`).
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### SEC-04 — Submitted code is never logged
- **Preconditions:** Access to server logs (local/staging).
- **Steps:** Run an analysis containing a unique marker string; inspect logs for `analyze.complete` / `analyze.error`.
- **Expected:** Logs contain metadata only (userId, language, char count, ms, notations, provider, confidence). The marker / raw code does **not** appear.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### SEC-05 — Service-role key not exposed to browser
- **Preconditions:** App running.
- **Steps:** View page source and client JS bundles; search for the Supabase service-role key and `SUPABASE_SERVICE_ROLE`.
- **Expected:** Not present in any client bundle/network payload. Privileged DB access only via server modules (`server-only`).
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### SEC-06 — Analyze rate limit enforced
- **Preconditions:** Signed in.
- **Steps:** Trigger > 20 analyses within 60 s.
- **Expected:** Excess requests return `429` with a “Too many analyses — try again in Ns.” message and a `Retry-After` header; UI shows the error.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### SEC-07 — Save rate limit enforced
- **Preconditions:** Signed in.
- **Steps:** Save analyses/snippets > 20 times within 60 s.
- **Expected:** Further saves return a rate-limit error inline under the buttons.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### SEC-08 — Delete-all-data rate limit
- **Preconditions:** Signed in, on `/settings/account`.
- **Steps:** Trigger “Delete all lab data” more than 3 times within an hour.
- **Expected:** 4th attempt within the hour is rejected with a rate-limit error.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### SEC-09 — Secrets not committed
- **Preconditions:** Repo access.
- **Steps:** Confirm `.env.local` is git-ignored and only `.env.example` (placeholders) is tracked.
- **Expected:** No real keys in the repo; example file has placeholder values.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### SEC-10 — Delete-all wipes data, not the Google identity
- **Preconditions:** Signed in with saved data.
- **Steps:** Confirm “Delete all lab data”; then sign out and back in.
- **Expected:** All analyses/snippets/profile data gone (a fresh profile is created on next visit); the Google sign-in itself still works (account not deleted).
- **Result:** ☐ Pass ☐ Fail — **Notes:**

---

## 9. Error handling

### ERR-01 — Empty code rejected (API)
- **Preconditions:** Signed in.
- **Steps:** `POST /api/analyze` with `code: "   "` (whitespace).
- **Expected:** `400` “Provide some code to analyze.”
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ERR-02 — Oversized code rejected (API)
- **Preconditions:** Signed in.
- **Steps:** `POST /api/analyze` with code > 100,000 chars.
- **Expected:** `413` “Code is too large (max 100,000 characters).”
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ERR-03 — Unsupported language rejected (API)
- **Preconditions:** Signed in.
- **Steps:** `POST /api/analyze` with `language: "cobol"`.
- **Expected:** `400` “Unsupported language.”
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ERR-04 — Invalid JSON body
- **Preconditions:** Signed in.
- **Steps:** `POST /api/analyze` with a malformed body (not JSON).
- **Expected:** `400` “Invalid JSON body.”
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ERR-05 — Provider error handled gracefully (UI)
- **Preconditions:** Force the provider to fail (e.g. invalid `GROQ_API_KEY` with `AI_PROVIDER=groq` and heuristic fallback disabled, or simulate a 500).
- **Steps:** Run an analysis.
- **Expected:** Results panel shows an error state with the server message; status returns to a retryable state. App does not crash. *(Note: by design Groq falls back to the heuristic engine, so a successful fallback result is also acceptable — verify which behavior occurred.)*
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ERR-06 — Network failure during analyze
- **Preconditions:** On `/analyzer`.
- **Steps:** Throttle/offline the network in DevTools, then Analyze.
- **Expected:** Catch path sets an error message (e.g. “Analysis failed…”); UI recovers and allows retry once back online.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ERR-07 — Save failure shows inline error
- **Preconditions:** Force a save action failure (e.g. DB down).
- **Steps:** Click **Save analysis** / **Save snippet**.
- **Expected:** Inline destructive-text error appears under the buttons; state is not stuck on “Saving…”.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ERR-08 — Delete failure shows toast
- **Preconditions:** Force a delete action failure.
- **Steps:** Confirm a delete.
- **Expected:** A toast (error variant) reports the failure; the item remains.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ERR-09 — Analyses list load error
- **Preconditions:** DB unavailable.
- **Steps:** Open `/analyses`.
- **Expected:** ErrorState “Could not load analyses” with hint about provisioning the DB/Supabase env — not a crash.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ERR-10 — Analysis-not-found detail
- **Preconditions:** Signed in.
- **Steps:** Visit `/analyses/<nonexistent-id>`.
- **Expected:** “Analysis not found” error state with the hint that it may have been deleted or belongs to another account.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### ERR-11 — Save without an analysis
- **Preconditions:** N/A (guard test).
- **Steps:** Attempt to save analysis when no valid analysis result exists (e.g. replay action with empty notations).
- **Expected:** Action returns “Run an analysis before saving.”
- **Result:** ☐ Pass ☐ Fail — **Notes:**

---

## 10. Edge cases

### EDG-01 — Exactly-at-limit code (100,000 chars)
- **Preconditions:** Signed in.
- **Steps:** Analyze a buffer of exactly 100,000 chars, then 100,001.
- **Expected:** 100,000 is accepted; 100,001 returns `413`.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### EDG-02 — Unicode / emoji / multibyte code
- **Preconditions:** On `/analyzer`.
- **Steps:** Paste code containing unicode identifiers, emoji in comments, RTL text.
- **Expected:** Char count, analysis, save, and rendering all handle multibyte content without corruption or crash.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### EDG-03 — Code with no functions
- **Preconditions:** On `/analyzer`.
- **Steps:** Analyze a script with only top-level statements (no function declarations) and save.
- **Expected:** Title falls back to the first non-empty line (≤ 60 chars); save succeeds.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### EDG-04 — Very long single line / minified code
- **Preconditions:** On `/analyzer`.
- **Steps:** Paste a single 5,000-char line.
- **Expected:** Editor and results handle it (horizontal scroll, no layout break); analysis completes.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### EDG-05 — Result remounts on new analysis
- **Preconditions:** Save an analysis (buttons show “Saved”).
- **Steps:** Edit the code and Analyze again.
- **Expected:** New result renders; Save buttons reset to default (not stuck on “Saved”) because they remount per result.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### EDG-06 — Saved snapshot reflects analyzed buffer, not later edits
- **Preconditions:** Run an analysis.
- **Steps:** After results appear, edit the editor **without** re-analyzing, then click **Save analysis**.
- **Expected:** The saved analysis/snippet uses the code that was actually analyzed (the snapshot), not the post-result edits.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### EDG-07 — Rapid expand/collapse and delete-arm races
- **Preconditions:** A snippet list.
- **Steps:** Rapidly toggle a snippet’s code view; arm a delete then immediately toggle/blur.
- **Expected:** No stuck states; arming disarms on blur; no accidental deletes; no console errors.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### EDG-08 — Profile display name truncation
- **Preconditions:** On `/settings/profile`.
- **Steps:** Enter an 80+ char display name and save.
- **Expected:** Saved value is trimmed and capped at 80 chars; empty → falls back to Google name.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### EDG-09 — Preferred language drives analyzer default
- **Preconditions:** Set preferred language to e.g. Python and save.
- **Steps:** Open `/analyzer` fresh.
- **Expected:** Default language is Python with its first sample loaded.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### EDG-10 — Theme toggle persistence
- **Preconditions:** Any page.
- **Steps:** Toggle light/dark via the theme toggle; reload.
- **Expected:** Choice persists (localStorage `theme`); no flash of wrong theme on reload (inline pre-paint script).
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### EDG-11 — Back/forward navigation integrity
- **Preconditions:** Signed in.
- **Steps:** Navigate analyzer → analyses → detail, then use browser Back/Forward repeatedly.
- **Expected:** Pages restore correctly; no broken state, duplicate fetches, or stale data.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### EDG-12 — Concurrent sessions / stale list
- **Preconditions:** Same account open in two tabs.
- **Steps:** Delete an item in tab A; in tab B (already loaded) try to open/delete it.
- **Expected:** Tab B handles the now-missing item gracefully (not-found state / no crash). Revalidation refreshes lists where applicable.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

---

## Accessibility spot-checks (cross-cutting)

### A11Y-01 — Skip-to-content link
- **Steps:** On a fresh page load, press Tab once.
- **Expected:** A visible “Skip to content” link appears and jumps to `#main`/`#main-content`.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### A11Y-02 — Dialog semantics
- **Steps:** Inspect the consent gate and mobile drawer.
- **Expected:** `role="dialog"`, `aria-modal="true"`, labelled; focus management as described in MOB-03.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

### A11Y-03 — Keyboard-only core flow
- **Steps:** Sign in → analyze (Ctrl/⌘+Enter) → save → navigate to analyses → delete, using keyboard only.
- **Expected:** All actions reachable and operable; visible focus rings throughout.
- **Result:** ☐ Pass ☐ Fail — **Notes:**

---

## Sign-off

| Area | Pass | Fail | Blocked | Tester | Date |
| --- | --- | --- | --- | --- | --- |
| Authentication | | | | | |
| Analyzer | | | | | |
| Analyses | | | | | |
| Snippets | | | | | |
| Dashboard | | | | | |
| Consent flow | | | | | |
| Mobile | | | | | |
| Security | | | | | |
| Error handling | | | | | |
| Edge cases | | | | | |
| Accessibility | | | | | |

**Overall result:** ☐ Ship ☐ Ship with known issues ☐ Block — **Notes:**
