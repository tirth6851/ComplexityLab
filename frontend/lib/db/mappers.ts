import type { Analysis, AnalysisDetail, Conversation, Message, Profile, Snippet } from "@/types";
import type { CodeAnalysis } from "@/lib/ai/types";

/**
 * Supabase row shapes and row → domain mappers. Pure functions (no client,
 * no server-only import) so they are unit-testable in isolation.
 *
 * This is the anti-corruption layer between the database schema (snake_case,
 * raw JSON columns) and the app's domain types (camelCase, typed objects).
 * The rest of the app never talks directly to raw row shapes — it always
 * receives the mapped domain type, which insulates the UI from DB column renames.
 */

/**
 * Runtime guard for the `result` JSON column, which is untyped in Supabase.
 * Old analyses saved before the current CodeAnalysis shape was finalized may
 * be missing fields, so we validate before handing the data to the UI rather
 * than trusting a cast.
 */
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

// ── F4 Chat ──────────────────────────────────────────────────────────────────

export interface ConversationRow {
  id: string;
  profile_id: string;
  title: string;
  context_type: string | null;
  context_ref_id: string | null;
  context_metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  token_count: number | null;
  created_at: string;
}

export function mapConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    profileId: row.profile_id,
    title: row.title,
    contextType: row.context_type,
    contextRefId: row.context_ref_id,
    contextMetadata: row.context_metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as Message["role"],
    content: row.content,
    tokenCount: row.token_count,
    createdAt: row.created_at,
  };
}
