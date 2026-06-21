import { auth } from "@clerk/nextjs/server";
import { logEvent } from "@/lib/log";
import { rateLimit } from "@/lib/rate-limit";
import {
  CHAT_RATE_LIMIT,
  CHAT_DAILY_QUOTA,
  MAX_CHAT_MESSAGE_LENGTH,
  CHAT_HISTORY_LIMIT,
} from "@/lib/limits";
import { getOrCreateProfile } from "@/lib/db/profiles";
import {
  getUsageToday,
  createConversation,
  getConversation,
  listMessages,
  appendMessage,
  bumpUsage,
  type ConversationContext,
} from "@/lib/db/chat";
import { getChatProvider } from "@/lib/ai/chat";
import { chatSystemPrompt, buildChatMessages } from "@/lib/ai/prompts/chat";
import { retrieveContext } from "@/lib/ai/rag/retriever";

/**
 * Allow up to 30 s for the stream to complete — chat responses can be long.
 * Judge0's wall_time_limit equivalent for Groq is handled by groq-client's
 * internal AbortController (30 s timeout in groqStream).
 */
export const maxDuration = 30;

/**
 * POST /api/chat — context-aware streaming chat.
 *
 * Pipeline:
 *   1. auth()                  → 401 if signed out
 *   2. parse + validate body   → 400 on bad input
 *   3. getOrCreateProfile()    → resolve profile_id (threaded to all DB calls)
 *   4. getUsageToday           → 429 if daily quota reached; allow+log on failure
 *   5. rateLimit (in-memory)   → 429 burst guard
 *   6. get / create conversation
 *   7. load history + build prompt messages
 *   8. persist user message    → PRE-STREAM (survives client disconnect)
 *   9. return streaming Response
 *      - yields text deltas to client as SSE
 *      - finally: persist assistant message + bump ai_usage (best-effort)
 *
 * Privacy: message content is never included in logEvent metadata.
 * Token accounting: actual counts from Groq's usage SSE chunk; char/4 fallback.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Sign in to use the AI tutor." }, { status: 401 });
  }

  // ── 1. Parse and validate body ─────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    message,
    conversationId,
    contextRef,
  } = (body ?? {}) as {
    message?: unknown;
    conversationId?: unknown;
    contextRef?: unknown;
  };

  if (typeof message !== "string" || message.trim().length === 0) {
    return Response.json({ error: "Provide a message." }, { status: 400 });
  }
  if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
    return Response.json(
      { error: `Message is too long (max ${MAX_CHAT_MESSAGE_LENGTH.toLocaleString()} characters).` },
      { status: 400 },
    );
  }

  const trimmedMessage = message.trim();
  const conversationIdStr =
    typeof conversationId === "string" && conversationId.length > 0
      ? conversationId
      : null;

  // Validate optional context ref
  let parsedContextRef: ConversationContext | undefined;
  if (
    contextRef !== null &&
    contextRef !== undefined &&
    typeof contextRef === "object" &&
    !Array.isArray(contextRef)
  ) {
    const ref = contextRef as Record<string, unknown>;
    if (typeof ref.type === "string" && typeof ref.refId === "string") {
      parsedContextRef = { type: ref.type, refId: ref.refId };
    }
  }

  // ── 2. Resolve profile (once — threaded to all DB calls) ──────────────────
  const profileResult = await getOrCreateProfile();
  if (!profileResult.ok) {
    return Response.json({ error: "Could not load your profile." }, { status: 500 });
  }
  const profileId = profileResult.data.id;

  // ── 3. Daily quota guard (DB-backed) ──────────────────────────────────────
  const usageResult = await getUsageToday(profileId);
  if (!usageResult.ok) {
    logEvent("chat.quota_check_failed", { userId, error: usageResult.error });
    // Graceful degrade — allow and log (same pattern as F3 execute)
  } else if (usageResult.data.messageCount >= CHAT_DAILY_QUOTA) {
    logEvent("chat.daily_quota_reached", {
      userId,
      count: usageResult.data.messageCount,
    });
    return Response.json(
      {
        error: `Daily chat limit reached (${CHAT_DAILY_QUOTA} messages). Resets at midnight UTC.`,
      },
      { status: 429 },
    );
  }

  // ── 4. Per-minute burst guard (in-memory, per warm instance) ──────────────
  const limit = rateLimit(`chat:${userId}`, CHAT_RATE_LIMIT);
  if (!limit.ok) {
    const retryAfterSec = Math.max(1, Math.ceil(limit.retryAfterMs / 1000));
    logEvent("chat.rate_limited", { userId, retryAfterSec });
    return Response.json(
      { error: `Too many messages — try again in ${retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": `${retryAfterSec}` } },
    );
  }

  // ── 5. Get or create conversation ─────────────────────────────────────────
  let conversationIdFinal: string;

  if (conversationIdStr) {
    const convResult = await getConversation(profileId, conversationIdStr);
    if (!convResult.ok) {
      return Response.json({ error: "Conversation not found." }, { status: 404 });
    }
    conversationIdFinal = convResult.data.id;
  } else {
    const title = trimmedMessage.slice(0, 80);
    const convResult = await createConversation(profileId, title, parsedContextRef);
    if (!convResult.ok) {
      return Response.json({ error: "Could not start conversation." }, { status: 500 });
    }
    conversationIdFinal = convResult.data.id;
  }

  // ── 6. Load history + build prompt ────────────────────────────────────────
  const historyResult = await listMessages(
    profileId,
    conversationIdFinal,
    CHAT_HISTORY_LIMIT,
  );
  const history = historyResult.ok
    ? historyResult.data
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
    : [];

  const ragContext = retrieveContext(trimmedMessage, 3);
  const system = chatSystemPrompt({ ragContext: ragContext.length ? ragContext : undefined });
  const messages = buildChatMessages({
    system,
    history,
    userMessage: trimmedMessage,
    historyLimit: CHAT_HISTORY_LIMIT,
  });

  // ── 7. Persist user message PRE-STREAM (survives client disconnect) ────────
  const userMsgResult = await appendMessage(
    conversationIdFinal,
    "user",
    trimmedMessage,
  );
  if (!userMsgResult.ok) {
    logEvent("chat.persist_user_failed", { userId, error: userMsgResult.error });
    // Non-fatal — continue streaming; the assistant turn will still be persisted
  }

  // ── 8. Build input token estimate as fallback for usage accounting ─────────
  const estimatedTokensIn = Math.ceil(
    messages.reduce((sum, m) => sum + m.content.length, 0) / 4,
  );

  // ── 9. Stream ─────────────────────────────────────────────────────────────
  const provider = getChatProvider();
  const conversationIdToEmit = conversationIdFinal;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      let assistantContent = "";
      let tokensIn = 0;
      let tokensOut = 0;

      try {
        for await (const chunk of provider.stream(messages, {
          onUsage: (tIn, tOut) => {
            tokensIn = tIn;
            tokensOut = tOut;
          },
        })) {
          assistantContent += chunk;
          send({ text: chunk });
        }

        send({ done: true, conversationId: conversationIdToEmit });
      } catch (e) {
        const reason = e instanceof Error ? e.message : "unknown";
        logEvent("chat.stream_error", { userId, reason });
        send({ error: "The AI encountered an error. Please try again." });
      } finally {
        // Best-effort: persist assistant message and bump usage.
        // Runs even if the client disconnected — the stream lifecycle is server-side.
        if (assistantContent) {
          const assistantTokens = tokensOut || Math.ceil(assistantContent.length / 4);
          const assistantResult = await appendMessage(
            conversationIdFinal,
            "assistant",
            assistantContent,
            assistantTokens,
          );
          if (!assistantResult.ok) {
            logEvent("chat.persist_assistant_failed", {
              userId,
              error: assistantResult.error,
            });
          }
        }

        const usageBump = await bumpUsage(
          profileId,
          1, // 1 user turn
          tokensIn || estimatedTokensIn,
          tokensOut || Math.ceil(assistantContent.length / 4),
        );
        if (!usageBump.ok) {
          logEvent("chat.bump_usage_failed", { userId, error: usageBump.error });
        }

        controller.close();
      }
    },
  });

  logEvent("chat.stream_started", {
    userId,
    conversationId: conversationIdFinal,
    provider: provider.id,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
