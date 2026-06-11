import { beforeEach, describe, expect, it } from "vitest";
import {
  setAnalyzerHandoff,
  takeAnalyzerHandoff,
} from "@/lib/analyzer-handoff";

const KEY = "cl-analyzer-handoff";

describe("analyzer handoff", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("round-trips a buffer and clears it after one take", () => {
    setAnalyzerHandoff({ code: "def f(): pass", language: "python" });

    expect(takeAnalyzerHandoff()).toEqual({
      code: "def f(): pass",
      language: "python",
    });
    // One-shot: a second take returns nothing.
    expect(takeAnalyzerHandoff()).toBeNull();
  });

  it("returns null when nothing is pending", () => {
    expect(takeAnalyzerHandoff()).toBeNull();
  });

  it("rejects malformed or invalid payloads", () => {
    window.sessionStorage.setItem(KEY, "not json {");
    expect(takeAnalyzerHandoff()).toBeNull();

    window.sessionStorage.setItem(
      KEY,
      JSON.stringify({ code: "x", language: "cobol" }),
    );
    expect(takeAnalyzerHandoff()).toBeNull();

    window.sessionStorage.setItem(
      KEY,
      JSON.stringify({ code: "", language: "python" }),
    );
    expect(takeAnalyzerHandoff()).toBeNull();
  });
});
