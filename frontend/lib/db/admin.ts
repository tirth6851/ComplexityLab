import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client (service role). SERVER-ONLY — the `server-only`
 * import makes any client-bundle leak a build error.
 *
 * The service role bypasses Postgres Row Level Security (RLS). This is
 * intentional: Clerk manages auth, not Supabase, so RLS can't scope by Clerk
 * user. The responsibility falls on our code: every query in lib/db/* MUST
 * filter by `profile_id` (the internal user id). Adding a new DB function
 * without that filter would expose all users' data to each other.
 *
 * The bridge from Clerk → profile_id is getOrCreateProfile() in lib/db/profiles.ts.
 * Call it first in every DB function; its return value scopes all subsequent queries.
 */

let cached: SupabaseClient | null = null;

/**
 * True when the env carries enough config to reach the database.
 * Pages that call DB functions check this via DbResult — they render an honest
 * empty/error state rather than crashing when the DB is not provisioned.
 */
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
