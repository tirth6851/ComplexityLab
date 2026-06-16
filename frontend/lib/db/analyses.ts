import "server-only";

import type { Analysis, AnalysisDetail } from "@/types";
import type { CodeAnalysis } from "@/lib/ai/types";
import { TITLE_MAX_LENGTH } from "@/lib/limits";
import { dbError, getAdminClient, type DbResult } from "./admin";
import { mapAnalysis, mapAnalysisDetail, type AnalysisRow } from "./mappers";
import { getOrCreateProfile } from "./profiles";

/** Analyses, always scoped to the signed-in user's profile. */

export async function listAnalyses(
  limit = 50,
): Promise<DbResult<Analysis[]>> {
  const profile = await getOrCreateProfile();
  if (!profile.ok) return profile;

  try {
    const db = getAdminClient();
    const res = await db
      .from("analyses")
      .select("*")
      .eq("profile_id", profile.data.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (res.error) throw res.error;
    return { ok: true, data: (res.data as AnalysisRow[]).map(mapAnalysis) };
  } catch (e) {
    return dbError(e, "Could not load your analyses.");
  }
}

export async function getAnalysis(
  id: string,
): Promise<DbResult<AnalysisDetail>> {
  const profile = await getOrCreateProfile();
  if (!profile.ok) return profile;

  try {
    const db = getAdminClient();
    const res = await db
      .from("analyses")
      .select("*")
      .eq("id", id)
      .eq("profile_id", profile.data.id)
      .single<AnalysisRow>();
    if (res.error) {
      if (res.error.code === "PGRST116")
        return { ok: false, error: "Analysis not found." };
      throw res.error;
    }
    return { ok: true, data: mapAnalysisDetail(res.data) };
  } catch (e) {
    return dbError(e, "Could not load the analysis.");
  }
}

export interface NewAnalysis {
  title: string;
  language: string;
  code: string;
  analysis: CodeAnalysis;
}

export async function createAnalysis(
  input: NewAnalysis,
): Promise<DbResult<Analysis>> {
  const profile = await getOrCreateProfile();
  if (!profile.ok) return profile;

  try {
    const db = getAdminClient();
    const res = await db
      .from("analyses")
      .insert({
        profile_id: profile.data.id,
        title: input.title.slice(0, TITLE_MAX_LENGTH),
        language: input.language,
        code: input.code,
        time_complexity: input.analysis.time.notation,
        space_complexity: input.analysis.space.notation,
        verdict: input.analysis.verdict,
        result: input.analysis,
      })
      .select("*")
      .single<AnalysisRow>();
    if (res.error) throw res.error;
    return { ok: true, data: mapAnalysis(res.data) };
  } catch (e) {
    return dbError(e, "Could not save the analysis.");
  }
}

export async function deleteAnalysis(id: string): Promise<DbResult<null>> {
  const profile = await getOrCreateProfile();
  if (!profile.ok) return profile;

  try {
    const db = getAdminClient();
    const res = await db
      .from("analyses")
      .delete()
      .eq("id", id)
      .eq("profile_id", profile.data.id);
    if (res.error) throw res.error;
    return { ok: true, data: null };
  } catch (e) {
    return dbError(e, "Could not delete the analysis.");
  }
}
