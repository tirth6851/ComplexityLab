"use client";

import * as React from "react";
import { Bookmark, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tag } from "@/components/ui/tag";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { CopyButton } from "@/components/ui/copy-button";
import { OpenInAnalyzerButton } from "@/components/analyzer/open-in-analyzer-button";
import { languageLabel } from "@/lib/analysis/languages";
import { timeAgo } from "@/lib/format";
import type { Snippet } from "@/types";

export interface SnippetItemProps {
  snippet: Snippet;
  /** Bound server action deleting this snippet. */
  deleteAction: () => Promise<{ ok: boolean; error?: string }>;
}

/**
 * One snippet row. The title area toggles an inline code view with copy and
 * open-in-analyzer actions — snippets are useless if you can't see them.
 */
export function SnippetItem({ snippet, deleteAction }: SnippetItemProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="rounded-ds-sm transition-colors hover:bg-surface-raised">
      <div className="flex items-center justify-between gap-3 px-2 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`${open ? "Hide" : "Show"} code for ${snippet.title}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-ds-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-ds-sm border border-line-subtle bg-surface-panel text-ink-muted">
            <Bookmark className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {snippet.title}
            </span>
            <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
              <span>{languageLabel(snippet.language)}</span>
              <span aria-hidden>·</span>
              <span
                className="inline-flex items-center gap-1"
                title={snippet.savedAt}
                suppressHydrationWarning
              >
                <Clock className="h-3 w-3" />
                {timeAgo(snippet.savedAt)}
              </span>
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-ink-faint transition-transform duration-150 ease-ds",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        <div className="flex shrink-0 items-center gap-1.5">
          {snippet.tags.length > 0 && (
            <div className="hidden gap-1.5 sm:flex">
              {snippet.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          )}
          <ConfirmDeleteButton
            action={deleteAction}
            label={`Delete snippet ${snippet.title}`}
          />
        </div>
      </div>

      {open && (
        <div className="mx-2 mb-2 overflow-hidden rounded-ds-sm border border-line-subtle bg-surface-panel">
          <div className="flex items-center justify-end gap-1.5 border-b border-line-subtle px-2 py-1">
            <CopyButton
              value={snippet.code}
              label={`Copy snippet ${snippet.title}`}
            />
            <OpenInAnalyzerButton
              code={snippet.code}
              language={snippet.language}
            />
          </div>
          <pre className="max-h-72 overflow-auto p-3 font-mono text-xs leading-relaxed text-ink-secondary">
            <code>{snippet.code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
