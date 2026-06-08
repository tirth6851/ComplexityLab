import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { dashboardStats, progressMetrics } from "@/lib/mock-data";

export function ProgressOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress overview</CardTitle>
        <CardDescription>Your complexity skills by topic</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {dashboardStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-muted/40 p-3"
            >
              <p className="font-mono text-xl font-semibold tracking-tight">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium">{stat.label}</p>
              <p className="text-[11px] text-muted-foreground">{stat.hint}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {progressMetrics.map((metric) => (
            <div key={metric.label}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">{metric.label}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {metric.value}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
