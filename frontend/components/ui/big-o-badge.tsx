import * as React from "react";
import { cn } from "@/lib/utils";
import {
  TIER_COLOR,
  TIER_VERDICT,
  tierFromNotation,
  type ComplexityTier,
} from "@/lib/complexity";

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, { wrap: string; tier: string }> = {
  sm: { wrap: "h-[22px] gap-1.5 px-2 text-xs", tier: "text-[0.5625rem]" },
  md: { wrap: "h-7 gap-2 px-2.5 text-sm", tier: "text-[0.625rem]" },
  lg: { wrap: "h-[38px] gap-2 px-4 text-lg", tier: "text-xs" },
};

export interface BigOBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** Big-O class to display, e.g. "O(n log n)". */
  notation: string;
  /** Override the auto-detected cost tier. */
  tier?: ComplexityTier;
  size?: Size;
  /** Append the tier word ("Optimal", "Critical", …). */
  showTier?: boolean;
  /** Signal-green-style bloom around the chip. */
  glow?: boolean;
}

/**
 * BigOBadge — the signature complexity chip. Renders the Big-O class in mono,
 * auto-colored by cost tier. The tier color is data-driven (from the token
 * map), so it carries via inline custom properties; structure is Tailwind.
 */
export function BigOBadge({
  notation,
  tier,
  size = "md",
  showTier = false,
  glow = false,
  className,
  style,
  ...props
}: BigOBadgeProps) {
  const t = tier ?? tierFromNotation(notation);
  const c = TIER_COLOR[t];
  const s = sizes[size];

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-ds-sm border font-mono font-bold leading-none tracking-normal",
        s.wrap,
        className,
      )}
      style={{
        color: c.fg,
        background: c.bg,
        borderColor: c.border,
        boxShadow: glow ? `0 0 18px -4px ${c.fg}` : undefined,
        ...style,
      }}
      {...props}
    >
      <span>{notation}</span>
      {showTier && (
        <span
          className={cn(
            "ml-0.5 border-l pl-2 font-medium uppercase tracking-label opacity-85",
            s.tier,
          )}
          style={{ borderColor: c.border }}
        >
          {TIER_VERDICT[t].label}
        </span>
      )}
    </span>
  );
}
