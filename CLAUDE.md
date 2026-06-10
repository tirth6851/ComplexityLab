# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ComplexityLab is an interactive web app for learning algorithms and computational
complexity (Big-O). It features an algorithm catalog, animated visualizers, an
AI tutor, and per-user progress tracking.

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

- `HANDOFF.md` — project state, history, and rules for new sessions
- `ARCHITECTURE.md` — current technical architecture (routes, AI layer, DB, tests)
- `ROADMAP.md` — completed phases and future priorities
- `DESIGN_HANDOFF.md` — design-system inventory (tokens, primitives, motion)

## MCP Server

A [Firecrawl](https://github.com/mendableai/firecrawl-mcp-server) MCP server is
configured in `.vscode/mcp.json`. It requires a `FIRECRAWL_API_KEY` (prompted at
runtime via VS Code input). This enables web scraping and crawling from within the editor.
