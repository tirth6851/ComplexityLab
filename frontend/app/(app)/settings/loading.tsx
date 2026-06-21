import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HoloPulseLoader } from "@/components/ui/holo-pulse-loader";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <Card>
      <CardHeader>
        <HoloPulseLoader label="Loading settings" size="sm" className="items-start" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-28" />
      </CardContent>
    </Card>
  );
}
