import Link from "next/link";
import { Bookmark, ScanLine } from "lucide-react";
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
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Saved snippets</CardTitle>
          <CardDescription>Reusable solutions you have starred</CardDescription>
        </div>
        {snippets.length > 0 && (
          <Link
            href="/snippets"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </Link>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        {snippets.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No saved snippets"
            description="Save a solution from the analyzer to keep it handy here."
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
              className="flex items-center justify-between gap-4 rounded-ds-md border border-transparent px-3 py-3 transition-all hover:border-line hover:bg-surface-raised/70"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-ds-md border border-line bg-surface-panel text-primary">
                  <Bookmark className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {languageLabel(s.language)} · {timeAgo(s.savedAt)}
                  </p>
                </div>
              </div>
              {s.tags.length > 0 && (
                <div className="hidden shrink-0 gap-1.5 sm:flex">
                  {s.tags.map((tag) => (
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
