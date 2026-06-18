import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HoloPulseLoader } from "@/components/ui/holo-pulse-loader";
import { Skeleton } from "@/components/ui/skeleton";

export default function SnippetsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <HoloPulseLoader label="Loading snippets" size="sm" className="items-start" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
