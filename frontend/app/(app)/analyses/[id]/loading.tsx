import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { HoloPulseLoader } from "@/components/ui/holo-pulse-loader";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalysisDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <HoloPulseLoader label="Loading analysis" size="sm" className="items-start" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-[30px] w-32" />
          <Skeleton className="h-[30px] w-8" />
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-line-subtle py-2.5">
          <Skeleton className="h-3 w-32" />
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="space-y-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </Card>
    </div>
  );
}
