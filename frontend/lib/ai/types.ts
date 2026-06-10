import type { ComplexityTier } from "@/lib/complexity";

/**
 * Shared request/response contract for code-complexity analysis.
 *
 * Every provider (mock heuristic engine today; Groq / OpenAI / Anthropic /
 * Gemini later) accepts an `AnalyzeCodeInput` and resolves a `CodeAnalysis`.
 * The UI, the route handler, and the persistence layer all speak this shape,
 * so swapping providers never touches them.
 */

export interface AnalyzeCodeInput {
  /** Source code to analyze. */
  code: string;
  /** Language id from `lib/analysis/languages.ts` (e.g. "typescript"). */
  language: string;
}

/** One measured dimension (time or space). */
export interface ComplexityFinding {
  /** Big-O notation, e.g. "O(n log n)". */
  notation: string;
  /** Cost tier driving the design-system color coding. */
  tier: ComplexityTier;
  /** One-line justification for the verdict. */
  reason: string;
}

/** A gauge-able measurement for the results panel. */
export interface AnalysisMetric {
  id: string;
  /** Uppercase mono instrument label, e.g. "EST. OPS @ N=1000". */
  label: string;
  /** Display value, e.g. "~10.0K". */
  value: string;
  /** Gauge fill, 0–1. */
  fraction: number;
  /** Fill color tier; "accent" renders Signal Green. */
  tier: ComplexityTier | "accent";
  hint?: string;
}

/** Full analysis result rendered by the analyzer and persisted to Supabase. */
export interface CodeAnalysis {
  time: ComplexityFinding;
  space: ComplexityFinding;
  /** One-sentence overall summary. */
  verdict: string;
  /** Bullet-point reasoning trail (what the engine detected). */
  notes: string[];
  metrics: AnalysisMetric[];
  /** Engine confidence in the result, 0–1. */
  confidence: number;
  /** Provider id that produced this result (e.g. "mock", "groq"). */
  provider: string;
}
