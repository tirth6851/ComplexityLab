import Link from "next/link";
import { ArrowRight, Bookmark, ScanLine } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClassName } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import { languageLabel } from "@/lib/analysis/languages";
import type { Snippet } from "@/types";

export function SavedSnippets({ snippets }: { snippets: Snippet[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between space-y-0 border-b border-line-subtle bg-surface-panel/35">
        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-2xs uppercase tracking-label text-primary">
            Reuse library
          </p>
          <CardTitle>Saved snippets</CardTitle>
          <CardDescription>Reusable solutions you have starred</CardDescription>
        </div>
        {snippets.length > 0 && (
          <Link
            href="/snippets"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View all
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        )}
      </CardHeader>
      <CardContent className="space-y-2 p-4 sm:p-5">
        {snippets.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No saved snippets"
            description="Save reusable solutions from the analyzer so your best patterns stay close."
            action={
              <Link
                href="/analyzer"
                className={buttonClassName({ variant: "outline", size: "sm" })}
              >
                <ScanLine className="h-3.5 w-3.5" aria-hidden />
                Open analyzer
              </Link>
            }
          />
        ) : (
          snippets.map((s) => (
            <div
              key={s.id}
              className="group grid gap-3 rounded-ds-lg border border-line-subtle bg-surface-panel/30 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-raised/70 hover:shadow-ds-md sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-ds-md border border-line-accent bg-card text-primary shadow-inset-well">
                  <Bookmark className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-primary group-hover:text-primary">
                    {s.title}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {languageLabel(s.language)} / {timeAgo(s.savedAt)}
                  </p>
                </div>
              </div>
              {s.tags.length > 0 && (
                <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                  {s.tags.slice(0, 3).map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
