import { Skeleton } from "@/components/ui/skeleton";

export default function PlaygroundLoading() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-0">
      <div className="overflow-hidden rounded-ds-xl border border-line-subtle bg-card shadow-ds-xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-line-subtle bg-surface-panel/45 p-4 sm:p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
          <div className="border-line-subtle xl:border-r">
            <Skeleton className="h-[clamp(360px,62dvh,620px)] w-full rounded-none" />
            <div className="flex items-center justify-between border-t border-line-subtle bg-surface-panel/45 px-4 py-3">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
          <div className="p-4 sm:p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
