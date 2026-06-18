import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Consistent empty/zero-data state for readouts and lists. It gives people a
 * next step instead of a dead end, while staying quiet enough for dashboards.
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
        "relative overflow-hidden rounded-ds-xl border border-dashed border-line-subtle bg-surface-panel/45 px-6 py-12 text-center shadow-inset-well",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-6 h-28 w-28 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative mx-auto flex max-w-sm flex-col items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-ds-lg border border-line-accent bg-card text-primary shadow-glow-green-soft">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="space-y-1.5">
          <p className="font-display text-lg font-semibold leading-tight text-foreground">
            {title}
          </p>
          {description && (
            <p className="text-sm leading-6 text-ink-secondary">{description}</p>
          )}
        </div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
