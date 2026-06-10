import type { AnalysisProvider } from "../provider";

/**
 * Groq provider — SCAFFOLD ONLY (Phase 4 architecture; integration is a later
 * phase). The env contract is already in place:
 *
 *   GROQ_API_KEY   server-only secret
 *   GROQ_MODEL     model id (default "llama-3.3-70b-versatile")
 *
 * Implementation sketch (when enabled):
 *  1. POST https://api.groq.com/openai/v1/chat/completions with a system
 *     prompt that demands strict-JSON output matching `CodeAnalysis`.
 *  2. Validate/repair the JSON, clamp metric fractions, and set
 *     `provider: "groq"`.
 *  3. Fall back to the mock heuristic engine on rate-limit or parse failure.
 *
 * OpenAI / Anthropic / Gemini providers follow the same pattern: one file
 * here implementing `AnalysisProvider`, one registry entry in `lib/ai`.
 */
export const groqProvider: AnalysisProvider = {
  id: "groq",
  name: "Groq",
  async analyze() {
    throw new Error(
      "Groq provider is scaffolded but not enabled yet. Set AI_PROVIDER=mock (default) until the integration phase.",
    );
  },
};
