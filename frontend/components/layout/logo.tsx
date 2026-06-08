import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <FlaskConical className="h-4 w-4" />
      </span>
      {showWordmark && (
        <span className="font-semibold tracking-tight">
          Complexity<span className="text-muted-foreground">Lab</span>
        </span>
      )}
    </div>
  );
}
