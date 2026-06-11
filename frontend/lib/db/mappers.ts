import type { Analysis, AnalysisDetail, Profile, Snippet } from "@/types";
import type { CodeAnalysis } from "@/lib/ai/types";

/**
 * Supabase row shapes and row → domain mappers. Pure functions (no client,
 * no server-only import) so they are unit-testable in isolation.
 */

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
    result: (row.result as CodeAnalysis) ?? null,
  };
}

export function mapSnippet(row: SnippetRow): Snippet {
  return {
    id: row.id,
    title: row.title,
    language: row.language,
    tags: row.tags ?? [],
    savedAt: row.created_at,
  };
}
