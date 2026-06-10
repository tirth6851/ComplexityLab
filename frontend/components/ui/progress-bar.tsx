import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  /** Completion percentage, 0–100. */
  value: number;
  label?: string;
  showPercent?: boolean;
  /** Override the auto color (a CSS color or token var). */
  color?: string;
}

/** Auto-color the fill by completion: higher is greener. */
function autoColor(v: number): string {
  if (v >= 80) return "var(--c-o1)";
  if (v >= 50) return "var(--c-n)";
  if (v >= 25) return "var(--c-nlogn)";
  return "var(--c-n2)";
}

/**
 * ProgressBar — an animated, tier-colored progress track with an optional
 * label and percentage readout.
 */
export function ProgressBar({
  value,
  label,
  showPercent = true,
  color,
  className,
  ...props
}: ProgressBarProps) {
  const v = Math.min(100, Math.max(0, value));
  const fill = color ?? autoColor(v);

  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <span className="text-sm font-medium text-ink-primary">
              {label}
            </span>
          )}
          {showPercent && (
            <span className="flex-none font-mono text-xs text-ink-muted">
              {v}%
            </span>
          )}
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-pill bg-surface-inset shadow-inset-well">
        <div
          className="h-full rounded-pill transition-[width] duration-[360ms] ease-ds"
          style={{ width: `${v}%`, background: fill }}
        />
      </div>
    </div>
  );
}
