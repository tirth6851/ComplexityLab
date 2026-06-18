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
 * open-in-analyzer actions - snippets are useless if you cannot see them.
 */
export function SnippetItem({ snippet, deleteAction }: SnippetItemProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="group overflow-hidden rounded-ds-lg border border-line-subtle bg-surface-panel/30 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-raised/70 hover:shadow-ds-md">
      <div className="flex items-center justify-between gap-4 p-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`${open ? "Hide" : "Show"} code for ${snippet.title}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-ds-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-ds-md border border-line-accent bg-card text-primary shadow-inset-well">
            <Bookmark className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink-primary group-hover:text-primary">
              {snippet.title}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              <span>{languageLabel(snippet.language)}</span>
              <span aria-hidden>/</span>
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
              {snippet.tags.slice(0, 3).map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          )}
          <ConfirmDeleteButton
            action={deleteAction}
            label={`Delete snippet ${snippet.title}`}
            successMessage="Snippet deleted"
          />
        </div>
      </div>

      {open && (
        <div className="mx-4 mb-4 overflow-hidden rounded-ds-lg border border-line-subtle bg-[#050816] shadow-ds-lg">
          <div className="flex items-center justify-between gap-1.5 border-b border-line-subtle bg-surface-panel/35 px-3 py-2">
            <span className="font-mono text-2xs uppercase tracking-label text-ink-muted">
              saved source
            </span>
            <div className="flex items-center gap-1.5">
              <CopyButton
                value={snippet.code}
                label={`Copy snippet ${snippet.title}`}
              />
              <OpenInAnalyzerButton
                code={snippet.code}
                language={snippet.language}
              />
            </div>
          </div>
          <pre className="max-h-72 overflow-auto p-4 font-mono text-sm leading-6 text-ink-secondary">
            <code>{snippet.code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
