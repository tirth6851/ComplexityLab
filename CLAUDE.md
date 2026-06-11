# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ComplexityLab is an interactive web app for learning algorithms and computational
complexity (Big-O). **Shipped today:** an AI-powered complexity analyzer (Groq with
deterministic heuristic fallback), saved analyses with a detail view, snippets, a
stats dashboard, and settings. **Vision (not yet built):** algorithm catalog,
animated visualizers, AI tutor, lessons/quizzes — see `PRD.md`.

**Production:** https://complexity-lab-eight.vercel.app — GitHub `main`
auto-deploys, so **pushing main = deploying production**. The Vercel project's
Root Directory is `frontend`.

## Stack

- **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS — app lives in `frontend/`
- **Auth:** Clerk
- **Database:** Supabase (Postgres + Row Level Security)
- **LLM inference:** Groq

## Conventions

- The Supabase **service-role key is server-only**. Never import it into a Client
  Component or expose it to the browser. Privileged DB access goes through Server
  Actions / Route Handlers using server-only modules.
- Secrets live in `frontend/.env.local` (git-ignored). Copy `frontend/.env.example`
  and fill in real values. Never commit real keys.

## Commands

Run from `frontend/`:

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run lint` — lint
- `npm run typecheck` — TypeScript check (`tsc --noEmit`)
- `npm run test` — run the Vitest suite (`npm run test:watch` for watch mode)

## Key documents

**Read `MISSION_CONTROL.md` first** — current sprint, active tasks, blockers.

- `PRD.md` — product requirements (vision, users, stories, metrics, scope)
- `TRD.md` — technical requirements (API contracts, schema, AI layer, security)
- `APP_FLOW.md` — end-to-end user flows, error states, mobile notes
- `HANDOFF.md` — project state, history, and rules for new sessions
- `ARCHITECTURE.md` — current technical architecture (routes, AI layer, DB, tests)
- `ROADMAP.md` — completed phases and future priorities
- `DESIGN_HANDOFF.md` — design-system inventory (tokens, primitives, motion)
- Project memory: `OPERATING_MANUAL.md` (principles) · `MISSION_CONTROL.md`
  (sprint status) · `SECOND_BRAIN.md` (decisions, lessons, known issues, patterns) ·
  `RULES_OF_ENGAGEMENT.md` (hard session rules)

## MCP Server

A [Firecrawl](https://github.com/mendableai/firecrawl-mcp-server) MCP server is
configured in `.vscode/mcp.json`. It requires a `FIRECRAWL_API_KEY` (prompted at
runtime via VS Code input). This enables web scraping and crawling from within the editor.
