# CLAUDE.md

This file is automatically read by Claude Code at the start of every session.
It is the permanent contract between this codebase and AI-assisted development.

---

## Project

ComplexityLab is an interactive web app for learning algorithms and computational
complexity (Big-O). **Shipped today:** an AI-powered complexity analyzer (Groq with
deterministic heuristic fallback), saved analyses with a detail view, snippets, a
stats dashboard, XP/levels/streaks/achievements, and settings.
**Vision (not yet built):** algorithm catalog, animated visualizers, AI tutor,
lessons/quizzes — see `PRD.md`.

**Production:** https://complexity-lab-eight.vercel.app — GitHub `main`
auto-deploys, so **pushing main = deploying production**. The Vercel project's
Root Directory is `frontend`.

---

## Stack

- **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS — app lives in `frontend/`
- **Auth:** Clerk (Google-only, dev instance — must upgrade to production before public launch)
- **Database:** Supabase (Postgres + Row Level Security)
- **LLM inference:** Groq (`llama-3.3-70b-versatile`), deterministic heuristic fallback
- **Testing:** Vitest + Testing Library (jsdom)
- **Deployment:** Vercel (auto-deploy from `main`; Root Dir = `frontend`)

---

## AI Development Rules

**Read `AI_RULES.md` before starting any feature.**
It defines the mandatory workflow: understand → implement → test → fix → document.
Every feature must pass all gates before moving on.

---

## Coding Standards

### General
- TypeScript strict mode everywhere — no `any`, no type suppressions without a comment
- Server Components by default; use Client Components (`"use client"`) only for interactivity (state, effects, browser APIs)
- No new dependencies without strong justification — keep the bundle small
- No hardcoded colors — use design tokens from `app/tokens.css` (Monaco themes are the one sanctioned exception)
- No comments explaining WHAT the code does — only WHY (non-obvious constraints, workarounds, subtle invariants)

### Security (non-negotiable)
- `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`, `GROQ_API_KEY`, `JUDGE0_API_KEY` — **server-only, always**
- Never use `NEXT_PUBLIC_*` for anything sensitive
- `lib/db/admin.ts` imports `server-only` — a client import fails the build by design
- Never commit `.env.local` — copy from `.env.example`
- Every new Route Handler and Server Action must: authenticate first, validate input, then access DB

### Data Layer
- All DB access via `lib/db/*` (server-only, Clerk-scoped, `DbResult<T>` returns)
- `DbResult<T>` never throws — pages branch on `.ok`; error states render gracefully
- `getOrCreateProfile()` is the standard first step in any authenticated DB function
- RLS is deny-by-default on every table — application code scopes by ownership
- Migrations live in `supabase/migrations/` — one file per feature, additive only (no drops/renames on existing tables)

### Rate Limiting
- Every Route Handler: `rateLimit()` (per-minute burst, in-memory)
- Every Server Action: `checkActionLimit()` as the very first line
- Daily quotas (for AI, execution): DB-backed `COUNT` — in-memory cannot enforce these

### Error Handling
- `dbError()` for DB failures — logs raw text server-side, returns friendly copy to users
- Route Handlers: return structured `{ error }` JSON; never expose internal stack traces
- Never surface Supabase/Clerk error codes to end users

---

## Architecture

Full detail in `ARCHITECTURE.md`. Key invariants:

```
Browser
  └── Next.js (App Router) — `frontend/`
        ├── public routes: /, /sign-in, /sign-up, /sso-callback, /privacy, /terms
        ├── protected (app) shell: /dashboard, /analyzer, /analyses/*, /snippets, /settings/*
        │     └── protection enforced in proxy.ts (Clerk)
        ├── POST /api/analyze  → lib/ai → Groq → fallback heuristic
        ├── POST /api/execute  → lib/execute/judge0 → Judge0 CE      [Phase 2 F3, planned]
        ├── POST /api/chat     → lib/ai → Groq (streaming)            [Phase 2 F4, planned]
        └── Server Actions     → lib/action-limit → lib/db → Supabase
```

- `lib/ai` registry: `AnalysisProvider` interface, `AI_PROVIDER` env selects provider
- Heuristic engine: always runs as fallback; doubles as test oracle
- `proxy.ts` (not `middleware.ts`) — Next.js 16 convention in this project
- Route handlers + pages receive `params` as `Promise` (Next 16 — must `await`)

---

## Testing Workflow

Run all gates from `frontend/`:

```bash
npm run typecheck   # 0 errors required
npm run lint        # 0 errors, 0 warnings required
npm run build       # all routes must compile
npm run test        # all tests must pass (currently 299 tests / 36 files)
```

**All four gates must be green before any commit or feature is considered done.**

### Test structure
```
tests/
  unit/        — pure functions (engine, levels, achievements, stats, etc.)
  components/  — rendered components with Testing Library
  integration/ — routes and Server Actions (DB mocked via vitest stubs)
```

### Testing rules
- `server-only` is aliased to a stub in `vitest.config.ts` (the real package throws outside RSC)
- Monaco is never rendered in tests (dynamic import → SSR false → doesn't load in jsdom)
- Use real timers for components with animations (fake timers deadlock React's scheduler in jsdom)
- New feature = new test files. No net test debt — every feature lands its tests.
- The engine's 18 sample templates are both samples AND test fixtures (samples-as-fixtures pattern)

---

## Naming Conventions

| Context | Convention | Example |
|---|---|---|
| Files (components) | kebab-case | `save-dialog.tsx` |
| Files (lib/utils) | kebab-case | `derive-title.ts` |
| React components | PascalCase | `SaveDialog` |
| Server Actions | camelCase + `Action` suffix | `saveAnalysisAction` |
| DB functions | camelCase | `getAnalysis`, `awardProgress` |
| Types | PascalCase | `DbResult`, `ProgressState` |
| CSS tokens | kebab-case | `--text-muted`, `--signal-green` |
| Test files | mirror source path | `tests/components/save-dialog.test.tsx` |

---

## Project Philosophy

1. **The analyzer is the wedge.** Everything else (progress, chat, community) exists to make the analyzer more valuable and the habit more durable.
2. **Graceful degradation always.** `DbResult<T>` means pages render in error/empty states — never crash because the DB isn't provisioned.
3. **Determinism first.** The heuristic engine always runs. Groq enhances; it never replaces correctness.
4. **Security by default.** Service-role key, deny-by-default RLS, rate limits on everything, code content never logged.
5. **No mock data.** The product works on real data or shows an honest empty state.
6. **Design system is the source of truth.** Never hardcode colors; never redesign outside of `components/ui` primitives and `tokens.css`.
7. **Additive architecture.** Phase 2+ features are additive — no refactors of the existing core unless named explicitly.

---

## Important Commands

All run from `frontend/`:

```bash
npm run dev        # dev server → http://localhost:3000
npm run build      # production build (must be green before merging)
npm run lint       # ESLint 9 flat config
npm run typecheck  # tsc --noEmit
npm run test       # Vitest (all tests)
npm run test:watch # Vitest watch mode (for TDD)
```

Git:
```bash
# Never push main directly unless deploying
# feature branches: feature/<name>
# Pushing main = deploying production
git push origin feature/<name>
```

---

## MCP Usage

### Playwright MCP (`.playwright-mcp/`)
Use for visual testing against the live dev server or production URL.
- Start dev server first: `npm run dev` (in `frontend/`)
- Use to verify UI before declaring a feature complete
- Test: happy path, error states, mobile layout, empty states
- Production URL: https://complexity-lab-eight.vercel.app

### Firecrawl MCP (`.vscode/mcp.json`)
Configured for web scraping/crawling from within the editor.
Requires `FIRECRAWL_API_KEY` (prompted at runtime in VS Code).

### Supabase MCP
The claude.ai Supabase MCP is connected to a **different account** than the one
that owns this project. Migrations **cannot** be applied via MCP — they must be
applied manually via the Supabase Dashboard SQL editor for project `hhnmxyyrihrpyerdmgdw`.

### Vercel MCP / CLI
The local Vercel CLI token is dead (403) — run `vercel login` if needed.
The claude.ai Vercel MCP can view deployments and logs but cannot apply env vars.

---

## How to Update Docs

After every feature, update **all** of the following that are affected:

| Document | When to update |
|---|---|
| `MISSION_CONTROL.md` | Every session — current sprint, blockers, health gates |
| `PROJECT_BACKLOG.md` | Move items from "Planned" to "Completed"; update "In Progress"; add new ideas |
| `HANDOFF.md` | After each completed feature — add to Completed Work and Feature Status Matrix |
| `SECOND_BRAIN.md` | When an architectural decision is made or a new lesson is learned |
| `ROADMAP.md` | After shipping — move items from future to completed |
| `ARCHITECTURE.md` | When new routes, tables, or providers are added |
| `TRD.md` | When API contracts or schema change |

**Do not leave documentation stale.** Future sessions depend on it.

---

## Key Documents (reading order for a new session)

1. **`MISSION_CONTROL.md`** — start here every session (sprint, blockers, health gates)
2. **`PROJECT_BACKLOG.md`** — full feature backlog; single source of truth for what to build
3. **`AI_RULES.md`** — mandatory workflow rules for every implementation task
4. **`HANDOFF.md`** — full project history, feature status matrix, environment setup
5. **`PHASE2_PLAN.md`** — Phase 2 architecture (F3 Compiler, F4 Chat, F5 Community)
6. `ARCHITECTURE.md` — current technical architecture (routes, AI layer, DB, tests)
7. `TRD.md` — API contracts, DB schema, security requirements
8. `PRD.md` — product vision, user stories, success metrics
9. `SECOND_BRAIN.md` — decisions, lessons learned, reusable patterns
10. `DESIGN_HANDOFF.md` — design system tokens, primitives, motion

---

## Definition of Done

A feature is **only complete** when all of the following are true:

- [ ] Feature implemented
- [ ] `npm run typecheck` — 0 errors
- [ ] `npm run lint` — 0 errors, 0 warnings
- [ ] `npm run build` — all routes compile
- [ ] `npm run test` — all tests pass (no regressions)
- [ ] New tests written for the feature (unit + integration + component)
- [ ] Playwright MCP test of the happy path
- [ ] Error states tested (bad input, DB failure, rate limit)
- [ ] Mobile layout verified (responsive)
- [ ] No `console.error` in the browser during normal usage
- [ ] Documentation updated: `MISSION_CONTROL.md`, `PROJECT_BACKLOG.md`, `HANDOFF.md`
- [ ] No secrets hardcoded or committed
