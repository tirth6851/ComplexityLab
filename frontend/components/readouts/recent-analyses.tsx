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
import { buttonClassName } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import { languageLabel } from "@/lib/analysis/languages";
import type { Analysis } from "@/types";

export function RecentAnalyses({ analyses }: { analyses: Analysis[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Recent analyses</CardTitle>
          <CardDescription>Your latest complexity breakdowns</CardDescription>
        </div>
        {analyses.length > 0 && (
          <Link
            href="/analyses"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </Link>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        {analyses.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No analyses yet"
            description="Run your first analysis to see its complexity breakdown here."
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
              className="flex items-center justify-between gap-4 rounded-ds-md border border-transparent px-3 py-3 transition-all hover:border-line hover:bg-surface-raised/70"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-medium">{a.title}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                  <span>{languageLabel(a.language)}</span>
                  <span aria-hidden>·</span>
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
