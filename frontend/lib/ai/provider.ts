import type { AnalyzeCodeInput, CodeAnalysis } from "./types";

/**
 * Provider abstraction for analysis backends.
 *
 * Adding a new LLM vendor = one file in `lib/ai/providers/` implementing
 * `AnalysisProvider`, plus a registry entry in `lib/ai/index.ts`. Nothing
 * else in the app changes.
 *
 * WHY an interface + registry instead of direct imports? The route handler,
 * the UI, and the persistence layer all speak CodeAnalysis — they don't care
 * whether Groq, GPT-4, or a local heuristic produced it. The interface is the
 * contract that lets us swap the backend with an env-var change instead of a
 * code change. This is the Strategy pattern.
 */

export const PROVIDER_IDS = [
  "mock",
  "groq",
  "openai",
  "anthropic",
  "gemini",
] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export interface AnalysisProvider {
  readonly id: ProviderId;
  /** Human-readable name, surfaced in results ("Analyzed by …"). */
  readonly name: string;
  analyze(input: AnalyzeCodeInput): Promise<CodeAnalysis>;
}

export function isProviderId(value: string): value is ProviderId {
  return (PROVIDER_IDS as readonly string[]).includes(value);
}
