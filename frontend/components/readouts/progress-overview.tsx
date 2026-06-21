import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { DashboardStat, ProgressMetric } from "@/types";

export function ProgressOverview({
  stats,
  metrics,
}: {
  stats: DashboardStat[];
  metrics: ProgressMetric[];
}) {
  const hasData = stats.length > 0 || metrics.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress overview</CardTitle>
        <CardDescription>Your lab activity at a glance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {!hasData && (
          <EmptyState
            icon={TrendingUp}
            title="No progress yet"
            description="Run and save analyses to start tracking your activity."
          />
        )}
        {stats.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="trace-rail rounded-ds-lg border border-line-subtle bg-surface-panel/70 p-4 shadow-inset-well"
              >
                <p className="font-display text-3xl font-bold leading-none text-ink-primary">
                  {stat.value}
                </p>
                <p className="mt-3 font-mono text-2xs uppercase tracking-label text-primary/85">
                  {stat.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-ink-muted">{stat.hint}</p>
              </div>
            ))}
          </div>
        )}

        {metrics.length > 0 && (
          <div className="space-y-4">
            <p className="cx-label">Language mix</p>
            {metrics.map((metric) => (
              <ProgressBar
                key={metric.label}
                label={metric.label}
                value={metric.value}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
