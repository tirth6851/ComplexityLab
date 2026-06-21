"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ── Inline renderer ──────────────────────────────────────────────────────────

function inlineNodes(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`\n]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2] !== undefined)
      out.push(<strong key={idx++}>{m[2]}</strong>);
    else if (m[3] !== undefined)
      out.push(<em key={idx++}>{m[3]}</em>);
    else
      out.push(
        <code
          key={idx++}
          className="rounded px-1 py-0.5 bg-surface-inset border border-line-subtle font-mono text-[0.8em] text-primary"
        >
          {m[4]}
        </code>,
      );
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// ── Block-level renderer ──────────────────────────────────────────────────────

function TextSegment({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: ReactNode[][] = [];
  let paraLines: string[] = [];
  let k = 0;

  function flushPara() {
    const t = paraLines.join(" ").trim();
    if (t)
      blocks.push(
        <p key={k++} className="leading-relaxed text-ink-primary">
          {inlineNodes(t)}
        </p>,
      );
    paraLines = [];
  }

  function flushList() {
    if (!listItems.length) return;
    if (listType === "ul")
      blocks.push(
        <ul key={k++} className="ml-4 list-disc space-y-0.5">
          {listItems.map((item, j) => (
            <li key={j} className="leading-relaxed text-ink-primary">
              {item}
            </li>
          ))}
        </ul>,
      );
    else
      blocks.push(
        <ol key={k++} className="ml-4 list-decimal space-y-0.5">
          {listItems.map((item, j) => (
            <li key={j} className="leading-relaxed text-ink-primary">
              {item}
            </li>
          ))}
        </ol>,
      );
    listItems = [];
    listType = null;
  }

  for (const line of lines) {
    const t = line.trim();

    const hm = /^(#{1,3})\s+(.+)/.exec(t);
    if (hm) {
      flushPara();
      flushList();
      const lv = hm[1].length;
      if (lv === 1)
        blocks.push(
          <h3 key={k++} className="font-semibold text-sm text-ink-primary">
            {inlineNodes(hm[2])}
          </h3>,
        );
      else if (lv === 2)
        blocks.push(
          <h4 key={k++} className="font-medium text-sm text-ink-secondary">
            {inlineNodes(hm[2])}
          </h4>,
        );
      else
        blocks.push(
          <h5
            key={k++}
            className="font-medium text-xs uppercase tracking-label text-ink-muted"
          >
            {inlineNodes(hm[2])}
          </h5>,
        );
      continue;
    }

    const ulm = /^[-*+]\s+(.+)/.exec(t);
    if (ulm) {
      flushPara();
      if (listType === "ol") flushList();
      listType = "ul";
      listItems.push(inlineNodes(ulm[1]));
      continue;
    }

    const olm = /^\d+\.\s+(.+)/.exec(t);
    if (olm) {
      flushPara();
      if (listType === "ul") flushList();
      listType = "ol";
      listItems.push(inlineNodes(olm[1]));
      continue;
    }

    if (!t) {
      flushPara();
      flushList();
      continue;
    }

    flushList();
    paraLines.push(t);
  }

  flushPara();
  flushList();

  return <div className="space-y-2">{blocks}</div>;
}

// ── Public component ──────────────────────────────────────────────────────────

export function ChatMarkdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const segments = content.split(/(```[\w]*\n[\s\S]*?```)/g);
  const nodes: ReactNode[] = [];

  segments.forEach((seg, i) => {
    if (seg.startsWith("```")) {
      const nl = seg.indexOf("\n");
      const lang = seg.slice(3, nl).trim();
      const code = seg.slice(nl + 1, seg.lastIndexOf("```")).trimEnd();
      nodes.push(
        <div
          key={i}
          className="overflow-hidden rounded-ds-md border border-line-subtle"
        >
          {lang && (
            <div className="border-b border-line-subtle bg-surface-panel/80 px-3 py-1.5">
              <span className="font-mono text-2xs uppercase tracking-label text-ink-muted">
                {lang}
              </span>
            </div>
          )}
          <pre className="overflow-x-auto bg-[#050816] p-3 text-xs">
            <code className="font-mono text-ink-primary">{code}</code>
          </pre>
        </div>,
      );
    } else if (seg.trim()) {
      nodes.push(<TextSegment key={i} text={seg} />);
    }
  });

  return (
    <div className={cn("space-y-3 text-sm", className)}>
      {nodes}
    </div>
  );
}
