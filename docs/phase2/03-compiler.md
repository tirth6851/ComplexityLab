# Phase 2 · Feature 3 — Online Compiler (Monaco + Judge0)

> **Complexity: M (~2 days).** Reuses the existing Monaco `CodeEditor`. One new
> route, one backend proxy, one new quota table. **Execution is fully isolated
> from AI analysis** — separate route, separate rate-limit key, separate quota.

---

## Architecture

```
/playground (client island)
  ├─ CodeEditor (reuse components/analyzer/code-editor.tsx — Monaco, dynamic import)
  ├─ stdin textarea  ·  language select (7 langs)  ·  [Run]
  └─ ResultPanel: status badge · stdout · stderr/compile_output · time/memory
        │  POST /api/execute { language, code, stdin }
        ▼
  app/api/execute/route.ts  (auth → quota → validate → Judge0 → normalize)
        │  server-only JUDGE0_API_KEY (never reaches the browser)
        ▼
  Judge0 CE (RapidAPI)  — runs code in its own isolate sandbox
```

**Decision (resolved):** **Judge0 CE via RapidAPI**, free tier, for speed-to-ship
(no infra to run). Server-side key only. Self-hosting is a future cost/scale
option — note it, don't build it. *(Confirm hosting choice in index "Decisions".)*

**Decision (resolved):** call Judge0 with **`?wait=true&base64_encoded=true`**
and a capped wall-time (≤ 8s), so the route is a single synchronous request —
no polling, no submission-token state. Safe against Vercel function duration:
set the route's `maxDuration = 15` and Judge0 `wall_time_limit` to 8s, leaving
margin. (If RapidAPI's free tier disables `wait`, fall back to poll-with-backoff,
≤ 5 polls × 1s — documented in the route, but try `wait=true` first.)

---

## Execution flow (`/api/execute`)

1. `auth()` → 401 if signed out (mirror `/api/analyze`).
2. **Per-minute burst:** in-memory `rateLimit()` key `execute` (e.g. 10/min).
3. **Per-day quota:** DB count from `code_executions` for today (UTC) ≥
   `EXECUTE_DAILY_QUOTA` → 429 with a friendly message. *(In-memory limiter
   can't enforce daily — must be DB-backed. See index cross-cutting note.)*
4. Validate: `code` non-empty string ≤ `MAX_EXEC_CODE_LENGTH` (smaller than the
   analyze cap — e.g. 20,000); `language` in execute allow-list; `stdin` string
   ≤ 4,000 chars.
5. Map language → Judge0 `language_id` (`lib/execute/languages.ts`).
6. POST to Judge0 with base64 source/stdin and resource limits (below). 12s
   `AbortController` timeout.
7. **Normalize** Judge0 response → `ExecutionResult` (below). Decode base64.
8. **Record** the execution in `code_executions` (for quota + analytics) — store
   metadata only (status, time, memory, language), **never store stdout/stdin/
   code content** unless product decides otherwise (privacy parity with analyze).
9. Log `execute.complete` / `execute.error` (no code/stdout in logs).

---

## Resource limits (sent to Judge0)

| Field | Value | Why |
|---|---|---|
| `cpu_time_limit` | 5 (s) | per-run CPU ceiling |
| `wall_time_limit` | 8 (s) | hard wall clock |
| `memory_limit` | 128000 (KB ≈ 128 MB) | cap RAM |
| `stack_limit` | 64000 | prevent deep-recursion blowups |
| stdout/stderr cap | Judge0 default + truncate to 64 KB in our normalizer | bound payload |

---

## Language support (`lib/execute/languages.ts`)

Map the 7 app languages to Judge0 CE language IDs (verify against the live
`/languages` endpoint — IDs drift between Judge0 versions):

```ts
export const JUDGE0_LANGS: Record<string, number> = {
  python:     71,   // Python 3.x
  javascript: 93,   // Node.js
  typescript: 94,   // TypeScript
  java:       62,
  go:         60,
  rust:       73,
  cpp:        54,   // C++ (GCC)
};
export const isExecutable = (id: string) => id in JUDGE0_LANGS;
```

> Keep this list a **subset/parallel** of `lib/analysis/languages.ts` — same 7
> ids, but a separate map so execution support can diverge from analysis support.

---

## Result handling & errors

```ts
// lib/execute/types.ts
export interface ExecutionResult {
  status: "accepted" | "compile_error" | "runtime_error" | "time_limit" | "error";
  statusLabel: string;        // Judge0 description, e.g. "Accepted"
  stdout: string | null;      // decoded, truncated
  stderr: string | null;
  compileOutput: string | null;
  timeMs: number | null;      // Judge0 "time" (s) → ms
  memoryKb: number | null;
}
```

Status mapping from Judge0 `status.id`: 3→accepted, 6→compile_error,
7–12→runtime_error (signals/RE), 5→time_limit, else→error. Surface
`compile_output` for compile errors, `stderr` for runtime errors. Network/timeout
to Judge0 → `{ status:"error", statusLabel:"Execution service unavailable" }`
(graceful, like the Groq fallback ethos — but there's no local fallback for
execution; just a clean error state).

UI `ResultPanel`: colored status badge (reuse tier colors loosely — green
accepted, red error), monospace stdout block, collapsible stderr/compile output,
`time`/`memory` chips. Live region (`role="status"`) announces completion (a11y
parity with the analyzer results panel).

---

## Database

### Migration `supabase/migrations/20260616000200_executions.sql`

```sql
create table if not exists public.code_executions (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  language    text not null,
  status      text not null,        -- normalized ExecutionResult.status
  time_ms     integer,
  memory_kb   integer,
  created_at  timestamptz not null default now()
);
create index if not exists code_executions_profile_created_idx
  on public.code_executions (profile_id, created_at desc);

alter table public.code_executions enable row level security;  -- service-role only
```

Daily quota query: `count(*) where profile_id = ? and created_at >= utc_midnight`.

### Data layer `lib/db/executions.ts`

- `countExecutionsToday(): DbResult<number>` — for the quota gate.
- `recordExecution(meta): DbResult<null>` — insert metadata post-run.

---

## Files

**New**
- `frontend/app/(app)/playground/page.tsx` (+ `loading.tsx`) — route + shell entry.
- `frontend/components/playground/playground.tsx` — client island (editor + stdin
  + run + results); reuses `code-editor.tsx`.
- `frontend/components/playground/execution-result.tsx`
- `frontend/app/api/execute/route.ts` — the proxy (`export const maxDuration = 15`).
- `frontend/lib/execute/languages.ts`, `frontend/lib/execute/types.ts`,
  `frontend/lib/execute/judge0.ts` (client wrapper: build request, call, normalize).
- `frontend/lib/db/executions.ts`
- Tests: `tests/integration/execute-route.test.ts` (auth/validation/quota/normalize,
  Judge0 fetch mocked), `tests/unit/judge0-normalize.test.ts`,
  `tests/components/execution-result.test.tsx`.

**Modified**
- `frontend/lib/limits.ts` — add `EXECUTE_RATE_LIMIT`, `EXECUTE_DAILY_QUOTA`,
  `MAX_EXEC_CODE_LENGTH`.
- `frontend/.env.example` — add `JUDGE0_API_KEY`, `JUDGE0_API_HOST`,
  `JUDGE0_BASE_URL` (RapidAPI) — server-only.
- Sidebar nav (`components/layout/*`) — add "Playground" entry.

---

## Security

- `JUDGE0_API_KEY` is **server-only** (route handler env); never in a Client
  Component or `NEXT_PUBLIC_*`.
- Input hardening: size cap, language allow-list, stdin cap — before any outbound
  call.
- The sandbox boundary is Judge0's `isolate` — we never `eval`/exec user code in
  our own runtime. The proxy only forwards.
- Strict per-user rate limit + DB daily quota (execution is the most abusable
  surface — cost + DoS vector). 429 with `Retry-After`.
- Privacy: don't log or persist code/stdout/stdin (metadata only).

---

## Risk

- **External dependency / cost:** RapidAPI free tier has monthly call caps and can
  rate-limit us globally; surface a clean "service unavailable / quota reached"
  state and alert via logs. Self-host is the scale path.
- **Language-ID drift:** Judge0 IDs change across versions — verify against
  `/languages` on setup; centralized in one map so a fix is one edit.
- **No determinism guarantee:** execution time/memory vary; present as indicative,
  not authoritative (this complements, doesn't replace, the analyzer's Big-O).
