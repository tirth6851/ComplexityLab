import { describe, it, expect } from "vitest";
import {
  chatSystemPrompt,
  buildChatMessages,
} from "@/lib/ai/prompts/chat";
import type { AnchoredAnalysisContext } from "@/lib/ai/prompts/chat";
import { COACH_PROMPTS, isCoachType } from "@/lib/ai/prompts/coaches";

// ── chatSystemPrompt ─────────────────────────────────────────────────────────

describe("chatSystemPrompt", () => {
  it("returns the base tutor prompt when no context is provided", () => {
    const prompt = chatSystemPrompt();
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(50);
    expect(prompt).toContain("complexity");
  });

  it("returns the base prompt when called with an empty options object", () => {
    const plain = chatSystemPrompt();
    const withEmpty = chatSystemPrompt({});
    expect(plain).toBe(withEmpty);
  });

  it("includes the analysis title and complexities when context is provided", () => {
    const context: AnchoredAnalysisContext = {
      title: "Binary search",
      code: "def search(arr, target): ...",
      timeComplexity: "O(log n)",
      spaceComplexity: "O(1)",
      verdict: "Efficient logarithmic search.",
    };
    const prompt = chatSystemPrompt({ contextAnalysis: context });
    expect(prompt).toContain("Binary search");
    expect(prompt).toContain("O(log n)");
    expect(prompt).toContain("O(1)");
    expect(prompt).toContain("Efficient logarithmic search.");
  });

  it("includes the anchored code block when context is provided", () => {
    const context: AnchoredAnalysisContext = {
      title: "Test",
      code: "for i in range(n): pass",
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      verdict: "Linear.",
    };
    const prompt = chatSystemPrompt({ contextAnalysis: context });
    expect(prompt).toContain("for i in range(n): pass");
  });

  it("truncates code to 2 000 chars and adds a truncation note", () => {
    const longCode = "x".repeat(3_000);
    const context: AnchoredAnalysisContext = {
      title: "Big file",
      code: longCode,
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      verdict: "Linear.",
    };
    const prompt = chatSystemPrompt({ contextAnalysis: context });
    expect(prompt).not.toContain(longCode);
    expect(prompt).toContain("x".repeat(2_000));
    expect(prompt).toContain("truncated");
  });

  it("does not add a truncation note when code is exactly 2 000 chars", () => {
    const code = "y".repeat(2_000);
    const context: AnchoredAnalysisContext = {
      title: "Edge",
      code,
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      verdict: "Linear.",
    };
    const prompt = chatSystemPrompt({ contextAnalysis: context });
    expect(prompt).not.toContain("truncated");
  });

  it("instructs the model to treat code as untrusted data", () => {
    const prompt = chatSystemPrompt();
    expect(prompt.toLowerCase()).toMatch(/untrusted|data.*not.*instructions|instructions.*data/);
  });
});

// ── buildChatMessages ────────────────────────────────────────────────────────

describe("buildChatMessages", () => {
  const SYSTEM = "You are a tutor.";
  const USER_MSG = "What is O(n log n)?";

  it("starts with the system message", () => {
    const msgs = buildChatMessages({ system: SYSTEM, history: [], userMessage: USER_MSG });
    expect(msgs[0]).toEqual({ role: "system", content: SYSTEM });
  });

  it("ends with the current user message", () => {
    const msgs = buildChatMessages({ system: SYSTEM, history: [], userMessage: USER_MSG });
    expect(msgs.at(-1)).toEqual({ role: "user", content: USER_MSG });
  });

  it("interleaves history between system and the new user message", () => {
    const history = [
      { role: "user" as const, content: "Hello" },
      { role: "assistant" as const, content: "Hi there!" },
    ];
    const msgs = buildChatMessages({ system: SYSTEM, history, userMessage: USER_MSG });
    expect(msgs).toHaveLength(4);
    expect(msgs[1]).toEqual({ role: "user", content: "Hello" });
    expect(msgs[2]).toEqual({ role: "assistant", content: "Hi there!" });
    expect(msgs[3]).toEqual({ role: "user", content: USER_MSG });
  });

  it("trims history to the last historyLimit messages", () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `msg ${i}`,
    }));
    const msgs = buildChatMessages({
      system: SYSTEM,
      history,
      userMessage: USER_MSG,
      historyLimit: 12,
    });
    // 1 system + 12 history + 1 user = 14
    expect(msgs).toHaveLength(14);
    // First history message should be msg 8 (last 12 of 20 = indices 8–19)
    expect(msgs[1].content).toBe("msg 8");
  });

  it("defaults historyLimit to 12 when not provided", () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `msg ${i}`,
    }));
    const msgs = buildChatMessages({ system: SYSTEM, history, userMessage: USER_MSG });
    expect(msgs).toHaveLength(1 + 12 + 1);
  });

  it("passes through short history unchanged", () => {
    const history = [
      { role: "user" as const, content: "Q1" },
      { role: "assistant" as const, content: "A1" },
    ];
    const msgs = buildChatMessages({
      system: SYSTEM,
      history,
      userMessage: USER_MSG,
      historyLimit: 12,
    });
    expect(msgs).toHaveLength(4);
  });
});


describe("coach prompts", () => {
  it("accepts git as a supported coach type", () => {
    expect(isCoachType("git")).toBe(true);
    expect(COACH_PROMPTS.git).toContain("Git");
  });

  it("keeps the Git Coach safe around destructive commands", () => {
    const prompt = COACH_PROMPTS.git.toLowerCase();
    expect(prompt).toContain("reset --hard");
    expect(prompt).toContain("force push");
    expect(prompt).toContain("explain what commands do");
  });
});


describe("CLI coach prompts", () => {
  it("accepts cli as a supported coach type", () => {
    expect(isCoachType("cli")).toBe(true);
    expect(COACH_PROMPTS.cli).toContain("CLI");
  });

  it("keeps the CLI Coach safe around destructive commands", () => {
    const prompt = COACH_PROMPTS.cli.toLowerCase();
    expect(prompt).toContain("rm -rf");
    expect(prompt).toContain("sudo");
    expect(prompt).toContain("explain what commands do");
  });
});


describe("SQL coach prompts", () => {
  it("accepts sql as a supported coach type", () => {
    expect(isCoachType("sql")).toBe(true);
    expect(COACH_PROMPTS.sql).toContain("SQL");
  });

  it("keeps the SQL Coach safe around destructive queries", () => {
    const prompt = COACH_PROMPTS.sql.toLowerCase();
    expect(prompt).toContain("drop");
    expect(prompt).toContain("delete without where");
    expect(prompt).toContain("explain what each query does");
  });
});
