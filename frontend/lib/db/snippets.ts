import "server-only";

import type { Snippet } from "@/types";
import { TITLE_MAX_LENGTH } from "@/lib/limits";
import { dbError, getAdminClient, type DbResult } from "./admin";
import { mapSnippet, type SnippetRow } from "./mappers";
import { getOrCreateProfile } from "./profiles";

/** Saved snippets, always scoped to the signed-in user's profile. */

export async function listSnippets(limit = 50): Promise<DbResult<Snippet[]>> {
  const profile = await getOrCreateProfile();
  if (!profile.ok) return profile;

  try {
    const db = getAdminClient();
    const res = await db
      .from("saved_snippets")
      .select("*")
      .eq("profile_id", profile.data.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (res.error) throw res.error;
    return { ok: true, data: (res.data as SnippetRow[]).map(mapSnippet) };
  } catch (e) {
    return dbError(e, "Could not load your snippets.");
  }
}

export interface NewSnippet {
  title: string;
  language: string;
  code: string;
  tags?: string[];
}

export async function createSnippet(
  input: NewSnippet,
): Promise<DbResult<Snippet>> {
  const profile = await getOrCreateProfile();
  if (!profile.ok) return profile;

  try {
    const db = getAdminClient();
    const res = await db
      .from("saved_snippets")
      .insert({
        profile_id: profile.data.id,
        title: input.title.slice(0, TITLE_MAX_LENGTH),
        language: input.language,
        code: input.code,
        tags: (input.tags ?? []).slice(0, 8).map((t) => t.slice(0, 32)),
      })
      .select("*")
      .single<SnippetRow>();
    if (res.error) throw res.error;
    return { ok: true, data: mapSnippet(res.data) };
  } catch (e) {
    return dbError(e, "Could not save the snippet.");
  }
}

export async function deleteSnippet(id: string): Promise<DbResult<null>> {
  const profile = await getOrCreateProfile();
  if (!profile.ok) return profile;

  try {
    const db = getAdminClient();
    const res = await db
      .from("saved_snippets")
      .delete()
      .eq("id", id)
      .eq("profile_id", profile.data.id);
    if (res.error) throw res.error;
    return { ok: true, data: null };
  } catch (e) {
    return dbError(e, "Could not delete the snippet.");
  }
}
