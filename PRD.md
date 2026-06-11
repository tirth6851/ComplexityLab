# ComplexityLab — Product Requirements Document (PRD)

> **Status:** living document · Last updated 2026-06-10
> **Companions:** `TRD.md` (technical requirements) · `APP_FLOW.md` (user flows) ·
> `ROADMAP.md` (status ledger) · `OPERATING_MANUAL.md` (principles)
> **Legend used throughout:** ✅ shipped · 🔶 partial · 🔮 planned

---

## 1. Vision

**Make computational complexity tangible.** Every developer learns Big-O from
static tables and toy quizzes; almost none get a feedback loop on *their own
code*. ComplexityLab is the instrument panel for that loop: paste code → see
time/space complexity rendered on one shared visual scale (green→red) with the
reasoning spelled out → save it → build intuition that compounds.

Long-term, ComplexityLab grows from an analyzer into a complete learning
platform: structured lessons, quizzes, persisted skill progress, an algorithm
catalog with animated visualizers, and an AI tutor. The analyzer is the wedge;
the library of a user's own analyzed code is the moat.

## 2. Target users

| Segment | Need | Priority |
|---|---|---|
| **CS students** (DS&A coursework) | See why their solution is O(n²), in their own code, not a textbook's | Primary |
| **Interview preppers** | Fast complexity verdicts + reasoning on practice solutions; a history to review | Primary |
| **Self-taught developers** | A gentle, visual on-ramp to Big-O that doesn't assume formal background | Primary |
| **Working engineers** | Quick gut-check on a hot path; trustworthy fallback when the LLM is wrong | Secondary |
| **Educators** | A live demo tool for teaching complexity | Secondary |

Shared traits: they read code comfortably, are under-served by static cheat
sheets, and respond to visible progress (streaks, saved history).

## 3. Core problems solved

1. **Big-O is taught abstractly.** There's no feedback loop between writing
   code and understanding its cost. → The analyzer closes the loop in seconds.
2. **Existing tools are extremes.** Toy quizzes on one end, heavyweight
   profilers on the other; nothing in the middle for *asymptotic* reasoning on
   arbitrary pasted code. → A focused middle tool.
3. **Learning doesn't accumulate.** One-off analyses vanish. → Saved analyses
   + snippets + dashboard stats (streaks, language mix) make progress durable.
4. **LLM answers about complexity are unreliable and opaque.** → Groq-backed
   analysis is validated, clamped, and **always backed by a deterministic
   heuristic engine** — the product never returns nothing, and it always shows
   its reasoning notes.

## 4. User stories

### Visitor & sign-up
- ✅ As a visitor, I understand what ComplexityLab does within seconds of landing (hero + visual readout).
- ✅ As a privacy-conscious visitor, I can read the Privacy Policy and Terms *before* consenting, and declining takes me off the site.
- ✅ As a new user, I sign in with one click via Google — no passwords.

### Analyzer
- ✅ As a learner, I paste code (7 languages) and get time + space complexity with metric gauges, a growth-curve chart, and reasoning notes.
- ✅ As a skeptic, I can see which engine produced the result and its confidence.
- 🔶 As a first-time user, I want a guided path (load a sample → analyze → save) instead of an unexplained editor. *Samples exist; guidance doesn't — polish priority P1.*
- 🔮 As a keyboard user, I want ⌘/Ctrl+Enter to run the analysis. *(P1)*
- 🔮 As a returning user, I want the analyzer to open in my preferred language from my profile. *(Stored in settings today but not consumed — P1.)*

### Library (analyses & snippets)
- ✅ As a user, I save an analysis and find it later in a list with complexity badges.
- ✅ As a user, I open a saved analysis (`/analyses/[id]`) and see the stored code plus the full original results panel.
- ✅ As a user, I delete analyses/snippets with a two-step confirmation.
- 🔶 As a user, I save snippets for reuse — but today I can't view a snippet's code after saving or send it back to the analyzer. *(P5.)*
- 🔮 As a user, I want "Open in analyzer" round-trips from analyses and snippets. *(P5.)*

### Dashboard & settings
- ✅ As a user, I see recent activity, counts, a day streak, and my language mix.
- ✅ As a user, I set a display name and preferred language; toggle dark/light theme.
- ✅ As a user, I can delete **all** my data in one (guarded) action.

### Learning platform (future)
- 🔮 Lessons across sorting/search/graphs/DP, tied to the analyzer.
- 🔮 Per-lesson quizzes with attempts and scoring.
- 🔮 Persisted skill/topic progress replacing derived stats.
- 🔮 AI tutor chat; algorithm catalog with animated visualizers.

## 5. Success metrics

**North star: weekly analyses per active user.**

| Metric | Definition | Target |
|---|---|---|
| Activation | Sign-up → first analysis | < 2 minutes |
| First save | First analysis → first save | Same session |
| Save rate | Saves ÷ analyses | > 30% |
| Retention proxy | Day streak ≥ 2 share of WAU | > 25% |
| Own-code conversion | Users analyzing non-sample code | > 50% by week 2 |

**Quality guardrails:** AI fallback rate < 10% of analyses (logged as
`groq.fallback`) · analyze p95 latency < 5s (hard timeout 20s) · analyze error
rate < 1%.

> **Instrumentation status:** server-side structured logs only (Vercel runtime
> logs). No product analytics is wired yet — funnel metrics above are *defined
> ahead of tooling* so the instrumented funnel matches the designed one.
> Wiring analytics is a roadmap item, not a current capability.

## 6. MVP scope

### Shipped (live at https://complexity-lab-eight.vercel.app)
- Public landing page, Google-only auth (Clerk), consent gate + privacy/terms.
- Analyzer: Monaco editor, 7 languages, 18 sample templates, Groq AI analysis
  with automatic deterministic-heuristic fallback, full results panel
  (verdicts, 4 gauges, growth timeline, notes), save analysis / save snippet.
- Analyses list + detail view (`/analyses/[id]`) re-rendering stored results;
  snippets list; two-step deletes everywhere.
- Dashboard with real derived stats; profile + account settings; delete-all-data.
- Rate limiting on the API and every server action; structured logging (code
  content never logged).

### Known operational gaps (not product gaps)
- DB migration must be applied to the production Supabase project before
  saves/dashboard work for real users (app degrades gracefully until then).
- Clerk runs a dev instance; production instance needed before public launch.

### Explicit non-goals for MVP
- No runtime profiling/benchmarking — asymptotic analysis only.
- No collaboration/sharing, no public profiles.
- No mobile-native apps; responsive web only.
- No payment/premium tier.

## 7. Future roadmap (product view)

| Horizon | Theme | Contents |
|---|---|---|
| **Now** | UX & product polish | P1 analyzer onboarding · P2 landing honesty/quality · P3 mobile · P4 micro-interactions & feedback · P5 analysis/snippet experience (see MISSION_CONTROL.md) |
| **Next** | Launch readiness | Apply migration · rotate leaked keys · production Clerk instance · CI pipeline · product analytics · global rate limiting (KV) |
| **Later** | Learning platform | Lessons content model + pages · quizzes · persisted progress · Clerk↔Supabase RLS bridge |
| **Someday** | Platform vision | AI tutor (streaming chat) · algorithm catalog + animated visualizers · sharing/community · premium tier |

---

*Maintained by the lead product engineer. Update when scope or metrics change;
status ledger lives in `ROADMAP.md`, sprint state in `MISSION_CONTROL.md`.*
