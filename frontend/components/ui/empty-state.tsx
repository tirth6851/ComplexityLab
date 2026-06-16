import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Consistent empty/zero-data state for readouts and lists. Keeps the "no data"
 * case on-brand instead of rendering a bare gap.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-ds-xl border border-dashed border-line bg-surface-panel/45 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-ds-md border border-line bg-card text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
