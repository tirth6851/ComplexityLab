import type { AnalysisProvider } from "../provider";
import type {
  AnalysisMetric,
  AnalyzeCodeInput,
  CodeAnalysis,
} from "../types";
import { tierFromNotation } from "@/lib/complexity";
import { formatOps, growthValue } from "@/lib/analysis/growth";
import { logEvent } from "@/lib/log";
import { mockProvider } from "./mock";
import {
  groqComplete,
  DEFAULT_GROQ_MODEL,
  type GroqMessage,
} from "../groq-client";

/**
 * Groq provider — LLM-backed complexity analysis via the OpenAI-compatible
 * chat-completions API. Server-only by construction (the key never leaves
 * the server; this module is only reached through the /api/analyze handler).
 *
 * Resilience: on ANY failure (missing key, network, rate limit, bad JSON)
 * it falls back to the deterministic heuristic engine and says so in the
 * result notes — the analyzer never breaks because the LLM did.
 */

const VALID_NOTATION = /^O\(.{1,24}\)$/;

const SYSTEM_PROMPT = `You are a precise static complexity analyzer. Given source code, determine its asymptotic time and space complexity.

Respond with ONLY a JSON object — no markdown, no code fences, no commentary:
{
  "time": { "notation": "O(...)", "reason": "one short sentence" },
  "space": { "notation": "O(...)", "reason": "one short sentence" },
  "verdict": "one sentence summarizing scalability, starting with the time and space classes",
  "notes": ["2-5 short observations about the code's structure"],
  "confidence": 0.0
}

Rules:
- Prefer the standard classes: O(1), O(log n), O(n), O(n log n), O(n²), O(n³), O(2ⁿ), O(n!). Use unicode superscripts (², ⁿ) as shown.
- "space" means auxiliary space, excluding the input itself.
- "confidence" is your certainty from 0 to 1.
- Analyze the dominant cost path; mention amortized behavior in notes if relevant.`;

interface GroqJson {
  time?: { notation?: unknown; reason?: unknown };
  space?: { notation?: unknown; reason?: unknown };
  verdict?: unknown;
  notes?: unknown;
  confidence?: unknown;
}

function asNotation(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return VALID_NOTATION.test(trimmed) ? trimmed : null;
}

function asSentence(value: unknown, max = 300): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim().slice(0, max)
    : null;
}

function metricsFor(
  time: string,
  space: string,
  confidence: number,
): AnalysisMetric[] {
  const N = 1000;
  const ops = growthValue(time, N);
  const units = growthValue(space, N);
  return [
    {
      id: "ops",
      label: `EST. OPS @ N=${N}`,
      value: formatOps(ops),
      fraction: Math.min(1, Math.log10(Math.max(ops, 1)) / 9),
      tier: tierFromNotation(time),
      hint: `${time} growth at n = ${N}`,
    },
    {
      id: "space",
      label: `EST. MEMORY @ N=${N}`,
      value: `${formatOps(units)} units`,
      fraction: Math.min(1, Math.log10(Math.max(units, 1)) / 6),
      tier: tierFromNotation(space),
      hint: `${space} auxiliary space`,
    },
    {
      id: "confidence",
      label: "MODEL CONFIDENCE",
      value: `${Math.round(confidence * 100)}%`,
      fraction: confidence,
      tier: "accent",
      hint: `Groq · ${process.env.GROQ_MODEL ?? DEFAULT_GROQ_MODEL}`,
    },
  ];
}

/** Strip accidental code fences and parse the model's JSON. */
export function parseGroqAnalysis(raw: string): CodeAnalysis | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  let json: GroqJson;
  try {
    json = JSON.parse(cleaned) as GroqJson;
  } catch {
    return null;
  }

  const time = asNotation(json.time?.notation);
  const space = asNotation(json.space?.notation);
  if (!time || !space) return null;

  const confidence = Math.min(
    0.99,
    Math.max(0.3, typeof json.confidence === "number" ? json.confidence : 0.7),
  );
  const notes = (Array.isArray(json.notes) ? json.notes : [])
    .map((n) => asSentence(n))
    .filter((n): n is string => n !== null)
    .slice(0, 6);

  return {
    time: {
      notation: time,
      tier: tierFromNotation(time),
      reason: asSentence(json.time?.reason) ?? "Model assessment.",
    },
    space: {
      notation: space,
      tier: tierFromNotation(space),
      reason: asSentence(json.space?.reason) ?? "Model assessment.",
    },
    verdict:
      asSentence(json.verdict, 400) ?? `${time} time, ${space} space.`,
    notes,
    metrics: metricsFor(time, space, confidence),
    confidence,
    provider: "groq",
  };
}

async function fallback(
  input: AnalyzeCodeInput,
  reason: string,
): Promise<CodeAnalysis> {
  logEvent("groq.fallback", { reason });
  const result = await mockProvider.analyze(input);
  return {
    ...result,
    notes: [
      ...result.notes,
      "AI provider unavailable — this is the built-in heuristic engine's result.",
    ],
  };
}

export const groqProvider: AnalysisProvider = {
  id: "groq",
  name: "Groq",
  async analyze(input) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.startsWith("<")) {
      return fallback(input, "missing_api_key");
    }

    const messages: GroqMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Language: ${input.language}\n\nCode:\n${input.code}` },
    ];

    try {
      const content = await groqComplete(messages, {
        maxTokens: 800,
        responseFormat: { type: "json_object" },
      });

      const parsed = parseGroqAnalysis(content);
      if (!parsed) return fallback(input, "unparseable_completion");
      return parsed;
    } catch (e) {
      const reason =
        e instanceof Error && e.name === "AbortError"
          ? "timeout"
          : e instanceof Error && e.message.startsWith("groq_http_")
            ? e.message.replace("groq_", "")
            : e instanceof Error && e.message === "groq_empty_content"
              ? "empty_completion"
              : "network";
      return fallback(input, reason);
    }
  },
};
