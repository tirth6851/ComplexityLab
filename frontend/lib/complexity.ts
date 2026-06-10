import type { Complexity } from "@/types";

/**
 * Single source of truth for how a Big-O class maps onto the visual system.
 *
 * Two parallel encodings, kept consistent with each other:
 *  - `ComplexityLevel` (1–5) drives the Tailwind `complexity-{1..5}` gradient
 *    utilities (cheap/green → costly/red).
 *  - `ComplexityTier` (named) drives the design-system complexity components
 *    (BigOBadge, VerdictReadout, MetricGauge), which color by named tier.
 *
 * `level → tier` is a fixed 1:1 mapping, so a badge and a readout for the same
 * Big-O class always agree.
 */

/** Complexity gradient stops (1 = cheap/green … 5 = costly/red). */
export type ComplexityLevel = 1 | 2 | 3 | 4 | 5;

/** Named cost tiers used by the instrument-panel components. */
export type ComplexityTier = "optimal" | "good" | "fair" | "poor" | "critical";

const LEVELS: Record<Complexity, ComplexityLevel> = {
  "O(1)": 1,
  "O(log n)": 1,
  "O(n)": 2,
  "O(n log n)": 3,
  "O(n²)": 4,
  "O(n³)": 4,
  "O(2ⁿ)": 5,
  "O(n!)": 5,
};

const LEVEL_TIER: Record<ComplexityLevel, ComplexityTier> = {
  1: "optimal",
  2: "good",
  3: "fair",
  4: "poor",
  5: "critical",
};

/** CSS-variable colors per tier (foreground, tinted bg, border). */
export const TIER_COLOR: Record<
  ComplexityTier,
  { fg: string; bg: string; border: string }
> = {
  optimal: { fg: "var(--cx-optimal)", bg: "var(--c-o1-bg)", border: "rgba(33,224,140,.32)" },
  good: { fg: "var(--cx-good)", bg: "var(--c-log-bg)", border: "rgba(43,184,224,.32)" },
  fair: { fg: "var(--cx-fair)", bg: "var(--c-nlogn-bg)", border: "rgba(255,192,77,.32)" },
  poor: { fg: "var(--cx-poor)", bg: "var(--c-n2-bg)", border: "rgba(255,176,46,.32)" },
  critical: { fg: "var(--cx-critical)", bg: "var(--c-exp-bg)", border: "rgba(255,81,81,.32)" },
};

/** Verdict word + status glyph per tier (TIME/SPACE readouts). */
export const TIER_VERDICT: Record<
  ComplexityTier,
  { label: string; glyph: string }
> = {
  optimal: { label: "Optimal", glyph: "●" },
  good: { label: "Good", glyph: "●" },
  fair: { label: "Watch", glyph: "⚠" },
  poor: { label: "Bottleneck", glyph: "⚠" },
  critical: { label: "Critical", glyph: "✕" },
};

export function complexityLevel(c: Complexity): ComplexityLevel {
  return LEVELS[c];
}

export function complexityTier(c: Complexity): ComplexityTier {
  return LEVEL_TIER[LEVELS[c]];
}

/**
 * Best-effort tier for an arbitrary Big-O string (e.g. analyzer output that
 * isn't one of the known `Complexity` literals). Falls back to `good`.
 */
export function tierFromNotation(notation = ""): ComplexityTier {
  const n = notation.toLowerCase().replace(/\s+/g, "");
  if (/2\^|2ⁿ|!|n\^n|nⁿ/.test(n)) return "critical";
  if (/\^3|³|n\^4|⁴/.test(n)) return "poor";
  if (/\^2|²/.test(n)) return "fair";
  if (/log/.test(n) && !/nlog/.test(n)) return "optimal";
  if (/o\(1\)|o\(c\)/.test(n)) return "optimal";
  return "good";
}
