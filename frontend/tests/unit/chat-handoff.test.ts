import { beforeEach, describe, expect, it } from "vitest";
import { setChatHandoff, takeChatHandoff } from "@/lib/chat-handoff";

const KEY = "cl-chat-handoff";

describe("chat handoff", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("round-trips a message and clears it after one take", () => {
    setChatHandoff({ initialMessage: "Explain O(n log n)" });

    expect(takeChatHandoff()).toEqual({ initialMessage: "Explain O(n log n)" });
    // One-shot: a second take returns nothing.
    expect(takeChatHandoff()).toBeNull();
  });

  it("returns null when nothing is pending", () => {
    expect(takeChatHandoff()).toBeNull();
  });

  it("rejects malformed or invalid payloads", () => {
    window.sessionStorage.setItem(KEY, "not json {");
    expect(takeChatHandoff()).toBeNull();

    window.sessionStorage.setItem(KEY, JSON.stringify({ initialMessage: "" }));
    expect(takeChatHandoff()).toBeNull();

    window.sessionStorage.setItem(KEY, JSON.stringify({ initialMessage: "   " }));
    expect(takeChatHandoff()).toBeNull();

    window.sessionStorage.setItem(KEY, JSON.stringify({ wrong_field: "hello" }));
    expect(takeChatHandoff()).toBeNull();
  });

  it("silently swallows sessionStorage errors on set", () => {
    const orig = window.sessionStorage.setItem.bind(window.sessionStorage);
    window.sessionStorage.setItem = () => { throw new Error("QuotaExceededError"); };
    expect(() => setChatHandoff({ initialMessage: "test" })).not.toThrow();
    window.sessionStorage.setItem = orig;
  });
});
