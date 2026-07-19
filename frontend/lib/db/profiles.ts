import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import type { Profile } from "@/types";
import { dbError, getAdminClient, isDbConfigured, type DbResult } from "./admin";
import { mapProfile, type ProfileRow } from "./mappers";

/**
 * Profile access. Every entry point resolves the signed-in Clerk user itself,
 * so callers can never query another user's data by mistake.
 *
 * WHY a separate "profile" table at all? Clerk owns identity (login, sessions,
 * OAuth). Supabase owns app data. getOrCreateProfile() is the bridge — it maps
 * a Clerk userId (external) to an internal profile row (our DB). That internal
 * id is what all other tables (analyses, snippets, xp_events) foreign-key on,
 * which keeps Clerk's internal ids out of our schema.
 */

/**
 * Resolves the signed-in user's internal profile, creating it on first visit.
 *
 * Handles a race condition: on a user's very first request, two concurrent
 * requests (e.g. two tabs opening simultaneously) could both try to INSERT the
 * profile. The insert that loses gets a unique-constraint error; we catch it,
 * re-read the winner's row, and return that instead of propagating the error.
 */
export async function getOrCreateProfile(): Promise<DbResult<Profile>> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in." };
  if (!isDbConfigured()) return { ok: false, error: "Database not configured." };

  try {
    const db = getAdminClient();

    const existing = await db
      .from("profiles")
      .select("*")
      .eq("clerk_user_id", userId)
      .maybeSingle<ProfileRow>();
    if (existing.error) throw existing.error;
    if (existing.data) return { ok: true, data: mapProfile(existing.data) };

    // First visit — create the profile, seeding the name from Clerk.
    const user = await currentUser();
    const displayName =
      user?.fullName || user?.firstName || user?.username || null;

    const inserted = await db
      .from("profiles")
      .insert({ clerk_user_id: userId, display_name: displayName })
      .select("*")
      .single<ProfileRow>();
    if (inserted.error) {
      // Lost a create race: another request inserted it first — re-read.
      const retry = await db
        .from("profiles")
        .select("*")
        .eq("clerk_user_id", userId)
        .maybeSingle<ProfileRow>();
      if (retry.data) return { ok: true, data: mapProfile(retry.data) };
      throw inserted.error;
    }
    return { ok: true, data: mapProfile(inserted.data) };
  } catch (e) {
    return dbError(e, "Could not load your profile.");
  }
}

/**
 * Danger zone: delete the user's profile row. `on delete cascade` wipes all
 * analyses and snippets with it. A fresh profile is recreated on next visit.
 */
export async function deleteProfileData(): Promise<DbResult<null>> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in." };
  if (!isDbConfigured()) return { ok: false, error: "Database not configured." };

  try {
    const db = getAdminClient();
    const res = await db
      .from("profiles")
      .delete()
      .eq("clerk_user_id", userId);
    if (res.error) throw res.error;
    return { ok: true, data: null };
  } catch (e) {
    return dbError(e, "Could not delete your data.");
  }
}

export interface ProfileUpdate {
  displayName?: string | null;
  preferredLanguage?: string;
}

export async function updateProfile(
  update: ProfileUpdate,
): Promise<DbResult<Profile>> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in." };
  if (!isDbConfigured()) return { ok: false, error: "Database not configured." };

  const patch: Partial<ProfileRow> = {};
  if (update.displayName !== undefined) patch.display_name = update.displayName;
  if (update.preferredLanguage !== undefined) {
    patch.preferred_language = update.preferredLanguage;
  }
  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "Nothing to update." };
  }

  try {
    const db = getAdminClient();
    const updated = await db
      .from("profiles")
      .update(patch)
      .eq("clerk_user_id", userId)
      .select("*")
      .single<ProfileRow>();
    if (updated.error) throw updated.error;
    return { ok: true, data: mapProfile(updated.data) };
  } catch (e) {
    return dbError(e, "Could not update your profile.");
  }
}
