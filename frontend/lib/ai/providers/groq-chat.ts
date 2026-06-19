import type { ChatProvider, ChatMessage, ChatStreamOpts } from "../chat-provider";
import { groqStream, DEFAULT_CHAT_MODEL } from "../groq-client";

/**
 * Groq chat provider — streams assistant responses via the OpenAI-compatible
 * SSE API. Server-only by construction (GROQ_API_KEY never leaves the server).
 *
 * Unlike the analysis provider, chat has NO deterministic fallback — if the
 * stream fails, the route emits an apologetic assistant turn. Errors propagate
 * as thrown exceptions; callers must handle them.
 */
export const groqChatProvider: ChatProvider = {
  id: "groq",
  name: "Groq Chat",

  async *stream(
    messages: ChatMessage[],
    opts?: ChatStreamOpts,
  ): AsyncGenerator<string, void, unknown> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.startsWith("<")) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    yield* groqStream(messages, {
      model: process.env.CHAT_MODEL ?? DEFAULT_CHAT_MODEL,
      temperature: 0.7,
      maxTokens: 1024,
      signal: opts?.signal,
      onUsage: opts?.onUsage,
    });
  },
};
