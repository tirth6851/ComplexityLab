import {
  isChatProviderId,
  type ChatProvider,
  type ChatProviderId,
} from "./chat-provider";
import { mockChatProvider } from "./providers/mock-chat";
import { groqChatProvider } from "./providers/groq-chat";

export type { ChatProvider, ChatProviderId };
export type { ChatMessage, ChatStreamOpts } from "./chat-provider";

/** Implemented chat providers. */
const REGISTRY: Partial<Record<ChatProviderId, ChatProvider>> = {
  mock: mockChatProvider,
  groq: groqChatProvider,
};

/**
 * When CHAT_PROVIDER isn't set, prefer Groq if a real key is configured,
 * else the deterministic mock. Same heuristic as the analysis registry.
 */
function defaultChatProviderId(): ChatProviderId {
  const key = process.env.GROQ_API_KEY;
  return key && !key.startsWith("<") ? "groq" : "mock";
}

/**
 * Resolve the active chat provider. Selection is env-driven (`CHAT_PROVIDER`),
 * so flipping vendors is a config change — not a rewrite.
 */
export function getChatProvider(id?: string): ChatProvider {
  const requested = (id ?? process.env.CHAT_PROVIDER) || defaultChatProviderId();
  if (!isChatProviderId(requested)) {
    throw new Error(
      `Unknown chat provider "${requested}". Valid ids: mock, groq.`,
    );
  }
  const provider = REGISTRY[requested];
  if (!provider) {
    throw new Error(
      `Chat provider "${requested}" is not implemented yet. Use "mock" (default).`,
    );
  }
  return provider;
}
