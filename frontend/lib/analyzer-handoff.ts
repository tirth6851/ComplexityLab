import { isLanguageId, type LanguageId } from "@/lib/analysis/languages";

/**
 * One-shot handoff of a code buffer into the analyzer via sessionStorage
 * (survives the client navigation, never hits the URL — code can be 100KB).
 * Client-only: call exclusively from client components/effects.
 */

const KEY = "cl-analyzer-handoff";

export interface AnalyzerHandoff {
  code: string;
  language: LanguageId;
}

export function setAnalyzerHandoff(handoff: AnalyzerHandoff): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(handoff));
  } catch {
    // Storage unavailable — the analyzer will just open with its default.
  }
}

/** Read AND clear the pending handoff (one-shot). */
export function takeAnalyzerHandoff(): AnalyzerHandoff | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as { code?: unknown; language?: unknown };
    if (typeof parsed.code !== "string" || parsed.code.length === 0) {
      return null;
    }
    if (typeof parsed.language !== "string" || !isLanguageId(parsed.language)) {
      return null;
    }
    return { code: parsed.code, language: parsed.language };
  } catch {
    return null;
  }
}
