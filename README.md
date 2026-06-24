# ComplexityLab

An interactive web app for learning **algorithms and computational complexity** — with an AI-powered code analyzer, a code playground, an AI tutor, guided learning coaches, and per-user progress tracking.

**Production:** https://complexity-lab-eight.vercel.app

---

## Features

| Feature | Description |
|---|---|
| **Analyzer** | Paste or upload code → get Big-O time + space complexity via Groq LLM with a deterministic heuristic fallback. Save results to your history. |
| **Analyses** | Browse and revisit every saved analysis with full detail view. |
| **Snippets** | Save reusable code snippets with tags. |
| **Playground** | Run code in 7 languages (Python, TypeScript, JavaScript, Java, Go, Rust, C++) via Judge0 CE. Send results straight to the AI tutor. |
| **AI Chat** | Streaming AI tutor powered by Groq. Context-aware: accepts handoffs from the Analyzer and Playground. 50 messages/day, 20/minute burst limit. |
| **Learning Hub** | Guided AI coaches — DSA Coach (algorithms & data structures) and OOP Coach (object-oriented design). Roadmap: Git, CLI, SQL coaches. |
| **Progress** | XP, levels, streaks, achievements, and a daily activity chart. |
| **Dashboard** | Personal stats — analyses run, languages used, top complexity class, streaks. |
| **Settings** | Display name, preferred language, account deletion. |

---

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Auth:** Clerk (Google-only sign-in)
- **Database:** Supabase (Postgres with Row Level Security)
- **AI inference:** Groq (`llama-3.3-70b-versatile`) + deterministic heuristic fallback
- **Code execution:** Judge0 CE via RapidAPI
- **Deployment:** Vercel (auto-deploy from `main` — pushing main = deploying production)

---

## Getting started

```bash
cd frontend
cp .env.example .env.local   # fill in your real keys — see .env.example for details
npm install
npm run dev                  # http://localhost:3000
```

### Required environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk auth (public) |
| `CLERK_SECRET_KEY` | Clerk auth (server-only) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (**server-only, never expose to client**) |
| `GROQ_API_KEY` | Groq LLM inference (server-only) |
| `JUDGE0_API_KEY` | RapidAPI key for Judge0 CE code execution (server-only) |
| `NEXT_PUBLIC_APP_URL` | App base URL (e.g. `http://localhost:3000`) |

---

## Development workflow

All commands run from `frontend/`:

```bash
npm run dev        # dev server → http://localhost:3000
npm run typecheck  # TypeScript strict check (0 errors required)
npm run lint       # ESLint 9 flat config (0 errors, 0 warnings required)
npm run build      # production build (all routes must compile)
npm run test       # Vitest — all tests must pass
```

All four gates must be green before any merge.

---

## Architecture

```
Browser
  └── Next.js (App Router) — frontend/
        ├── public: /, /sign-in, /sign-up, /sso-callback, /privacy, /terms
        ├── protected (app): /dashboard, /analyzer, /analyses/*, /snippets,
        │                    /chat, /playground, /progress, /settings/*,
        │                    /learning, /learning/dsa, /learning/oop
        │     └── auth enforced in proxy.ts (Clerk)
        ├── POST /api/analyze  → lib/ai → Groq → heuristic fallback
        ├── POST /api/execute  → lib/execute/judge0 → Judge0 CE
        ├── POST /api/chat     → lib/ai → Groq (streaming SSE)
        │                         ↳ coachType param selects DSA/OOP system prompt
        └── Server Actions     → lib/action-limit → lib/db → Supabase
```

Key invariants:
- `lib/db/admin.ts` imports `server-only` — client import fails the build by design
- `proxy.ts` (not `middleware.ts`) — Next.js 16 convention in this project
- Route handlers + pages receive `params` as `Promise` (Next 16 — must `await`)
- `DbResult<T>` never throws — pages always branch on `.ok`

---

## Security

- `.env.local` is git-ignored and must never be committed
- The Supabase **service-role key**, **Clerk secret key**, **Groq API key**, and **Judge0 API key** are server-only and must never reach the browser
- Every route handler: authenticated → validated → DB access
- Rate limits on every AI route (in-memory burst + DB-backed daily quota)
- RLS deny-by-default on every Supabase table
