import { Card } from "@/components/ui/card";
import { HoloPulseLoader } from "@/components/ui/holo-pulse-loader";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level loading UI for the analyzer. The page is an async server
 * component that awaits the profile's preferred language before rendering, so
 * without this the app's primary, most-visited surface would show a blank
 * content area on a cold or degraded DB. Mirrors the workbench's two-pane
 * rhythm (editor left, results right).
 */
export default function AnalyzerLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <HoloPulseLoader label="Preparing analyzer" size="sm" className="py-2" />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        {/* ---- input side ---- */}
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-end gap-3 border-b border-line-subtle p-4">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-52 flex-1 sm:flex-none" />
            <Skeleton className="ml-auto h-9 w-28" />
          </div>
          <Skeleton className="h-[420px] w-full rounded-none" />
          <div className="flex items-center justify-between gap-3 border-t border-line-subtle px-4 py-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-44" />
          </div>
        </Card>

        {/* ---- results side ---- */}
        <Card className="p-4 sm:p-5">
          <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 rounded-ds-md border border-dashed border-line bg-grid-dots p-8 text-center">
            <Skeleton className="size-12 rounded-ds-md" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-52" />
            <Skeleton className="h-3 w-40" />
          </div>
        </Card>
      </div>
    </div>
  );
}
