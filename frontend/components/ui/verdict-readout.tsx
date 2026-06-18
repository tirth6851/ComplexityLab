import * as React from "react";
import { cn } from "@/lib/utils";
import { BigOBadge } from "@/components/ui/big-o-badge";
import {
  TIER_COLOR,
  TIER_VERDICT,
  tierFromNotation,
  type ComplexityTier,
} from "@/lib/complexity";

export interface VerdictReadoutProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Instrument label, e.g. "TIME" or "SPACE". */
  label: string;
  /** Big-O class for this measurement. */
  notation: string;
  /** Override the auto-detected tier. */
  tier?: ComplexityTier;
  /** Replace the default verdict word with custom copy. */
  note?: string;
}

/**
 * VerdictReadout — the product's hero instrument row. An uppercase mono label,
 * the Big-O badge, and a tier-colored status verdict, over a dot-grid panel
 * with a tier-colored left rule.
 */
export function VerdictReadout({
  label,
  notation,
  tier,
  note,
  className,
  style,
  ...props
}: VerdictReadoutProps) {
  const t = tier ?? tierFromNotation(notation);
  const c = TIER_COLOR[t].fg;
  const v = TIER_VERDICT[t];

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-ds-lg border border-l-2 border-line-subtle bg-surface-panel bg-grid-dots p-4 shadow-inset-well",
        className,
      )}
      style={{ borderLeftColor: c, ...style }}
      {...props}
    >
      <span className="cx-label w-14 flex-none">{label}</span>

      <BigOBadge notation={notation} tier={t} size="md" />

      <span className="flex-1" />

      <span
        className="inline-flex items-center gap-2 whitespace-nowrap font-mono text-sm font-medium"
        style={{ color: c }}
      >
        <span style={{ textShadow: `0 0 8px ${c}` }}>{v.glyph}</span>
        {note ?? v.label}
      </span>
    </div>
  );
}
