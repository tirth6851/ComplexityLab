import type { AnalysisProvider } from "../provider";
import { analyzeCode } from "@/lib/analysis/engine";

/**
 * Mock provider — the deterministic heuristic engine. No network, no AI.
 * Default provider until an LLM vendor is wired in.
 */
export const mockProvider: AnalysisProvider = {
  id: "mock",
  name: "ComplexityLab heuristic engine",
  async analyze(input) {
    return analyzeCode(input);
  },
};
