import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProgressLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="overflow-hidden rounded-ds-xl border border-line-subtle bg-card shadow-ds-xl">
        <div className="p-6 sm:p-8">
          <Skeleton className="mb-2 h-3 w-28" />
          <Skeleton className="mb-3 h-9 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid border-t border-line-subtle bg-surface-panel/40 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 border-line-subtle p-5 sm:border-r last:sm:border-r-0">
              <Skeleton className="h-10 w-10 rounded-ds-md" />
              <div className="space-y-1">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[0, 1, 2].map((j) => (
                <Skeleton key={j} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
