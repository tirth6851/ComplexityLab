import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client (service role). SERVER-ONLY — the `server-only`
 * import makes any client-bundle leak a build error.
 *
 * The service role bypasses RLS, so every query made with this client MUST be
 * scoped by the signed-in Clerk user (see lib/db/profiles|analyses|snippets).
 */

let cached: SupabaseClient | null = null;

/** True when the env carries enough config to reach the database. */
export function isDbConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function getAdminClient(): SupabaseClient {
  if (!isDbConfigured()) {
    throw new Error(
      "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing).",
    );
  }
  if (!cached) {
    cached = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return cached;
}

/** Non-throwing result wrapper used across the data layer. */
export type DbResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Wrap a thrown DB error into a non-throwing result. The raw provider message
 * (which can leak schema/PostgREST internals) is logged **server-side only**;
 * the `error` returned to the UI is always the caller's friendly `fallback`,
 * so end users never see internal database text. Callers that need to branch on
 * a specific condition (e.g. `PGRST116` not-found) must inspect the error
 * **before** delegating here.
 */
export function dbError<T>(error: unknown, fallback: string): DbResult<T> {
  const detail =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);
  console.error("[db]", detail || fallback);
  return { ok: false, error: fallback };
}
