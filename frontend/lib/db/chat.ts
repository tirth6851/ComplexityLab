import "server-only";

import type { AiUsageToday, Conversation, Message } from "@/types";
import {
  dbError,
  getAdminClient,
  isDbConfigured,
  type DbResult,
} from "./admin";
import {
  mapConversation,
  mapMessage,
  type ConversationRow,
  type MessageRow,
} from "./mappers";

/**
 * Chat data layer - all functions take a resolved `profileId` so the route
 * can call `getOrCreateProfile()` once and thread the id through, avoiding
 * redundant profile lookups per request.
 *
 * Privacy: message content is persisted (required for history) but NEVER
 * included in `logEvent` calls or metrics.
 */

// -- Conversations -------------------------------------------------------------

export interface ConversationContext {
  type: string;
  refId: string;
  metadata?: Record<string, unknown>;
}

export async function createConversation(
  profileId: string,
  title: string,
  context?: ConversationContext,
): Promise<DbResult<Conversation>> {
  if (!isDbConfigured()) return { ok: false, error: "Database not configured." };
  try {
    const db = getAdminClient();
    const res = await db
      .from("chat_conversations")
      .insert({
        profile_id: profileId,
        title,
        context_type: context?.type ?? null,
        context_ref_id: context?.refId ?? null,
        context_metadata: context?.metadata ?? null,
      })
      .select("*")
      .single<ConversationRow>();
    if (res.error) throw res.error;
    return { ok: true, data: mapConversation(res.data) };
  } catch (e) {
    return dbError(e, "Could not create conversation.");
  }
}

export async function getConversation(
  profileId: string,
  conversationId: string,
): Promise<DbResult<Conversation>> {
  if (!isDbConfigured()) return { ok: false, error: "Database not configured." };
  try {
    const db = getAdminClient();
    const res = await db
      .from("chat_conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("profile_id", profileId)
      .maybeSingle<ConversationRow>();
    if (res.error) throw res.error;
    if (!res.data) return { ok: false, error: "Conversation not found." };
    return { ok: true, data: mapConversation(res.data) };
  } catch (e) {
    return dbError(e, "Could not load conversation.");
  }
}

// -- Messages ------------------------------------------------------------------

export async function listMessages(
  profileId: string,
  conversationId: string,
  limit = 12,
): Promise<DbResult<Message[]>> {
  if (!isDbConfigured()) return { ok: false, error: "Database not configured." };
  try {
    const db = getAdminClient();
    // Inner join via conversation ownership check
    const ownership = await db
      .from("chat_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("profile_id", profileId)
      .maybeSingle<{ id: string }>();
    if (ownership.error) throw ownership.error;
    if (!ownership.data) return { ok: false, error: "Conversation not found." };

    // Load the last `limit` messages in chronological order
    const res = await db
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit)
      .returns<MessageRow[]>();
    if (res.error) throw res.error;
    return { ok: true, data: res.data.reverse().map(mapMessage) };
  } catch (e) {
    return dbError(e, "Could not load messages.");
  }
}

export async function appendMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string,
  tokenCount?: number,
): Promise<DbResult<Message>> {
  if (!isDbConfigured()) return { ok: false, error: "Database not configured." };
  try {
    const db = getAdminClient();
    const res = await db
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        role,
        content,
        token_count: tokenCount ?? null,
      })
      .select("*")
      .single<MessageRow>();
    if (res.error) throw res.error;
    return { ok: true, data: mapMessage(res.data) };
  } catch (e) {
    return dbError(e, "Could not save message.");
  }
}

// -- Usage / Quota -------------------------------------------------------------

export async function getUsageToday(
  profileId: string,
): Promise<DbResult<AiUsageToday>> {
  if (!isDbConfigured()) return { ok: false, error: "Database not configured." };
  try {
    const db = getAdminClient();
    const today = new Date().toISOString().slice(0, 10); // UTC date YYYY-MM-DD
    const res = await db
      .from("ai_usage")
      .select("message_count, tokens_in, tokens_out")
      .eq("profile_id", profileId)
      .eq("day", today)
      .maybeSingle<{ message_count: number; tokens_in: number; tokens_out: number }>();
    if (res.error) throw res.error;
    if (!res.data) {
      return { ok: true, data: { messageCount: 0, tokensIn: 0, tokensOut: 0 } };
    }
    return {
      ok: true,
      data: {
        messageCount: res.data.message_count,
        tokensIn: res.data.tokens_in,
        tokensOut: res.data.tokens_out,
      },
    };
  } catch (e) {
    return dbError(e, "Could not read usage.");
  }
}

export async function bumpUsage(
  profileId: string,
  msgs: number,
  tokensIn: number,
  tokensOut: number,
): Promise<DbResult<null>> {
  if (!isDbConfigured()) return { ok: false, error: "Database not configured." };
  try {
    const db = getAdminClient();
    const { error } = await db.rpc("bump_ai_usage", {
      p_profile: profileId,
      p_msgs: msgs,
      p_in: tokensIn,
      p_out: tokensOut,
    });
    if (error) throw error;
    return { ok: true, data: null };
  } catch (e) {
    return dbError(e, "Could not record usage.");
  }
}
