import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HoloPulseLoader } from "@/components/ui/holo-pulse-loader";
import { Skeleton } from "@/components/ui/skeleton";

/** Route-level loading UI for the dashboard. Mirrors the real layout's rhythm. */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-ds-xl border border-line-subtle bg-card/80 p-8 shadow-ds-lg">
        <HoloPulseLoader label="Loading dashboard" size="md" className="mx-auto" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[0, 1, 2].map((r) => (
                  <Skeleton key={r} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-6">
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[0, 1, 2].map((r) => (
                  <Skeleton key={r} className="h-9 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
