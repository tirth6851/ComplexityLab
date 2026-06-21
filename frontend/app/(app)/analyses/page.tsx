import type { Metadata } from "next";
import Link from "next/link";
import { Clock, ScanLine } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ComplexityBadge } from "@/components/ui/complexity-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { buttonClassName } from "@/components/ui/button";
import { listAnalyses } from "@/lib/db/analyses";
import { languageLabel } from "@/lib/analysis/languages";
import { timeAgo } from "@/lib/format";
import { deleteAnalysisAction } from "./actions";

export const metadata: Metadata = {
  title: "Analyses - ComplexityLab",
};

export default async function AnalysesPage() {
  const res = await listAnalyses(100);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-start justify-between space-y-0 border-b border-line-subtle bg-surface-panel/35">
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-2xs uppercase tracking-label text-primary">
              Saved reasoning
            </p>
            <CardTitle>Analyses</CardTitle>
            <CardDescription>
              Every complexity breakdown you have saved
            </CardDescription>
          </div>
          <Link href="/analyzer" className={buttonClassName({ size: "sm" })}>
            <ScanLine className="h-3.5 w-3.5" aria-hidden />
            New analysis
          </Link>
        </CardHeader>
        <CardContent className="space-y-2 p-4 sm:p-5">
          {!res.ok ? (
            <ErrorState
              title="Could not load analyses"
              message={res.error}
              hint="This is usually temporary - please refresh in a moment. If it keeps happening, the data service may be down."
            />
          ) : res.data.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No analyses saved yet"
              description="Run code through the analyzer and select Save analysis to build your history."
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
            res.data.map((a) => (
              <div
                key={a.id}
                className="group grid gap-3 rounded-ds-lg border border-line-subtle bg-surface-panel/30 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-raised/70 hover:shadow-ds-md sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <Link href={`/analyses/${a.id}`} className="min-w-0">
                  <p className="truncate font-mono text-sm font-semibold text-ink-primary group-hover:text-primary">
                    {a.title}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                    <span>{languageLabel(a.language)}</span>
                    <span aria-hidden>/</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(a.createdAt)}
                    </span>
                  </p>
                  {a.verdict && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-secondary">
                      {a.verdict}
                    </p>
                  )}
                </Link>
                <div className="flex shrink-0 items-center gap-1.5 sm:justify-end">
                  <ComplexityBadge complexity={a.timeComplexity} />
                  <ComplexityBadge
                    complexity={a.spaceComplexity}
                    showDot={false}
                    className="hidden sm:inline-flex"
                  />
                  <ConfirmDeleteButton
                    action={deleteAnalysisAction.bind(null, a.id)}
                    label={`Delete analysis ${a.title}`}
                    successMessage="Analysis deleted"
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
