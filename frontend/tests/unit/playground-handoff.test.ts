import { beforeEach, describe, expect, it } from "vitest";
import { setPlaygroundHandoff, takePlaygroundHandoff } from "@/lib/playground-handoff";

const KEY = "cl-playground-handoff";

describe("playground handoff", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("round-trips code + language and clears after one take", () => {
    setPlaygroundHandoff({ code: "print('hello')", language: "python" });

    expect(takePlaygroundHandoff()).toEqual({
      code: "print('hello')",
      language: "python",
    });
    // One-shot: a second take returns nothing.
    expect(takePlaygroundHandoff()).toBeNull();
  });

  it("returns null when nothing is pending", () => {
    expect(takePlaygroundHandoff()).toBeNull();
  });

  it("rejects malformed or invalid payloads", () => {
    window.sessionStorage.setItem(KEY, "not json {");
    expect(takePlaygroundHandoff()).toBeNull();

    window.sessionStorage.setItem(KEY, JSON.stringify({ code: "x", language: "cobol" }));
    expect(takePlaygroundHandoff()).toBeNull();

    window.sessionStorage.setItem(KEY, JSON.stringify({ code: "", language: "python" }));
    expect(takePlaygroundHandoff()).toBeNull();

    window.sessionStorage.setItem(KEY, JSON.stringify({ code: "x" }));
    expect(takePlaygroundHandoff()).toBeNull();
  });

  it("accepts all supported language IDs", () => {
    const langs = ["typescript", "javascript", "python", "java", "go", "rust", "cpp"] as const;
    for (const lang of langs) {
      setPlaygroundHandoff({ code: "x", language: lang });
      expect(takePlaygroundHandoff()?.language).toBe(lang);
    }
  });

  it("silently swallows sessionStorage errors on set", () => {
    const orig = window.sessionStorage.setItem.bind(window.sessionStorage);
    window.sessionStorage.setItem = () => { throw new Error("QuotaExceededError"); };
    expect(() => setPlaygroundHandoff({ code: "x", language: "python" })).not.toThrow();
    window.sessionStorage.setItem = orig;
  });
});
