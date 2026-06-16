import type { Analysis, AnalysisDetail, Profile, Snippet } from "@/types";
import type { CodeAnalysis } from "@/lib/ai/types";

/**
 * Supabase row shapes and row → domain mappers. Pure functions (no client,
 * no server-only import) so they are unit-testable in isolation.
 */

/** Minimal shape check — avoids crashing ResultsPanel on corrupt/legacy rows. */
function isCodeAnalysis(v: unknown): v is CodeAnalysis {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.verdict === "string" &&
    typeof r.time === "object" && r.time !== null &&
    typeof r.space === "object" && r.space !== null
  );
}

export interface ProfileRow {
  id: string;
  clerk_user_id: string;
  display_name: string | null;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export interface AnalysisRow {
  id: string;
  profile_id: string;
  title: string;
  language: string;
  code: string;
  time_complexity: string;
  space_complexity: string;
  verdict: string;
  result: unknown;
  created_at: string;
}

export interface SnippetRow {
  id: string;
  profile_id: string;
  title: string;
  language: string;
  code: string;
  tags: string[];
  created_at: string;
}

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    displayName: row.display_name,
    preferredLanguage: row.preferred_language,
    createdAt: row.created_at,
  };
}

export function mapAnalysis(row: AnalysisRow): Analysis {
  return {
    id: row.id,
    title: row.title,
    language: row.language,
    timeComplexity: row.time_complexity,
    spaceComplexity: row.space_complexity,
    verdict: row.verdict,
    createdAt: row.created_at,
  };
}

export function mapAnalysisDetail(row: AnalysisRow): AnalysisDetail {
  return {
    ...mapAnalysis(row),
    code: row.code,
    result: isCodeAnalysis(row.result) ? row.result : null,
  };
}

export function mapSnippet(row: SnippetRow): Snippet {
  return {
    id: row.id,
    title: row.title,
    language: row.language,
    code: row.code,
    tags: row.tags ?? [],
    savedAt: row.created_at,
  };
}
