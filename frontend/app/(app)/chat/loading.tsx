import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      <Card className="h-[60vh] p-4">
        <div className="flex h-full flex-col justify-end gap-3">
          <div className="flex justify-end">
            <Skeleton className="h-8 w-48 rounded-ds-lg" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-16 w-72 rounded-ds-lg" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-8 w-36 rounded-ds-lg" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-12 w-64 rounded-ds-lg" />
          </div>
        </div>
      </Card>
      <Skeleton className="h-20 w-full rounded-ds-md" />
    </div>
  );
}
