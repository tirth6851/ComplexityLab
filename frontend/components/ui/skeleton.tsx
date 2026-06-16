import { cn } from "@/lib/utils";

/** Pulsing placeholder block for loading states. */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-surface-panel via-surface-raised to-surface-panel",
        className,
      )}
      aria-hidden
      {...props}
    />
  );
}
