import type { AnalyzeCodeInput, CodeAnalysis } from "./types";

/**
 * Provider abstraction for analysis backends.
 *
 * Adding a new LLM vendor = one file in `lib/ai/providers/` implementing
 * `AnalysisProvider`, plus a registry entry in `lib/ai/index.ts`. Nothing
 * else in the app changes.
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
