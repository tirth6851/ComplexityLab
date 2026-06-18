import Link from "next/link";
import { ArrowRight, Clock, ScanLine } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ComplexityBadge } from "@/components/ui/complexity-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClassName } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import { languageLabel } from "@/lib/analysis/languages";
import type { Analysis } from "@/types";

export function RecentAnalyses({ analyses }: { analyses: Analysis[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between space-y-0 border-b border-line-subtle bg-surface-panel/35">
        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-2xs uppercase tracking-label text-primary">
            Review loop
          </p>
          <CardTitle>Recent analyses</CardTitle>
          <CardDescription>Your latest complexity breakdowns</CardDescription>
        </div>
        {analyses.length > 0 && (
          <Link
            href="/analyses"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View all
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        )}
      </CardHeader>
      <CardContent className="space-y-2 p-4 sm:p-5">
        {analyses.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No analyses yet"
            description="Run your first analysis to start building a searchable history of complexity patterns."
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
          analyses.map((a) => (
            <Link
              key={a.id}
              href={`/analyses/${a.id}`}
              className="group grid gap-3 rounded-ds-lg border border-line-subtle bg-surface-panel/30 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-raised/70 hover:shadow-ds-md sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="min-w-0">
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
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <ComplexityBadge complexity={a.timeComplexity} />
                <ComplexityBadge complexity={a.spaceComplexity} showDot={false} />
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
