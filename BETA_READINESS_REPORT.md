# Beta Readiness Report — ComplexityLab

**Date:** 2026-06-15  
**Branch:** `beta-prep-audit`  
**Test suite:** 211 / 211 passing  
**TypeScript:** 0 errors

---

## Summary

ComplexityLab has gone through a full QA sprint (manual testing → bug fixes → codebase hardening → beta audit). The remaining risk surface is small and well-understood. The app is ready for beta release.

**Overall score: 87 / 100**

---

## Issues Found and Fixed

### Authentication & Routing
| Issue | Fix |
|---|---|
| Sign-in / sign-up pages accessible while already logged in | Added server-side `auth()` check with `redirect("/dashboard")` in both page components |

### Save / Feedback Flows
| Issue | Fix |
|---|---|
| No feedback after saving an analysis or snippet | `saveAnalysisAction` / `saveSnippetAction` now return `id` on success; `useSave` tracks `savedId` and renders a "View" link |
| No toast after deleting an analysis or snippet | `ConfirmDeleteButton` accepts `successMessage` prop; both call sites wired with `"Analysis deleted"` / `"Snippet deleted"` |
| Danger-zone "Delete all data" didn't navigate away | `danger-zone.tsx` now calls `router.push("/dashboard")` after 1.2 s |

### UX Polish
| Issue | Fix |
|---|---|
| Empty analyzer buffer gave no hint | Added `"Paste code to analyze"` hint label (aria-live) when the editor is empty |
| Clipboard copy failure was silent | `copy-button.tsx` now calls `toast("Could not copy — clipboard access was denied.", { variant: "error" })` |
| Profile-save feedback was invisible to screen readers | Replaced bare `<span>` with `role="status" aria-live="polite"` wrapper |

### Accessibility
| Issue | Fix |
|---|---|
| Consent gate had no focus trap or scroll lock | Added Tab-cycling focus trap and `document.body.style.overflow = "hidden"` (matches `mobile-nav.tsx` pattern) |

### Type Safety
| Issue | Fix |
|---|---|
| `result` DB column cast unsafely with `as CodeAnalysis` | Added `isCodeAnalysis()` shape guard in `mappers.ts`; corrupt rows return `null` instead of crashing |
| Duplicate `ComplexityLevel` type in `badge.tsx` and `complexity.ts` | Removed local copy; `badge.tsx` now re-exports from `lib/complexity.ts` |

### Performance
| Issue | Fix |
|---|---|
| `getAnalysis` called twice per request (generateMetadata + page) | Wrapped with React `cache()` for per-request deduplication |
| Dynamic page title was static (`"Analysis · ComplexityLab"`) | Replaced `export const metadata` with `generateMetadata` that queries the DB |

### Resource Leaks
| Issue | Fix |
|---|---|
| No AbortController on `fetch("/api/analyze")` | Added `abortRef` + cleanup `useEffect` in `analyzer-workbench.tsx`; in-flight request aborted on unmount or re-analyze |
| `setTimeout` in `profile-form.tsx` had no cleanup | Timer stored in `timerRef`, cleared on unmount via `useEffect` return |

### Dead Code / Tech Debt
| Issue | Fix |
|---|---|
| Magic numbers `MAX_CODE_LENGTH`, `SAVE_LIMIT`, `200` scattered across files | Consolidated into `frontend/lib/limits.ts`; all consumers import from there |
| Hardcoded rate-limit values in route handlers | All route handlers now import `ANALYZE_RATE_LIMIT`, `SAVE_RATE_LIMIT`, `DELETE_RATE_LIMIT` from `lib/limits.ts` |

---

## Remaining Risks

### Low — Minor UX gaps

1. **Rate-limit UX**: When a user hits the analyze rate limit (20 req/min), they see an error toast. There's no countdown or progressive back-off. Acceptable for beta.

2. **In-memory rate limiter**: The sliding-window limiter resets on cold-start (serverless). A power user could burst on each cold instance. Acceptable until Redis is wired up.

3. **`isCodeAnalysis` guard returns `null` for corrupt rows**: The analysis detail page renders a "No detailed results" fallback. Legacy rows that pre-date the `result` column will hit this. No data loss; the code is intact.

4. **Consent gate "Decline" path**: Clicking Decline links to the home page but does not explicitly sign the user out. If they navigate back, the gate re-appears. Intentional for now; full sign-out on decline is a follow-up.

5. **No CSRF tokens on Server Actions**: Next.js App Router Server Actions include an origin check by default. Explicit CSRF tokens are not required, but this should be confirmed against the deployed Vercel config before GA.

### Medium — Production Infrastructure

6. **Rate limiter is per-instance**: As noted above, no shared state between serverless instances. Shared rate limiting requires an external store (Upstash Redis, etc.).

7. **Supabase service-role key exposure audit**: The `server-only` guard is in place on all DB modules. A one-time audit of the Vercel environment variables to confirm the key isn't in `NEXT_PUBLIC_*` namespace is recommended before launch.

8. **Error messages from DB surface to UI**: `dbError()` returns sanitized strings, but a single test should confirm no raw Postgres error text reaches the browser.

---

## Recommended Follow-Up (Post-Beta)

| Priority | Item |
|---|---|
| P1 | Replace in-memory rate limiter with Upstash Redis for multi-instance consistency |
| P1 | Add end-to-end smoke test (Playwright) covering sign-in → analyze → save → view → delete |
| P2 | Sign user out on Consent Gate "Decline" |
| P2 | Add rate-limit countdown UX ("Try again in 45 s") |
| P3 | Add `/api/health` endpoint returning DB + Groq reachability for uptime monitoring |
| P3 | Confirm no `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` leaks in Vercel env config |

---

## Score Breakdown

| Dimension | Score | Notes |
|---|---|---|
| Hidden bugs | 18 / 20 | Auth redirect, abort, timer, DB guard — all fixed. Rate limiter edge case remains. |
| Production readiness | 15 / 20 | Build clean, RLS in place, `server-only` guards enforced. In-memory rate limit and no health endpoint are gaps. |
| UX polish | 18 / 20 | Save feedback, delete confirmation, empty-buffer hint, clipboard error — all shipped. Rate-limit UX is rough. |
| Security | 16 / 20 | Service-role key server-only, input validation in place. Shared rate limiting and Vercel env audit pending. |
| Performance | 10 / 10 | `cache()` dedup, AbortController, no redundant fetches. |
| Code quality | 10 / 10 | Type safety improved, dead code removed, limits centralized, 211 tests green, 0 TS errors. |
| **Total** | **87 / 100** | |

---

*Report generated by Claude Code on `beta-prep-audit` branch.*
