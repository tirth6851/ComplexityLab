import { afterEach, describe, expect, it, vi } from "vitest";
import { groqProvider, parseGroqAnalysis } from "@/lib/ai/providers/groq";

const INPUT = {
  code: "function f(xs) { for (const x of xs) {} }",
  language: "javascript",
};

const GOOD_JSON = JSON.stringify({
  time: { notation: "O(n)", reason: "Single pass over the input." },
  space: { notation: "O(1)", reason: "Fixed-size variables only." },
  verdict: "O(n) time, O(1) space — scales linearly.",
  notes: ["One loop.", "No recursion."],
  confidence: 0.9,
});

function stubGroqResponse(content: string, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(
        JSON.stringify({ choices: [{ message: { content } }] }),
        { status },
      ),
    ),
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("parseGroqAnalysis", () => {
  it("parses a well-formed completion", () => {
    const parsed = parseGroqAnalysis(GOOD_JSON);
    expect(parsed).not.toBeNull();
    expect(parsed?.time.notation).toBe("O(n)");
    expect(parsed?.time.tier).toBe("good");
    expect(parsed?.space.tier).toBe("optimal");
    expect(parsed?.provider).toBe("groq");
    expect(parsed?.metrics).toHaveLength(3);
  });

  it("strips accidental code fences", () => {
    const parsed = parseGroqAnalysis("```json\n" + GOOD_JSON + "\n```");
    expect(parsed?.time.notation).toBe("O(n)");
  });

  it("rejects malformed JSON and bad notations", () => {
    expect(parseGroqAnalysis("not json at all")).toBeNull();
    expect(
      parseGroqAnalysis(
        JSON.stringify({ time: { notation: "linear" }, space: { notation: "O(1)" } }),
      ),
    ).toBeNull();
  });

  it("clamps confidence into [0.3, 0.99]", () => {
    const hot = parseGroqAnalysis(
      JSON.stringify({
        time: { notation: "O(n)" },
        space: { notation: "O(1)" },
        confidence: 7,
      }),
    );
    expect(hot?.confidence).toBe(0.99);
  });

  it("sets syntaxError when the model detects one", () => {
    const parsed = parseGroqAnalysis(
      JSON.stringify({
        time: { notation: "O(n)", reason: "." },
        space: { notation: "O(1)", reason: "." },
        verdict: "O(n) time.",
        notes: [],
        confidence: 0.5,
        syntaxError: "Mismatched braces on line 3",
      }),
    );
    expect(parsed?.syntaxError).toBe("Mismatched braces on line 3");
  });

  it("omits syntaxError from result when not present in JSON", () => {
    const parsed = parseGroqAnalysis(GOOD_JSON);
    expect(parsed).not.toBeNull();
    expect("syntaxError" in (parsed ?? {})).toBe(false);
  });

  it("truncates syntaxError to 200 characters", () => {
    const longError = "x".repeat(300);
    const parsed = parseGroqAnalysis(
      JSON.stringify({
        time: { notation: "O(n)" },
        space: { notation: "O(1)" },
        syntaxError: longError,
      }),
    );
    expect(parsed?.syntaxError).toHaveLength(200);
  });
});

describe("groqProvider.analyze", () => {
  it("falls back to the heuristic engine when no API key is set", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await groqProvider.analyze(INPUT);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.provider).toBe("mock");
    expect(result.time.notation).toBe("O(n)");
    expect(result.notes.at(-1)).toMatch(/heuristic engine/i);
  });

  it("returns the model's analysis on a successful call", async () => {
    vi.stubEnv("GROQ_API_KEY", "gsk_test");
    stubGroqResponse(GOOD_JSON);

    const result = await groqProvider.analyze(INPUT);
    expect(result.provider).toBe("groq");
    expect(result.time.notation).toBe("O(n)");
    expect(result.verdict).toContain("O(n)");
  });

  it("falls back when the completion is unparseable", async () => {
    vi.stubEnv("GROQ_API_KEY", "gsk_test");
    stubGroqResponse("Sorry, I cannot help with that.");

    const result = await groqProvider.analyze(INPUT);
    expect(result.provider).toBe("mock");
  });

  it("falls back on HTTP errors", async () => {
    vi.stubEnv("GROQ_API_KEY", "gsk_test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("rate limited", { status: 429 })),
    );

    const result = await groqProvider.analyze(INPUT);
    expect(result.provider).toBe("mock");
  });
});
