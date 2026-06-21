import type { ChatProvider, ChatMessage, ChatStreamOpts } from "../chat-provider";

const MOCK_WORDS = [
  "I", " can", " help", " you", " analyze", " this", " code.", " The",
  " algorithm", " appears", " to", " run", " in", " linear", " time,",
  " O(n),", " iterating", " through", " each", " element", " once.",
  " Space", " complexity", " is", " O(1)", " if", " no", " additional",
  " data", " structures", " are", " allocated.",
];

/**
 * Mock chat provider — yields a canned response word-by-word.
 * Used in tests and when no GROQ_API_KEY is configured.
 * Calls `onUsage` with rough estimates so the usage-bump path is exercised.
 */
export const mockChatProvider: ChatProvider = {
  id: "mock",
  name: "Mock Chat",

  async *stream(
    messages: ChatMessage[],
    opts?: ChatStreamOpts,
  ): AsyncGenerator<string, void, unknown> {
    for (const word of MOCK_WORDS) {
      if (opts?.signal?.aborted) break;
      yield word;
    }

    const inputChars = messages.reduce((s, m) => s + m.content.length, 0);
    const outputChars = MOCK_WORDS.join("").length;
    opts?.onUsage?.(Math.ceil(inputChars / 4), Math.ceil(outputChars / 4));
  },
};
