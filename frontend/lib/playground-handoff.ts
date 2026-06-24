/**
 * One-shot handoff of a code buffer into the Playground via sessionStorage.
 * Survives client navigation without hitting the URL (code can be 100 KB).
 * Client-only: call exclusively from client components/effects.
 */

import { isLanguageId, type LanguageId } from "@/lib/analysis/languages";

const KEY = "cl-playground-handoff";

export interface PlaygroundHandoff {
  code: string;
  language: LanguageId;
}

export function setPlaygroundHandoff(handoff: PlaygroundHandoff): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(handoff));
  } catch {
    // Storage unavailable — playground opens with its default.
  }
}

/** Read AND clear the pending handoff (one-shot). */
export function takePlaygroundHandoff(): PlaygroundHandoff | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as { code?: unknown; language?: unknown };
    if (typeof parsed.code !== "string" || !parsed.code) return null;
    if (typeof parsed.language !== "string" || !isLanguageId(parsed.language)) {
      return null;
    }
    return { code: parsed.code, language: parsed.language };
  } catch {
    return null;
  }
}
