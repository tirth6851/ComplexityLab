# ComplexityLab — App Flow

> **Status:** living document · Last updated 2026-06-10
> Every end-to-end user flow, grounded in the actual routes/components.
> Contracts in `TRD.md`; component inventory in `DESIGN_HANDOFF.md`.

---

## 1. Visitor flow

```
First visit (any page except /privacy, /terms)
  └─► ConsentGate dialog (blocking, components/legal/consent-gate.tsx)
        ├─ Accept ──► cl-consent=v1 cookie (1 year) → dialog dismissed
        └─ Decline ─► window.location.replace → google.com (off-site)
/            landing (app/page.tsx): hero + 3D readout card → features → gradient band → CTA
  ├─ "Start analyzing" / "Get started" ──► /sign-up
  ├─ "Sign in" ──► /sign-in
  ├─ "Explore the dashboard" ──► /dashboard (signed-out: 307 → /sign-in)
  └─ Footer ──► /privacy · /terms (readable pre-consent)
```

- The consent gate is mounted in the root layout, assumes consent during SSR,
  and corrects client-side after mount (`useSyncExternalStore` over the cookie).
- Legal pages are exempt so policies are readable before consenting.

## 2. Authentication flow

```
/sign-in (or /sign-up)            AuthShell + GoogleAuthButton
  └─ "Continue with Google" ──► Clerk signals API ──► accounts.google.com
        └─ OAuth ──► /sso-callback (client handshake) ──► /dashboard
Signed-out request to a protected route
  └─ proxy.ts matcher (PROTECTED_ROUTES) ──► 307 → /sign-in  (branded page,
     via auth.protect({ unauthenticatedUrl }))
Signed-out POST /api/analyze ──► 401 JSON (self-guarded, no redirect)
```

- Google-only; no passwords exist anywhere.
- First authenticated DB touch auto-creates the user's profile row, seeding
  display name from Clerk (`getOrCreateProfile`, race-safe).

## 3. Analyzer flow

```
/analyzer (protected, dynamic; client island AnalyzerWorkbench)
  ├─ IntroStrip: dismissible 3-step first-run guide (localStorage cl-analyzer-intro)
  ├─ Opens on the profile's preferred language's first sample
  │   (pending "open in analyzer" handoff overrides — see §5/§6)
  ├─ Language select (7) ─ re-highlights buffer, never clobbers code
  ├─ Sample select (18 templates) ─ replaces buffer
  ├─ Monaco editor (dynamic import, skeleton fallback, theme-aware)
  └─ [Analyze] — button, idle-panel CTA, or Ctrl/⌘+Enter (works inside
     Monaco too); disabled when buffer empty or already analyzing
        │   min 650ms "scanline" sweep so results never jarringly flash
        ▼
      POST /api/analyze { code, language }
        ├─ 200 ──► ResultsPanel "done": TIME/SPACE VerdictReadouts,
        │          4 MetricGauges, ComplexityTimeline (SVG growth curves),
        │          "What the engine saw" notes, provider + confidence line,
        │          SaveActions
        └─ 4xx/5xx ──► ResultsPanel "error" with the server's message
ResultsPanel states: idle → analyzing (skeletons) → done | error
```

- Behind the API, Groq analyzes with a 20s timeout; **any** failure falls back
  to the deterministic heuristic engine with an explanatory note — the user
  always gets a result.
- The analyzed snapshot (code+language) is captured at request time, so edits
  made after a result don't silently change what "Save" persists.

## 4. Save-analysis flow

```
ResultsPanel ─ SaveActions (remounted per result so state resets)
  ├─ [Save analysis] ─► saveAnalysisAction (20/min/user)
  │     validate → deriveTitle("firstFn()") → lib/db createAnalysis
  │     (persists code + verdicts + full CodeAnalysis JSONB)
  │     → revalidate /analyses, /dashboard
  │     button: Save → Saving… → ✓ Saved  (error: inline red text below)
  └─ [Save snippet] ──► saveSnippetAction (20/min/user) → same pattern,
        revalidates /snippets, /dashboard
```

## 5. Analyses flow (list + detail)

```
/analyses (protected, dynamic)
  ├─ db error ──► ErrorState (+ migration hint)
  ├─ empty ────► EmptyState → "Open analyzer" CTA
  └─ rows: title/meta link ──► /analyses/[id]
            badges (time, space·sm+) · ConfirmDeleteButton (arm → "Sure?")
/analyses/[id] (protected, dynamic)
  ├─ not found / other user's id ──► ErrorState ("Analysis not found")
  ├─ header: title · language · timeAgo (ISO tooltip) · badges ·
  │          [Open in analyzer] (carries the stored code) · delete
  ├─ Source code card (line count, CopyButton, <pre>)
  └─ stored result JSONB ──► ResultsPanel status="done"
        └─ result null (legacy row) ──► "Re-analyze in editor" (carries code)
  Delete ──► deleteAnalysisAndRedirectAction → redirect("/analyses")
  Open in analyzer ──► sessionStorage handoff → /analyzer picks it up on mount
```

## 6. Snippets flow

```
/snippets (protected, dynamic)
  ├─ db error ──► ErrorState · empty ──► EmptyState → analyzer CTA
  └─ SnippetItem rows: icon · title · language · timeAgo · Tags (sm+) · delete
        └─ row click expands an inline code view:
             CopyButton · [Open in analyzer] (handoff) · scrollable <pre>
```

## 7. Dashboard flow

```
/dashboard (protected, dynamic)
  ├─ parallel fetch: listAnalyses(50) + listSnippets(50)
  ├─ any error ──► warning banner ("Database unavailable… showing empty data")
  ├─ WelcomeCard (Suspense + skeleton; Clerk name)
  ├─ RecentAnalyses(5) · SavedSnippets(5)
  └─ ProgressOverview: analyses count · this-week count · day streak
     (yesterday-tolerant) · languages used · language-mix bars  + QuickActions
```

All stats are derived in pure functions (`lib/stats.ts`) — nothing persisted yet.

## 8. Settings flow

```
/settings ──► redirect /settings/profile
/settings/profile   ProfileForm → updateProfileAction (10/min)
                    display name (≤80 chars) · preferred language (validated)
/settings/account   Clerk identity (read-only) · theme toggle · sign out
                    Danger zone: delete-all-data (3/hour) — deletes profile row,
                    cascade wipes analyses + snippets; fresh profile on next visit
```

## 9. Error states (system-wide matrix)

| Failure | Surface | UX |
|---|---|---|
| DB unreachable / migration missing | list pages | `ErrorState` card + remediation hint |
| same | dashboard | warning banner + empty readouts (page still works) |
| Analysis API 4xx/5xx | results panel | error state with server message |
| Rate limited (API) | results panel | 429 message incl. retry seconds |
| Rate limited (action) | inline | `{ok:false,error}` → red text (SaveActions) |
| Failed delete (rate limit/db) | toast | error toast via `useToastSafe` (ConfirmDeleteButton) |
| Render error in (app) segment | `(app)/error.tsx` | boundary keeps chrome alive |
| Unknown analysis id | detail page | "Analysis not found" ErrorState |
| Groq down/slow/garbage | invisible | heuristic fallback + note in results |

## 10. Mobile considerations

- **Shell:** sidebar hidden < lg; `MobileNav` hamburger → slide-over drawer
  (Escape/backdrop close, body-scroll lock, route-change close, **focus trap**
  with focus restore to the trigger).
- **Analyzer:** editor/results stack below xl; Monaco height is
  `clamp(300px, 55dvh, 460px)` so Analyze + results stay reachable on phones;
  controls row wraps; shortcut hint hidden < sm.
- **Lists:** space-complexity badge and snippet tags hidden < sm; verdict line
  hidden < sm; rows stay single-line with truncation.
- **Consent gate:** bottom-sheet placement on mobile (`items-end sm:items-center`).
- **Toasts:** full-width bottom stack on mobile, bottom-right on sm+.
- **Landing:** single column < lg; 3D readout below hero copy.
- Delete buttons are 36px (`h-9 min-w-9`) — the app's standard control height.
- `prefers-reduced-motion: reduce` collapses all animations/transitions;
  status is always conveyed by text, never motion alone.

---

*Maintained by the lead product engineer. Update when a flow changes —
each flow section should stay grounded in real file paths.*
