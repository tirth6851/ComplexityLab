# ComplexityLab — Rules of Engagement

> **Project memory · hard rules.** Binding for every session, human or AI.
> Violating these is a bug, not a style choice.

## Process

1. **Inspect before coding.** Read `MISSION_CONTROL.md` (current state) →
   `HANDOFF.md` (history/rules) → the relevant code. Never assume docs are current —
   verify against the tree.
2. **Explain the implementation plan before writing code.**
3. **Wait for approval before large architectural changes** — new tables/migrations,
   new dependencies, route restructures, auth changes, provider swaps.
4. **Keep project memory current:** update `MISSION_CONTROL.md` (status, blockers)
   every working session; append to `SECOND_BRAIN.md` when a decision is made or a
   lesson is learned.

## Code

5. **Reuse the existing design system** — `components/ui` primitives + CSS-variable
   tokens. Never hardcode colors (single documented exception: Monaco editor themes
   mirror token hexes by hand — keep them in sync).
6. **Avoid unnecessary dependencies.** Prefer hand-rolling small things over adding
   packages; any new dependency needs explicit justification.
7. **TypeScript stays strict.** No `any` escape hatches, no `@ts-ignore` without an
   explanatory comment.
8. **Server Components by default;** `"use client"` only for interactivity.
9. **DB access only via `lib/db/*`.** Server-only, Clerk-scoped, `DbResult<T>`
   returns — and callers must handle the error arm.
10. **Secrets are server-only.** `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`,
    `GROQ_API_KEY` never reach client code; `lib/db/admin.ts` imports `server-only`
    so a leak fails the build.

## Verification

11. **Before declaring anything done**, from `frontend/`:
    ```
    npm run typecheck && npm run lint && npm run build && npm run test
    ```
12. **Never commit unless explicitly instructed.** Never push without explicit
    instruction — **pushing `main` deploys production** (Vercel auto-deploy).
13. **Never commit secrets.** `.env.local` is git-ignored and stays that way.
14. **Never log user code content** — structured logs carry metadata only
    (a privacy-policy commitment, not just a preference).

---

*Last updated: 2026-06-10.*
