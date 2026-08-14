"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { takeChatHandoff } from "@/lib/chat-handoff";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatShell() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Grow the composer with its content (up to a cap) instead of a fixed
  // 3-row box. Runs after every render where `input` changed — covers
  // typing, clearing on send, and the handoff prefill below.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  // Consume a one-shot handoff from the Analyzer or Playground.
  /* eslint-disable react-hooks/set-state-in-effect -- one-shot sessionStorage consume */
  useEffect(() => {
    const handoff = takeChatHandoff();
    if (handoff) setInput(handoff.initialMessage);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const submit = useCallback(async () => {
    const message = input.trim();
    if (!message || streaming) return;

    setInput("");
    setError(null);

    // Append user message + empty assistant placeholder before the request so
    // the user sees their message immediately without waiting for the server.
    setMessages((prev) => [
      ...prev,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversationId }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      if (!res.body) throw new Error("No response body.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const blocks = buf.split("\n\n");
        buf = blocks.pop() ?? "";

        for (const block of blocks) {
          if (!block.startsWith("data: ")) continue;

          let event: Record<string, unknown>;
          try {
            event = JSON.parse(block.slice(6)) as Record<string, unknown>;
          } catch {
            continue;
          }

          if (typeof event.text === "string") {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              next[next.length - 1] = {
                ...last,
                content: last.content + event.text,
              };
              return next;
            });
          }

          if (event.done === true && typeof event.conversationId === "string") {
            setConversationId(event.conversationId);
          }

          if (typeof event.error === "string") {
            setError(event.error);
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              return last?.role === "assistant" && !last.content
                ? prev.slice(0, -1)
                : prev;
            });
          }
        }
      }

      reader.releaseLock();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
      // Drop the empty assistant placeholder if nothing was streamed.
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return last?.role === "assistant" && !last.content
          ? prev.slice(0, -1)
          : prev;
      });
    } finally {
      setStreaming(false);
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [input, streaming, conversationId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void submit();
      }
    },
    [submit],
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      {/* Message list */}
      <Card
        className="h-[60vh] overflow-y-auto p-4"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 ? (
          <div className="animate-rise flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-ink-primary">
              Ask anything about algorithms and complexity
            </p>
            <p className="text-xs text-ink-muted">
              AI tutor - 50 messages/day
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-ds-lg px-3 py-2 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground whitespace-pre-wrap"
                      : "border border-line-subtle bg-surface-raised",
                  )}
                >
                  {msg.role === "user" ? (
                    msg.content
                  ) : msg.content ? (
                    <ChatMarkdown content={msg.content} />
                  ) : streaming ? (
                    <span
                      className="inline-flex items-center gap-1"
                      aria-label="Loading response"
                    >
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-muted [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-muted [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-muted [animation-delay:300ms]" />
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
            <div ref={bottomRef} aria-hidden />
          </div>
        )}
      </Card>

      {/* Error display */}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="premium-panel flex items-end gap-2 rounded-ds-lg p-2"
      >
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <textarea
          ref={textareaRef}
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about an algorithm or complexity class... (Enter to send, Shift+Enter for newline)"
          disabled={streaming}
          rows={1}
          className="max-h-[200px] flex-1 resize-none rounded-ds-md border border-line-subtle bg-surface-inset px-3 py-2 text-sm text-ink-primary shadow-inset-well outline-none placeholder:text-ink-faint focus:border-primary/60 focus:shadow-glow-green disabled:opacity-45"
        />
        <Button
          type="submit"
          disabled={streaming || !input.trim()}
          size="icon"
          aria-label="Send message"
        >
          <SendHorizonal className="h-4 w-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
