import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Per-class colors on the full 7-stop complexity gradient
 * (O(1) optimal → O(n!) catastrophic). Distinct from the 5 named *tiers* —
 * this badge colors by exact Big-O class.
 */
const NOTATION_COLOR: Record<string, { fg: string; bg: string }> = {
  "o(1)": { fg: "var(--c-o1)", bg: "var(--c-o1-bg)" },
  "o(logn)": { fg: "var(--c-log)", bg: "var(--c-log-bg)" },
  "o(n)": { fg: "var(--c-n)", bg: "var(--c-n-bg)" },
  "o(nlogn)": { fg: "var(--c-nlogn)", bg: "var(--c-nlogn-bg)" },
  "o(n²)": { fg: "var(--c-n2)", bg: "var(--c-n2-bg)" },
  "o(n^2)": { fg: "var(--c-n2)", bg: "var(--c-n2-bg)" },
  "o(2ⁿ)": { fg: "var(--c-exp)", bg: "var(--c-exp-bg)" },
  "o(2^n)": { fg: "var(--c-exp)", bg: "var(--c-exp-bg)" },
  "o(n!)": { fg: "var(--c-fact)", bg: "var(--c-fact-bg)" },
};

const FALLBACK = { fg: "var(--text-secondary)", bg: "var(--surface-raised)" };

export interface ComplexityBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Big-O class to display + color, e.g. "O(n log n)". */
  complexity: string;
  /** Show the leading status dot. */
  showDot?: boolean;
}

/**
 * ComplexityBadge — a mono chip colored by exact Big-O class on the full
 * 7-stop gradient, with an optional status dot. Use for dense lists where the
 * precise class matters (e.g. analysis rows).
 */
export function ComplexityBadge({
  complexity,
  showDot = true,
  className,
  style,
  ...props
}: ComplexityBadgeProps) {
  const key = complexity.toLowerCase().replace(/\s/g, "");
  const c = NOTATION_COLOR[key] ?? FALLBACK;

  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-ds-sm border px-2 font-mono text-xs font-medium",
        className,
      )}
      style={{
        color: c.fg,
        background: c.bg,
        borderColor: `color-mix(in srgb, ${c.fg} 30%, transparent)`,
        ...style,
      }}
      {...props}
    >
      {showDot && (
        <span
          className="size-1.5 flex-none rounded-full"
          style={{ background: c.fg }}
        />
      )}
      {complexity}
    </span>
  );
}
