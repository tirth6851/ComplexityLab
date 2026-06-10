import { TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Consistent error block for data-load failures (the destructive sibling of
 * EmptyState). Server-safe.
 */
export function ErrorState({
  icon: Icon = TriangleAlert,
  title = "Something went wrong",
  message,
  hint,
  className,
}: {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-ds-md border border-dashed border-destructive/40 bg-[var(--danger-bg)] px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-destructive/40 text-destructive">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-medium text-ink-primary">{title}</p>
      {message && (
        <p className="max-w-sm text-xs text-ink-muted">{message}</p>
      )}
      {hint && <p className="max-w-sm text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}
