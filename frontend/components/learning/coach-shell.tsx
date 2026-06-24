"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { cn } from "@/lib/utils";
import type { CoachType } from "@/lib/ai/prompts/coaches";

export interface StarterPrompt {
  label: string;
  message: string;
}

interface CoachShellProps {
  coachType: CoachType;
  coachLabel: string;
  coachTagline: string;
  starterPrompts: StarterPrompt[];
  accentClass: string;
}

interface CoachMessage {
  role: "user" | "assistant";
  content: string;
}

export function CoachShell({
  coachType,
  coachLabel,
  coachTagline,
  starterPrompts,
  accentClass,
}: CoachShellProps) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const submit = useCallback(
    async (overrideMessage?: string) => {
      const message = (overrideMessage ?? input).trim();
      if (!message || streaming) return;

      setInput("");
      setError(null);

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
          body: JSON.stringify({ message, conversationId, coachType }),
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

            if (
              event.done === true &&
              typeof event.conversationId === "string"
            ) {
              setConversationId(event.conversationId);
            }

            if (typeof event.error === "string") {
              setError(event.error);
            }
          }
        }

        reader.releaseLock();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Something went wrong.";
        setError(msg);
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
    },
    [input, streaming, conversationId, coachType],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void submit();
      }
    },
    [submit],
  );

  const empty = messages.length === 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      {/* Coach header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/learning"
            className="inline-flex h-8 w-8 items-center justify-center rounded-ds-md border border-line-subtle text-ink-muted transition-colors hover:border-primary/30 hover:text-ink-primary"
            aria-label="Back to Learning Hub"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
          <div>
            <p className={cn("font-mono text-2xs uppercase tracking-label", accentClass)}>
              {coachTagline}
            </p>
            <h1 className="text-lg font-semibold text-ink-primary">{coachLabel}</h1>
          </div>
        </div>
        {conversationId && (
          <span className="rounded-ds-xs bg-surface-raised px-2 py-0.5 font-mono text-2xs text-ink-faint">
            session active
          </span>
        )}
      </div>

      {/* Message list */}
      <Card
        className="h-[58vh] overflow-y-auto p-4"
        role="log"
        aria-label="Coach messages"
        aria-live="polite"
        aria-atomic="false"
      >
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-ink-primary">
                Ready when you are
              </p>
              <p className="text-xs text-ink-muted">
                Ask a question or pick a starter below
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {starterPrompts.map((sp) => (
                <button
                  key={sp.label}
                  type="button"
                  onClick={() => void submit(sp.message)}
                  disabled={streaming}
                  className="rounded-ds-lg border border-line-subtle bg-surface-panel/70 px-3 py-2 text-xs font-medium text-ink-secondary transition-colors hover:border-primary/30 hover:text-ink-primary"
                >
                  {sp.label}
                </button>
              ))}
            </div>
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
                    "max-w-[82%] rounded-ds-lg px-3 py-2 text-sm",
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
                    <span className="text-ink-muted" aria-label="Loading response">
                      …
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
        className="flex items-end gap-2"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your coach…"
          rows={2}
          disabled={streaming}
          aria-label="Message input"
          className="min-h-[60px] flex-1 resize-none rounded-ds-lg border border-line-subtle bg-surface-panel/60 px-3 py-2.5 text-sm text-ink-primary placeholder:text-ink-faint focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
        <Button
          type="submit"
          disabled={!input.trim() || streaming}
          aria-label="Send message"
        >
          <SendHorizonal className="h-4 w-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
