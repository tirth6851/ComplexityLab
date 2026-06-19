/**
 * ChatProvider abstraction — mirrors AnalysisProvider but for streaming chat.
 *
 * Kept separate from AnalysisProvider (different call signature, different
 * streaming vs. batch semantics, different fallback strategy). Adding a new
 * LLM vendor for chat = one file in `lib/ai/providers/` + a registry entry
 * in `lib/ai/chat.ts`. Nothing else changes.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatStreamOpts {
  /** External AbortSignal from the route handler (e.g. maxDuration timeout). */
  signal?: AbortSignal;
  /** Called once when the provider delivers actual token counts.
   *  If never called, callers fall back to char/4 estimates. */
  onUsage?: (tokensIn: number, tokensOut: number) => void;
}

export const CHAT_PROVIDER_IDS = ["mock", "groq"] as const;
export type ChatProviderId = (typeof CHAT_PROVIDER_IDS)[number];

export interface ChatProvider {
  readonly id: ChatProviderId;
  readonly name: string;
  /**
   * Stream assistant response token-by-token.
   * Yields text deltas; callers accumulate into a full response string.
   * Throws on unrecoverable errors (network, key missing, HTTP failure).
   * Chat has no deterministic fallback — callers emit an apologetic message.
   */
  stream(
    messages: ChatMessage[],
    opts?: ChatStreamOpts,
  ): AsyncGenerator<string, void, unknown>;
}

export function isChatProviderId(value: string): value is ChatProviderId {
  return (CHAT_PROVIDER_IDS as readonly string[]).includes(value);
}
