import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, ScanLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ComplexityBadge } from "@/components/ui/complexity-badge";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { ResultsPanel } from "@/components/analyzer/results-panel";
import { buttonClassName } from "@/components/ui/button";
import { getAnalysis } from "@/lib/db/analyses";
import { languageLabel } from "@/lib/analysis/languages";
import { timeAgo } from "@/lib/format";
import { deleteAnalysisAndRedirectAction } from "./actions";

export const metadata: Metadata = {
  title: "Analysis · ComplexityLab",
};

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getAnalysis(id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/analyses"
        className={buttonClassName({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Analyses
      </Link>

      {!res.ok ? (
        <ErrorState
          title={
            res.error === "Analysis not found."
              ? "Analysis not found"
              : "Could not load analysis"
          }
          message={res.error}
          hint="This analysis may have been deleted or belongs to another account."
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-mono text-xl font-semibold text-ink-primary">
                {res.data.title}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                <span>{languageLabel(res.data.language)}</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {timeAgo(res.data.createdAt)}
                </span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1.5">
                  <ComplexityBadge complexity={res.data.timeComplexity} />
                  <ComplexityBadge
                    complexity={res.data.spaceComplexity}
                    showDot={false}
                  />
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/analyzer"
                className={buttonClassName({ variant: "outline", size: "sm" })}
              >
                <ScanLine className="h-3.5 w-3.5" aria-hidden />
                New analysis
              </Link>
              <ConfirmDeleteButton
                action={deleteAnalysisAndRedirectAction.bind(null, res.data.id)}
                label={`Delete ${res.data.title}`}
              />
            </div>
          </div>

          {/* Source code */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line-subtle bg-surface-panel px-4 py-2.5">
              <span className="font-mono text-2xs uppercase tracking-label text-ink-faint">
                Source code
              </span>
              <span className="font-mono text-2xs text-ink-faint">
                {languageLabel(res.data.language)} ·{" "}
                {res.data.code.split("\n").length} lines
              </span>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-ink-secondary">
              <code>{res.data.code}</code>
            </pre>
          </Card>

          {/* Results */}
          {res.data.result ? (
            <ResultsPanel status="done" analysis={res.data.result} />
          ) : (
            <Card className="flex flex-col items-start gap-3 p-6">
              <p className="text-sm text-ink-muted">
                No detailed results are stored for this analysis.
              </p>
              <Link
                href="/analyzer"
                className={buttonClassName({ variant: "outline", size: "sm" })}
              >
                <ScanLine className="h-3.5 w-3.5" aria-hidden />
                Re-analyze in editor
              </Link>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
