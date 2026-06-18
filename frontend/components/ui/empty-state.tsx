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
        "flex flex-col items-center justify-center gap-3 rounded-ds-xl border border-dashed border-line-subtle bg-surface-panel/45 px-6 py-12 text-center shadow-inset-well",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-ds-md border border-line-accent bg-card text-primary shadow-glow-green-soft">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="font-display text-base font-semibold text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-sm leading-6 text-ink-secondary">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
