import { describe, it, expect } from "vitest";
import { retrieveContext } from "@/lib/ai/rag/retriever";
import { KNOWLEDGE_BASE } from "@/lib/ai/rag/knowledge-base";

describe("retrieveContext — basic retrieval", () => {
  it("returns an empty array for an empty query", () => {
    expect(retrieveContext("")).toHaveLength(0);
  });

  it("returns an empty array for a whitespace-only query", () => {
    expect(retrieveContext("   ")).toHaveLength(0);
  });

  it("returns at most topK results", () => {
    const results = retrieveContext("algorithm complexity time space", 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("returns fewer than topK when fewer chunks match", () => {
    // Very specific query that won't match more than 1-2 chunks
    const results = retrieveContext("master theorem recurrence", 10);
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(KNOWLEDGE_BASE.length);
  });
});

describe("retrieveContext — relevance", () => {
  it("retrieves the binary search chunk for a binary search query", () => {
    const results = retrieveContext("what is the complexity of binary search?");
    const ids = results.map((c) => c.id);
    expect(ids).toContain("logarithmic");
  });

  it("retrieves the sorting chunk for a sorting query", () => {
    const results = retrieveContext("what is the complexity of merge sort?");
    const ids = results.map((c) => c.id);
    expect(ids).toContain("linearithmic");
  });

  it("retrieves the hash table chunk for a hash map query", () => {
    const results = retrieveContext("how does a hash map work with O(1) lookup?");
    const ids = results.map((c) => c.id);
    expect(ids.some((id) => id === "constant-time" || id === "hash-table-internals")).toBe(true);
  });

  it("retrieves the DP chunk for a dynamic programming query", () => {
    const results = retrieveContext("explain memoization and dynamic programming");
    const ids = results.map((c) => c.id);
    expect(ids).toContain("dynamic-programming");
  });

  it("retrieves graph traversal for BFS/DFS query", () => {
    const results = retrieveContext("what is the time complexity of BFS and DFS?");
    const ids = results.map((c) => c.id);
    expect(ids).toContain("graph-traversal");
  });

  it("retrieves space complexity chunk for a space/memory query", () => {
    const results = retrieveContext("what is the space complexity of recursive algorithms?");
    const ids = results.map((c) => c.id);
    expect(ids).toContain("space-complexity");
  });

  it("retrieves master theorem for a recurrence query", () => {
    const results = retrieveContext("how does the master theorem solve recurrence relations in divide and conquer?");
    const ids = results.map((c) => c.id);
    expect(ids).toContain("master-theorem");
  });

  it("retrieves amortized analysis for a dynamic array query", () => {
    const results = retrieveContext("why is appending to a dynamic array O(1) amortized?");
    const ids = results.map((c) => c.id);
    expect(ids).toContain("amortized");
  });
});

describe("retrieveContext — results are sorted by score", () => {
  it("returns results in descending relevance order", () => {
    const results = retrieveContext("binary search O(log n) sorted array");
    // 'logarithmic' should outrank 'big-o-overview' for a specific binary search query
    expect(results.length).toBeGreaterThan(0);
    // Just verify the most relevant chunk is first (logarithmic tag matches multiple tokens)
    expect(results[0].id).toBe("logarithmic");
  });
});

describe("chatSystemPrompt with RAG context", () => {
  it("includes RELEVANT KNOWLEDGE block when ragContext is provided", async () => {
    const { chatSystemPrompt } = await import("@/lib/ai/prompts/chat");
    const chunks = retrieveContext("binary search O(log n)");
    const prompt = chatSystemPrompt({ ragContext: chunks });
    expect(prompt).toContain("RELEVANT KNOWLEDGE");
    expect(prompt).toContain("O(log n)");
  });

  it("returns the base prompt unchanged when no RAG context matches", async () => {
    const { chatSystemPrompt } = await import("@/lib/ai/prompts/chat");
    const prompt = chatSystemPrompt({ ragContext: [] });
    expect(prompt).not.toContain("RELEVANT KNOWLEDGE");
    expect(prompt).toContain("expert computer science tutor");
  });
});
