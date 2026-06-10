import { isProviderId, type AnalysisProvider, type ProviderId } from "./provider";
import { mockProvider } from "./providers/mock";
import { groqProvider } from "./providers/groq";

export type { AnalysisProvider, ProviderId };
export type {
  AnalyzeCodeInput,
  CodeAnalysis,
  ComplexityFinding,
  AnalysisMetric,
} from "./types";

/** Implemented providers. Unlisted ids are scaffolded but not yet built. */
const REGISTRY: Partial<Record<ProviderId, AnalysisProvider>> = {
  mock: mockProvider,
  groq: groqProvider,
};

/**
 * Resolve the active analysis provider. Selection is env-driven
 * (`AI_PROVIDER`), defaulting to the deterministic mock engine, so flipping
 * to a real LLM later is a config change — not a rewrite.
 */
export function getAnalysisProvider(id?: string): AnalysisProvider {
  const requested = id ?? process.env.AI_PROVIDER ?? "mock";
  if (!isProviderId(requested)) {
    throw new Error(
      `Unknown AI provider "${requested}". Valid ids: mock, groq, openai, anthropic, gemini.`,
    );
  }
  const provider = REGISTRY[requested];
  if (!provider) {
    throw new Error(
      `AI provider "${requested}" is not implemented yet. Use "mock" (default).`,
    );
  }
  return provider;
}
