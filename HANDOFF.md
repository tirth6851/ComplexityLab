# ComplexityLab Handoff Document

> **Audience:** A senior engineer — human or a fresh Claude Code session — opening this
> repository with **zero prior conversation history**.
> **Status as of this handoff:** Phases 0–2 complete. Build + lint green. Nothing committed yet
> (all work is staged/unstaged in the working tree pending review).
> **Read the [Quick Start For New Claude Sessions](#quick-start-for-new-claude-sessions) at the
> very bottom first if you only have 2 minutes.**

---

## Executive Summary

**ComplexityLab** is an **interactive complexity-analysis and algorithm-learning platform**. It
helps users understand **time complexity, space complexity, optimization opportunities, and
algorithmic thinking** through **visualization, guided learning, and AI-assisted feedback**.

- **What it is:** A web app where a developer or student can paste/select code or an algorithm,
  see its complexity broken down visually, learn the underlying concepts through lessons, test
  themselves with quizzes, and receive AI-driven optimization suggestions.
- **Long-term vision:** Become the "instrument panel" for algorithmic thinking — a premium,
  technical, dark-themed lab environment where complexity is made tangible and intuitive.
- **Intended audience:** CS students, bootcamp learners, interview-preppers, and working
  engineers who want to sharpen complexity intuition.
- **Product goals:**
  1. Make Big-O **visual and intuitive**, not abstract.
  2. Provide **guided education** (lessons + quizzes) tied to real code.
  3. Offer **AI-assisted optimization** feedback (Groq).
  4. Track **progress** so learning compounds over time.

---

## Product Vision

### Core Vision
- **Visual complexity analysis** — render time/space complexity as readable, animated readouts.
- **Algorithm education** — structured lessons across sorting, searching, graphs, DP, recursion.
- **Interactive learning** — quizzes, hands-on exploration, immediate feedback.
- **Code optimization assistance** — AI suggests improvements and explains trade-offs.

### Feature Status Matrix

| Feature                         | Status        | Notes |
|---------------------------------|---------------|-------|
| Project foundation / scaffold   | ✅ COMPLETED  | Next 16, TS, Tailwind, Clerk, Supabase wired |
| Authentication (Google-only)    | ✅ COMPLETED  | Clerk signals API; needs Google enabled in dashboard |
| Dashboard shell (mock data)     | ✅ COMPLETED  | Welcome / analyses / snippets / progress / quick actions |
| Design token foundation         | ✅ COMPLETED  | Placeholder palette — **not yet** the Dark Lab spec |
| Landing page                    | 🚧 IN PROGRESS| Minimal placeholder with auth links only |
| Real complexity analysis engine | 🔮 FUTURE     | No parser/analyzer exists yet |
| AI optimization assistant       | 🔮 FUTURE     | Groq key present, zero code |
| Lesson system                   | 🔮 FUTURE     | Not started |
| Quiz system                     | 🔮 FUTURE     | Not started |
| Progress tracking               | 🔮 FUTURE     | Mock bars only; no persistence |
| Saved analyses / snippets       | 🔮 FUTURE     | Mock data only; no DB reads/writes |
| Community content               | 🔮 FUTURE     | Not started |
| Premium features                | 🔮 FUTURE     | Not started |

---

## Architecture Decisions

### Frontend
- **Next.js 16** (App Router, Turbopack) — latest stable; "latest" resolved to 16.x, not 15.
- **React 19** — bundled with Next 16.
- **TypeScript** (strict) — `@/*` path alias → `frontend/` root.
- **Tailwind CSS v3.4** — deliberately **v3, not v4**. v4 is CSS-first and has **no
  `tailwind.config.ts`**; the project standardizes on a config-file + CSS-variable token system,
  which is the v3 idiom. Migrating to v4 later is possible but not required.
- **App Router** — Server Components by default; client islands only where interactivity is needed.

### Authentication — Clerk, Google Sign-In only
- **Why Clerk:** Managed auth, first-class Next.js App Router support, hosted user management,
  and a clean path to bridge identity into Supabase RLS later.
- **Why Google-only:** Lowest-friction onboarding for the target audience (devs/students almost
  all have Google), no password management burden, and a simpler, more premium auth surface.
- **How enforced:** Custom auth pages call Clerk's **signals/Future API**
  (`signIn.sso({ strategy: "oauth_google" })` / `signUp.sso(...)`), so Google-only is enforced
  **in code**, not just by dashboard toggles.
- **⚠️ Runtime prerequisite:** Google **must be enabled** in the Clerk Dashboard
  (*Configure → SSO Connections → Google*). Email/password can be disabled there for a true
  Google-only experience.

### Database — Supabase
- **Current status:** **Configured but unused.** Browser + server clients exist
  (`lib/supabase/`), but **no tables, no queries, no RLS** yet. The dashboard runs entirely on
  mock data.
- **Key rule:** the **service-role key is server-only** and must never reach the client bundle.
- **Pending hard problem:** the **Clerk ↔ Supabase RLS bridge** (Clerk as third-party auth
  provider; RLS keyed to `auth.jwt()->>'sub'`). This is the single trickiest integration and is
  deferred to Phase 5.

### AI — Groq
- **Status:** **Not implemented.** `GROQ_API_KEY` (and `GROQ_MODEL`) are present in env, but there
  is **zero AI code**. Reserved for Phase 6 (streaming tutor / optimization assistant via Route
  Handlers).

### Deployment — Vercel
- **Why Vercel:** Native Next.js host (zero-config builds, edge/serverless functions, preview
  deployments, env management). The app needs no custom infra.
- **Important:** the app lives in **`frontend/`**, so the Vercel project **Root Directory must be
  set to `frontend`**.

### Backend Philosophy
- **Minimal backend.** Prefer **Vercel-native** primitives.
- Use **Route Handlers** and **Server Actions** for server logic.
- **No microservices.** **No separate API server.** **No premature abstraction.**
- Bias toward the **smallest deployable solution** that works; add complexity only when a concrete
  requirement forces it.

---

## Repository Structure

```
ComplexityLab/                  # repo root
├─ HANDOFF.md                   # ← this document (source of truth)
├─ CLAUDE.md                    # Claude Code project instructions
├─ README.md                    # short project intro
├─ .gitignore                   # ignores env files, node_modules, .next, etc.
├─ .nvmrc                       # Node 22
├─ .vscode/                     # editor + MCP config (Firecrawl MCP)
├─ .claude/                     # Claude settings
└─ frontend/                    # THE APP (Next.js) — Vercel root dir
   ├─ app/                      # App Router routes
   │  ├─ layout.tsx             # root layout: ClerkProvider, fonts, metadata
   │  ├─ globals.css            # Tailwind layers + DESIGN TOKENS (source of truth)
   │  ├─ page.tsx               # landing (minimal placeholder + auth links)
   │  ├─ sign-in/page.tsx       # Google-only sign-in
   │  ├─ sign-up/page.tsx       # Google-only sign-up
   │  ├─ sso-callback/page.tsx  # Clerk OAuth handshake handler
   │  └─ dashboard/
   │     ├─ layout.tsx          # authed shell (sidebar + topbar)
   │     └─ page.tsx            # composes the 5 readouts
   ├─ components/
   │  ├─ ui/                    # reusable primitives (card, button, badge, icons, google-auth-button)
   │  ├─ layout/                # logo, sidebar, topbar, auth-shell
   │  └─ readouts/              # dashboard data panels (welcome, analyses, snippets, progress, quick-actions)
   ├─ lib/
   │  ├─ utils.ts               # cn() = clsx + tailwind-merge
   │  ├─ mock-data.ts           # ALL dashboard data is mock (no backend)
   │  └─ supabase/
   │     ├─ client.ts           # browser client (anon key)
   │     └─ server.ts           # server client (cookie-aware; service-role stays server-only)
   ├─ hooks/                    # (empty; .gitkeep) future React hooks
   ├─ types/index.ts            # shared domain types (Analysis, Snippet, etc.)
   ├─ constants/site.ts         # app name/description/url
   ├─ public/                   # static assets (.gitkeep)
   ├─ proxy.ts                  # Next 16 "proxy" (was middleware.ts) — Clerk route protection
   ├─ tailwind.config.ts        # token → Tailwind mapping, fonts, darkMode: 'class'
   ├─ postcss.config.mjs        # Tailwind + autoprefixer
   ├─ eslint.config.mjs         # ESLint 9 flat config (eslint-config-next v16 native)
   ├─ tsconfig.json             # strict TS, @/* alias
   ├─ next.config.ts
   ├─ .env.local                # REAL secrets — git-ignored, never commit
   └─ .env.example              # placeholder template (committed)
```

**Folder purposes**
- `app/` — routes and layouts (App Router). Server Components unless marked `"use client"`.
- `components/ui/` — small, reusable, token-styled primitives. **Reuse before creating new ones.**
- `components/layout/` — structural chrome (shell, nav, brand).
- `components/readouts/` — "instrument-panel" data panels for the dashboard.
- `lib/` — framework-agnostic logic, clients, helpers, mock data.
- `types/` — shared TypeScript models.
- `constants/` — static config values.
- `hooks/`, `public/` — reserved (placeholders for now).

---

## Design System

> **CRITICAL STATUS NOTE:** The design system described below is the **intended target spec**
> ("ComplexityLab Design System"). The **current code does NOT yet implement it.** Today the app
> ships a **neutral placeholder palette** (blue primary `221 83% 53%`, light/dark via
> `class`-based tokens). The neon-on-black "Dark Lab" identity, Signal Green, and the complexity
> gradient are **not built yet** — they are the design direction for Phase 3. Treat
> `app/globals.css` + `tailwind.config.ts` as the swap point: re-skinning = changing token values
> there, not touching components.

### Visual Identity (target)
- **Dark Lab aesthetic** — dark-first, lab-instrument feel.
- **Premium technical interface** — precise, dense, confident.
- **Apple-level polish** — spacing, motion, and hierarchy are deliberate.
- **Nothing-inspired information density** — high signal, monospace data, restrained chrome.
- **Neon-on-black visuals** — luminous accents over deep surfaces.

### Typography (implemented)
- **Geist Sans** — primary UI font (CSS var `--font-geist-sans`).
- **JetBrains Mono** — code, metrics, complexity readouts (CSS var `--font-mono`).
- Both are wired in `app/layout.tsx` and mapped in `tailwind.config.ts`.

### Color System (target → tokens)
- **Signal Green** — primary action/accent ("the signal"). *Target — currently blue placeholder.*
- **Complexity Gradient** — a green→amber→red scale encoding cheap→costly complexity
  (e.g. `O(1)` green … `O(2ⁿ)` red). *Partially expressed today only as badge variants
  (primary / secondary / destructive) in `recent-analyses.tsx`.*
- **Surface colors** — layered dark surfaces (`--background`, `--card`, `--muted`, `--popover`).
- **Text colors** — `--foreground`, `--muted-foreground`.

All colors are **HSL CSS variables** in `app/globals.css`, consumed via Tailwind utilities
(`bg-background`, `text-foreground`, `bg-primary`, …).

### UI Principles
- **Reusable primitives** — `Card`, `Button`, `Badge`, etc. Compose, don't duplicate.
- **Instrument-panel readouts** — dashboard data presented like gauges/metrics (mono numbers,
  compact density).
- **Glassmorphism** — subtle translucency/blur on chrome (e.g. topbar uses `backdrop-blur`).
- **Responsive layouts** — desktop-first today; mobile needs work (see Technical Debt).

### Design Rules (must follow)
1. **Never hardcode colors.** Use token utilities (`bg-card`, `text-primary`, …). To re-skin, edit
   tokens in `globals.css` only.
2. **Mono for data, sans for prose.** Complexity values, metrics, code → `font-mono`.
3. **Reuse `components/ui` primitives** before writing new ones; keep variants in the primitive.
4. **Dark-first.** New surfaces must look right in dark mode (tokens already define `.dark`).
5. **Use `cn()`** (`lib/utils.ts`) for conditional/merged class names.
6. **Keep components Server Components** unless they need interactivity/hooks (then `"use client"`).
7. **Accessibility:** focus-visible rings exist on interactive primitives — preserve them.

---

## Security Notes

### Discovered & handled
- **Secrets were previously committed.** `frontend/.env.local` containing **live** Clerk, Supabase
  (incl. **service-role**), and Groq keys was tracked in git (commit `0416f99`).
- **Removed from tracking** via `git rm --cached frontend/.env.local` (file kept on disk).
- **`.gitignore` added** at repo root — ignores `.env*` (except `.env.example`), `node_modules`,
  `.next`, build output, etc.
- **`.env.example` created** as a safe, committed template (placeholders only).

### Standing rules
- **`SUPABASE_SERVICE_ROLE_KEY` and `CLERK_SECRET_KEY` are server-only.** Never import into a
  Client Component or expose to the browser. Privileged access goes through Server Actions / Route
  Handlers in server-only modules.
- **`.env.local` must never be committed.** It is git-ignored — keep it that way.

### ⚠️ Outstanding (action required)
- **Rotate all keys.** The original secrets still exist in **git history** (commit `0416f99`) and
  in prior chat transcripts. Removing from tracking does **not** purge history. **Rotation in the
  Clerk / Supabase / Groq dashboards is the only real remediation.** After rotating, put the new
  values in `frontend/.env.local`.
- Optional: purge history with `git filter-repo`/BFG if you want the old values gone from history
  (destructive on shared remotes — coordinate first). Rotation makes this optional.

### Future security recommendations
- Add a lint/CI guard against importing server-only env in client code.
- Configure RLS thoroughly when Supabase goes live (deny-by-default).
- Add Vercel environment variables (Production/Preview) instead of relying on local `.env.local`.
- Consider a secret scanner (e.g. gitleaks) in CI.

---

## Completed Work Log

### Phase 0 — Secure the foundation
- **Goals:** Stop leaking secrets; establish a clean baseline.
- **Work completed:**
  - Inspected repo; identified committed live secrets and a wrong "Java project" claim.
  - Untracked `frontend/.env.local` (kept on disk).
  - Added `.gitignore`, `frontend/.env.example`, `.nvmrc` (Node 22).
  - Rewrote `CLAUDE.md` to reflect the real stack; expanded `README.md`.
  - Removed junk `sdfsfg.java`.
- **Files created:** `.gitignore`, `frontend/.env.example`, `.nvmrc` (+ edits to `CLAUDE.md`,
  `README.md`).
- **Important decisions:** Don't rewrite git history; rely on rotation. Keep `.env.local` on disk
  but ignored.
- **Result:** Clean, secret-free tracked tree.

### Phase 1 — Application foundation
- **Goals:** Scaffold a production-grade Next.js foundation per an explicit folder spec.
- **Work completed:**
  - Hand-built the app in `frontend/` (deliberate, file-by-file): Next 16 + React 19 + TS +
    Tailwind v3 + ESLint 9 flat config.
  - Created the full folder structure (`app/`, `components/{ui,layout,readouts}/`, `lib/`,
    `hooks/`, `types/`, `constants/`, `public/`).
  - Configured Clerk (`ClerkProvider`, middleware), Supabase (browser + server clients), fonts
    (Geist Sans + JetBrains Mono), `cn()` util, and the design-token system (light/dark).
  - Resolved an ESLint peer conflict (config-next v16 needs ESLint 9) and adopted
    `eslint-config-next`'s **native flat config** (dropped the broken FlatCompat shim). Swapped
    deprecated `next lint` for `eslint .`.
- **Files created:** `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`,
  `tailwind.config.ts`, `eslint.config.mjs`, `app/{layout,page}.tsx`, `app/globals.css`,
  `lib/utils.ts`, `lib/supabase/{client,server}.ts`, `middleware.ts` (later renamed),
  `types/index.ts`, `constants/site.ts`, placeholders.
- **Important decisions:** Tailwind **v3** (for `tailwind.config.ts` + tokens); service-role key
  kept server-only; tokens as the swappable design-system contract.
- **Result:** ✅ `npm run build` and `npm run lint` pass.

### Phase 2 — Authentication + Dashboard shell
- **Goals:** Google-only auth, protected dashboard, premium shell on mock data.
- **Work completed:**
  - Renamed `middleware.ts` → **`proxy.ts`** (Next 16 convention; deprecation warning gone).
  - Built Google-only auth with Clerk's **signals/Future API** (`signIn.sso` / `signUp.sso`);
    created `/sign-in`, `/sign-up`, `/sso-callback`; set `ClerkProvider` URLs.
  - Built the dashboard shell: `app/dashboard/{layout,page}.tsx`, `sidebar`, `topbar`, `logo`,
    `auth-shell`, and **five readouts** (welcome card greeting the real signed-in user via
    `currentUser()`, recent analyses, saved snippets, progress overview, quick actions).
  - Added UI primitives (`card`, `button`, `badge`, `icons`), `lib/mock-data.ts`, domain types,
    and landing-page auth links.
- **Files created:** `proxy.ts`, `app/sign-in/page.tsx`, `app/sign-up/page.tsx`,
  `app/sso-callback/page.tsx`, `app/dashboard/{layout,page}.tsx`,
  `components/ui/{card,button,badge,icons,google-auth-button}.tsx`,
  `components/layout/{logo,auth-shell,sidebar,topbar}.tsx`,
  `components/readouts/{welcome-card,recent-analyses,saved-snippets,progress-overview,quick-actions}.tsx`,
  `lib/mock-data.ts` (+ edits to `app/layout.tsx`, `app/page.tsx`, `types/index.ts`).
- **Important decisions:** Custom auth pages (not Clerk's prebuilt component) to enforce
  Google-only in code; adapted to Clerk v7 breaking changes (`UserButton` dropped
  `afterSignOutUrl`; legacy `authenticateWithRedirect` replaced by `.sso()`).
- **Result:** ✅ build + lint pass. Routes: `/`, `/sign-in`, `/sign-up`, `/sso-callback` (static),
  `/dashboard` (dynamic), Proxy active.

---

## Current Status Snapshot

| Area            | Status |
|-----------------|--------|
| **Landing Page**   | 🚧 Minimal placeholder — Logo + "Foundation ready" + Sign in / Open dashboard links. Not a real marketing/landing page. |
| **Authentication** | ✅ Implemented (Google-only, Clerk signals API). **Requires Google enabled in Clerk Dashboard** to work at runtime. |
| **Dashboard**      | ✅ Premium shell with 5 readouts on **mock data**. Sidebar nav items beyond Dashboard are marked "Soon". Desktop-only (sidebar hidden on mobile). |
| **Analyzer**       | ❌ Not started. No parser/engine/UI. |
| **Database**       | ⚙️ Configured (clients exist) but **unused** — no tables, queries, or RLS. |
| **AI**             | ❌ Not started. Groq key present; no code. |
| **Lessons**        | ❌ Not started. |
| **Quizzes**        | ❌ Not started. |
| **Deployment**     | ⚙️ Vercel-ready (no config needed) but **not yet deployed**. Set Vercel Root Directory = `frontend`. |

---

## Environment Variables

Defined in `frontend/.env.local` (git-ignored) and templated in `frontend/.env.example`.
**Placeholders only below — never commit real values.**

```bash
# Clerk (auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx   # client-side; safe to expose
CLERK_SECRET_KEY=sk_test_xxxxxxxx                    # SERVER-ONLY

# Supabase (database)
NEXT_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key          # client-side; RLS-guarded
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key      # SERVER-ONLY — full DB bypass

# Groq (AI — reserved, not yet used)
GROQ_API_KEY=gsk_xxxxxxxx                             # SERVER-ONLY
GROQ_MODEL=llama-3.3-70b-versatile                   # default model id

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Usage:**
- `NEXT_PUBLIC_*` are inlined into the client bundle — only put non-secret values here.
- `CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY` must only be read in server
  code (Route Handlers / Server Actions / server modules).
- In production, set these as **Vercel environment variables** (Production + Preview scopes).

---

## Technical Debt

- **All dashboard data is mock** (`lib/mock-data.ts`). No persistence.
- **Supabase clients are unused** — no schema, no queries, no RLS, no Clerk↔Supabase bridge.
- **Design system is placeholder** — neutral blue palette, not the Dark Lab / Signal Green spec.
- **Landing page is a stub** — not a real product landing experience.
- **Mobile responsiveness is incomplete** — sidebar is `hidden lg:flex`; no hamburger/drawer.
- **Quick actions & dashboard buttons are visual only** — no handlers/navigation.
- **Sidebar items `/analyses`, `/snippets`, `/progress`** are "Soon" placeholders (no routes).
- **No tests, no CI** — build + lint are the only gates.
- **Bleeding-edge deps** (Next 16, React 19, TS 6, Tailwind 3.4, Clerk 7 signals API) — watch for
  churn; Clerk's Future API is comparatively new.
- **Nothing committed** — Phases 0–2 sit in the working tree.

---

## Phase 3 Roadmap — Polish & Identity (next recommended phase)

**Theme:** Make it look and feel like ComplexityLab; prepare surfaces for real features.
**Priority order & deliverables:**

1. **Landing Page** — real dark-lab landing: hero, value props, CTA into sign-in. Replace the stub.
2. **Design primitives refinement** — implement the **Dark Lab / Signal Green** token values in
   `globals.css` + `tailwind.config.ts`; add the complexity gradient scale; refine
   `card/button/badge` for the neon-on-black aesthetic; add any missing primitives (e.g. `Input`,
   `Tabs`, `Tooltip`).
3. **Analyzer UI shell** — a `/dashboard/analyze` (or `/analyze`) **UI-only** page: code input,
   empty result/readout panels, mocked complexity output. **No engine yet.**
4. **Navigation polish** — wire real routes for sidebar items (even if pages are placeholders),
   active states, breadcrumbs.
5. **Mobile responsiveness** — hamburger + drawer sidebar, responsive grids, touch targets.

**Exit criteria:** Build + lint green; the app visually reflects the Dark Lab identity; analyzer
shell navigable on desktop + mobile with mock output.

---

## Future Roadmap

- **Phase 4 — Analyzer Engine:** Real complexity analysis. Parse/inspect submitted code (start
  with one language, e.g. JS/TS via an AST), infer time/space complexity heuristically, feed the
  analyzer UI shell. Likely a Route Handler / Server Action; keep it Vercel-native.
- **Phase 5 — Supabase Integration:** Schema (users, analyses, snippets, lessons, quiz_attempts,
  progress), RLS, typed client, and the **Clerk↔Supabase JWT bridge** (RLS keyed to Clerk `sub`).
  Replace mock data with real reads/writes. **This is the hardest integration — isolate and smoke-
  test the bridge first.**
- **Phase 6 — AI Features:** Groq-powered streaming optimization assistant / tutor via Route
  Handlers. Centralize the model id (`GROQ_MODEL`); handle rate limits/backoff.
- **Phase 7 — Lessons:** Content model + lesson pages (RSC), seeded curriculum (sorting, search,
  graphs, DP, recursion).
- **Phase 8 — Quizzes:** Quiz model, attempts, scoring, feedback tied to lessons.
- **Phase 9 — Progress Tracking:** Persist completion/streaks/skill metrics (replace mock bars);
  per-user dashboards.
- **Phase 10 — Production Hardening:** Tests (Vitest + Playwright), CI, error boundaries,
  observability, performance budgets, security review, Vercel production deploy.

---

## Development Rules (every future session must follow)

1. **Inspect the repository before coding.** Read this file, `CLAUDE.md`, and the relevant code.
2. **Explain architecture before major changes.** State the plan and trade-offs first.
3. **Explain files before creating them.** Especially for multi-file work.
4. **Prefer minimal deployable solutions.** Smallest thing that works; iterate.
5. **Reuse the existing design system / primitives.** Don't duplicate; extend.
6. **Avoid overengineering.** No microservices, no premature abstraction, no extra deps without
   justification.
7. **Keep Vercel compatibility.** Route Handlers / Server Actions; app stays in `frontend/`.
8. **Keep TypeScript strict.** No `any` dumping; type the domain.
9. **Prefer mock data until backend work is explicitly required.** Don't wire Supabase casually.
10. **Never commit secrets.** Keep `.env.local` ignored; server-only keys stay server-only.
11. **Verify with `npm run build` and `npm run lint`** before declaring work done.
12. **Don't commit unless asked.** Leave changes staged for review.

---

## Session Notes (project journal)

This repository began as a near-empty shell: 6 tracked files, a one-line README, a `CLAUDE.md`
that incorrectly described it as a Java project, and a `frontend/.env.local` that — alarmingly —
contained **live** Clerk, Supabase (including the all-powerful service-role key), and Groq
credentials committed to git. The first priority was therefore **security and truth-in-docs**, not
features.

**Phase 0** stopped the bleeding: the env file was untracked (but preserved on disk), a proper
`.gitignore` and `.env.example` were added, Node was pinned, and the docs were corrected to reflect
reality. A deliberate decision was made **not** to rewrite git history (destructive on a shared
remote); instead the standing guidance is to **rotate** the keys, which renders the historical
copies useless. The user later re-shared the same keys and asked that they be kept private — the
honest position recorded here is that an assistant cannot act as a private secret vault; the
durable protection is git-ignoring (done) plus **rotation** (still owed by the user).

**Phase 1** established the foundation. Rather than running a black-box generator, the app was
built file-by-file for full control and explainability. "Latest stable" Next.js resolved to **16**
(not 15), pulling React 19, TypeScript 6, ESLint 9, and the rest of a notably bleeding-edge stack.
A key design call: **Tailwind v3**, because the explicit requirement for a `tailwind.config.ts`
plus a theme-token system is the v3 idiom (v4 is CSS-first and config-less). Tooling friction was
real — ESLint 9 + `eslint-config-next` v16 required the package's **native flat config** (the older
FlatCompat shim threw a circular-JSON error), and `next lint` is gone in 16, so the lint script now
calls the ESLint CLI directly. The design system was implemented as **CSS-variable tokens** so the
entire look can be re-skinned from two files.

**Phase 2** delivered authentication and a premium dashboard shell. The "Google Sign-In only"
requirement was honored **in code** via custom auth pages rather than Clerk's prebuilt widget.
This surfaced the biggest surprise of the project: **Clerk v7** ships a new **signals/Future API** —
`useSignIn()` now returns `{ signIn: SignInFutureResource }` (no `isLoaded`, no
`authenticateWithRedirect`); the correct call is `signIn.sso({ strategy: "oauth_google",
redirectUrl, redirectCallbackUrl })`. `UserButton` also dropped `afterSignOutUrl` (moved to
`ClerkProvider`). Both were discovered by reading the installed type definitions directly and then
adapted. The dashboard was built as Server Components with a sidebar/topbar shell and five
"instrument-panel" readouts; the welcome card uses the **real** signed-in user via `currentUser()`
while everything else is mock. `middleware.ts` was renamed to `proxy.ts` per Next 16, clearing the
deprecation warning.

Throughout, the working style was: inspect first, explain before creating, verify with build +
lint, and **never commit without being asked**. As of this handoff, Phases 0–2 are complete and
green, but **uncommitted** — they await review.

---

## Immediate Next Action

**Begin Phase 3, item 1 + 2 together: implement the Dark Lab visual identity, then build the real
landing page on top of it.**

Concretely, the next session should:
1. Replace the placeholder token values in `frontend/app/globals.css` and
   `frontend/tailwind.config.ts` with the **Dark Lab / Signal Green** palette + complexity
   gradient (dark-first).
2. Refine `components/ui/{card,button,badge}` for neon-on-black.
3. Rebuild `frontend/app/page.tsx` into a real landing page (hero, value props, CTA → `/sign-in`).
4. Run `npm run build` && `npm run lint`; keep changes uncommitted for review.

Before that, remind the user to **(a) rotate the exposed keys** and **(b) enable Google in the
Clerk Dashboard** so auth works at runtime.

---

## Quick Start For New Claude Sessions

**You are looking at ComplexityLab — an interactive algorithm & complexity-learning web app.**

- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind **v3** · Clerk (auth) ·
  Supabase (db, unused so far) · Groq (AI, not built). App lives in **`frontend/`**.
- **Done:** Phase 0 (security cleanup), Phase 1 (foundation), Phase 2 (Google-only Clerk auth +
  dashboard shell on **mock data**). **Build + lint pass. Nothing committed.**
- **Not built:** real landing page, analyzer engine, AI, lessons, quizzes, DB queries/RLS, mobile
  nav. The "Dark Lab / Signal Green" design system is **spec only** — current palette is a neutral
  blue **placeholder**.
- **Run it:** `cd frontend && npm install && npm run dev` → http://localhost:3000.
  Verify with `npm run build` and `npm run lint`.
- **Auth caveat:** Google must be enabled in the **Clerk Dashboard** for sign-in to work.
- **Security:** `.env.local` is git-ignored (good); the previously-committed keys **still need
  rotating**. Service-role / secret keys are **server-only**.
- **Rules:** reuse design tokens + UI primitives, stay Vercel-native (Route Handlers / Server
  Actions), keep TS strict, prefer mock data until backend is required, don't overengineer, and
  **don't commit unless asked.**
- **Next task:** Phase 3 — implement the Dark Lab design tokens, then build the real landing page.
  See [Immediate Next Action](#immediate-next-action).

*End of handoff.*
