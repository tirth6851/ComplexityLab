# ComplexityLab

An interactive web app for learning **algorithms and computational complexity** —
with an algorithm catalog, animated visualizers, an AI tutor, and per-user progress
tracking.

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Clerk** — authentication
- **Supabase** — Postgres database with Row Level Security
- **Groq** — LLM inference for the AI tutor

## Getting started

```bash
cd frontend
cp .env.example .env.local   # then fill in your real keys
npm install
npm run dev                  # http://localhost:3000
```

> The app is currently being scaffolded. See `CLAUDE.md` for conventions.

## Security

`.env.local` is git-ignored and must never be committed. The Supabase
**service-role key** is server-only and must never reach the browser.
