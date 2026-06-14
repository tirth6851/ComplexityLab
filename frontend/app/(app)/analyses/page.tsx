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
  title: "Analyses · ComplexityLab",
};

export default async function AnalysesPage() {
  const res = await listAnalyses(100);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="flex flex-col gap-1.5">
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
        <CardContent className="space-y-1">
          {!res.ok ? (
            <ErrorState
              title="Could not load analyses"
              message={res.error}
              hint="This is usually temporary — please refresh in a moment. If it keeps happening, the data service may be down."
            />
          ) : res.data.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No analyses saved yet"
              description="Run code through the analyzer and hit “Save analysis” to build your history."
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
                className="flex items-center justify-between gap-3 rounded-ds-sm px-2 py-2.5 transition-colors hover:bg-surface-raised"
              >
                <Link
                  href={`/analyses/${a.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate font-mono text-sm font-medium">
                    {a.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                    <span>{languageLabel(a.language)}</span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(a.createdAt)}
                    </span>
                  </p>
                  {a.verdict && (
                    <p className="mt-1 hidden truncate text-xs text-ink-faint sm:block">
                      {a.verdict}
                    </p>
                  )}
                </Link>
                <div className="flex shrink-0 items-center gap-1.5">
                  <ComplexityBadge complexity={a.timeComplexity} />
                  <ComplexityBadge
                    complexity={a.spaceComplexity}
                    showDot={false}
                    className="hidden sm:inline-flex"
                  />
                  <ConfirmDeleteButton
                    action={deleteAnalysisAction.bind(null, a.id)}
                    label={`Delete analysis ${a.title}`}
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
