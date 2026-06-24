/**
 * One-shot handoff of a pre-composed message into the AI Chat via sessionStorage.
 * Survives client navigation without hitting the URL (messages can be long).
 * Client-only: call exclusively from client components/effects.
 */

const KEY = "cl-chat-handoff";

export interface ChatHandoff {
  /** The pre-composed message to populate the chat input on arrival. */
  initialMessage: string;
}

export function setChatHandoff(handoff: ChatHandoff): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(handoff));
  } catch {
    // Storage unavailable — chat opens with empty input.
  }
}

/** Read AND clear the pending handoff (one-shot). */
export function takeChatHandoff(): ChatHandoff | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as { initialMessage?: unknown };
    if (typeof parsed.initialMessage !== "string" || !parsed.initialMessage.trim()) {
      return null;
    }
    return { initialMessage: parsed.initialMessage };
  } catch {
    return null;
  }
}
