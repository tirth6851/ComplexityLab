import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, Clock, ScanLine } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { buttonClassName } from "@/components/ui/button";
import { listSnippets } from "@/lib/db/snippets";
import { languageLabel } from "@/lib/analysis/languages";
import { timeAgo } from "@/lib/format";
import { deleteSnippetAction } from "./actions";

export const metadata: Metadata = {
  title: "Snippets · ComplexityLab",
};

export default async function SnippetsPage() {
  const res = await listSnippets(100);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Snippets</CardTitle>
            <CardDescription>
              Reusable solutions saved from the analyzer
            </CardDescription>
          </div>
          <Link href="/analyzer" className={buttonClassName({ size: "sm" })}>
            <ScanLine className="h-3.5 w-3.5" aria-hidden />
            Open analyzer
          </Link>
        </CardHeader>
        <CardContent className="space-y-1">
          {!res.ok ? (
            <ErrorState
              title="Could not load snippets"
              message={res.error}
              hint="If the database hasn't been provisioned yet, apply supabase/migrations and check the Supabase env vars."
            />
          ) : res.data.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No snippets saved yet"
              description="Analyze code and hit “Save snippet” to keep solutions you want to reuse."
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
            res.data.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-ds-sm px-2 py-2.5 transition-colors hover:bg-surface-raised"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-ds-sm border border-line-subtle bg-surface-panel text-ink-muted">
                    <Bookmark className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                      <span>{languageLabel(s.language)}</span>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(s.savedAt)}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {s.tags.length > 0 && (
                    <div className="hidden gap-1.5 sm:flex">
                      {s.tags.map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                  )}
                  <ConfirmDeleteButton
                    action={deleteSnippetAction.bind(null, s.id)}
                    label={`Delete snippet ${s.title}`}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
