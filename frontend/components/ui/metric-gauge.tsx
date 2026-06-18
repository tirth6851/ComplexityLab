import * as React from "react";
import { cn } from "@/lib/utils";
import { TIER_COLOR, type ComplexityTier } from "@/lib/complexity";

export interface MetricGaugeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Uppercase mono label, e.g. "RUNTIME". */
  label: string;
  /** Big mono value, e.g. "1.2 ms". */
  value: React.ReactNode;
  /** Fill fraction, 0–1. */
  fraction?: number;
  /** Tier color of the fill. `accent` uses Signal Green. */
  tier?: ComplexityTier | "accent";
  hint?: string;
}

/**
 * MetricGauge — a labeled horizontal gauge for one measurement (runtime,
 * memory, ops). Uppercase mono label + big mono value, with a glowing fill
 * proportional to `fraction`, colored by tier.
 */
export function MetricGauge({
  label,
  value,
  fraction = 0.5,
  tier = "accent",
  hint,
  className,
  ...props
}: MetricGaugeProps) {
  const color = tier === "accent" ? "var(--accent-green)" : TIER_COLOR[tier].fg;
  const pct = Math.max(0, Math.min(1, fraction)) * 100;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-ds-lg border border-line-subtle bg-surface-card/85 p-4 shadow-inset-well",
        className,
      )}
      {...props}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="cx-label">{label}</span>
        <span
          className="font-mono text-xl font-bold leading-none"
          style={{ color }}
        >
          {value}
        </span>
      </div>

      <div className="relative h-2 overflow-hidden rounded-pill bg-surface-inset shadow-inset-well">
        <div
          className="absolute inset-y-0 left-0 rounded-pill transition-[width] duration-[360ms] ease-ds"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: `0 0 12px -1px ${color}`,
          }}
        />
      </div>

      {hint && <span className="text-sm leading-5 text-ink-muted">{hint}</span>}
    </div>
  );
}
