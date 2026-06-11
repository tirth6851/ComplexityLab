# ComplexityLab — Operating Manual

> **Project memory · stable layer.** Principles that should survive every sprint.
> Read once per session. Companions: `MISSION_CONTROL.md` (what's happening now),
> `SECOND_BRAIN.md` (decisions, lessons, debt), `RULES_OF_ENGAGEMENT.md` (hard rules).

---

## Project goals

1. **Make computational complexity tangible.** Paste real code → *see* its time/space
   cost on a shared visual scale — not read about Big-O in the abstract.
2. **Build a tight learning loop:** analyze → understand the reasoning → save →
   revisit → intuition compounds over time.
3. **Grow from analyzer-MVP into a learning platform** — lessons, quizzes, persisted
   progress, algorithm catalog with animated visualizers, AI tutor (in that order).
4. **Stay production-real at every step:** deployed, authenticated, persisted,
   rate-limited, privacy-honest. No demo-ware.

## Design philosophy — "Dark Lab"

- **Instrument panel, not a document.** Dense readouts, measured glow, purposeful
  blank space. The user is operating an instrument, not reading a blog.
- **Signal Green is *the* accent.** The green→red **complexity gradient** is the
  brand spine — every surface that talks about cost speaks this one visual language
  (`lib/complexity.ts` is the single source of the Big-O → tier/color mapping).
- **Dark-first; light theme must keep working.** Everything is tokenized
  (`app/tokens.css` brand-constant; `app/globals.css` theme-dependent). Components
  never hardcode colors.
- **Mono for data, sans for prose.** Big-O notations, metrics, code, instrument
  labels → JetBrains Mono. Explanations and UI copy → Geist Sans.
- **Motion is information.** Scanline sweep = analysis in progress; glow = result
  ready; otherwise restraint. Respect `prefers-reduced-motion` as polish lands.

## Engineering principles

- **Server Components by default;** client islands only where interactivity demands.
- **All DB access through `lib/db/*`** — server-only (build fails if it leaks into a
  client bundle), Clerk-scoped per call, returns `DbResult<T>` — never throws to pages.
- **Graceful degradation over hard failure.** DB unreachable → warning banner +
  empty states. AI provider down → deterministic heuristic engine answers instead,
  with a note. The analyzer never breaks because a vendor did.
- **Provider abstraction:** the UI must never depend on which AI produced a result.
  Adding a vendor = one provider file + one registry entry, nothing else changes.
- **No new dependencies without strong justification.** Monaco was the one approved
  runtime addition; the SVG chart, rate limiter, and logger are hand-rolled on purpose.
- **Tests are gates, not decoration.** Sample templates double as engine fixtures —
  every sample must land on its expected Big-O class.

## UX principles

- **Every surface designs its empty, loading, and error states.** No bare gaps —
  `EmptyState`, `ErrorState`, `Skeleton` exist for this.
- **Destructive actions are two-step** (arm → confirm), inline, no modal ceremony.
- **The user should never wonder "did that work?"** — every action surfaces success
  *and* failure. (Known gap today: some failures are silent — see SECOND_BRAIN.)
- **First-run users get a path, not a blank editor** — samples, guidance, a visible
  next step. (Current polish priority #1.)
- **Privacy honesty:** submitted code is never logged; consent is explicit and
  versioned (`cl-consent` cookie); deletion is real (profile cascade wipes all data).
- **Mobile is a context, not a shrunken desktop.** Tap targets, drawer nav, no
  fixed-width assumptions.

---

*Last updated: 2026-06-10 · Update when principles genuinely change, not per sprint.*
