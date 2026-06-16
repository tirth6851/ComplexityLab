import * as React from "react";
import { cn } from "@/lib/utils";
import type { ComplexityLevel } from "@/lib/complexity";

export type { ComplexityLevel };

type Variant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "success"
  | "warning"
  | "info";

const variants: Record<Variant, string> = {
  default: "bg-primary/12 text-primary ring-1 ring-inset ring-primary/25",
  secondary: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
  outline: "border border-line text-ink-primary",
  destructive:
    "bg-destructive/12 text-destructive ring-1 ring-inset ring-destructive/30",
  success: "bg-[var(--ok-bg)] text-[var(--ok)] ring-1 ring-inset ring-[var(--ok)]/25",
  warning: "bg-[var(--warn-bg)] text-[var(--warn)] ring-1 ring-inset ring-[var(--warn)]/30",
  info: "bg-[var(--info-bg)] text-[var(--info)] ring-1 ring-inset ring-[var(--info)]/30",
};

const complexityVariants: Record<ComplexityLevel, string> = {
  1: "bg-complexity-1/12 text-complexity-1 ring-1 ring-inset ring-complexity-1/25",
  2: "bg-complexity-2/12 text-complexity-2 ring-1 ring-inset ring-complexity-2/25",
  3: "bg-complexity-3/12 text-complexity-3 ring-1 ring-inset ring-complexity-3/25",
  4: "bg-complexity-4/12 text-complexity-4 ring-1 ring-inset ring-complexity-4/25",
  5: "bg-complexity-5/12 text-complexity-5 ring-1 ring-inset ring-complexity-5/25",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  /** When set, renders a complexity-gradient tint instead of `variant`. */
  complexity?: ComplexityLevel;
}

export function Badge({
  className,
  variant = "default",
  complexity,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-ds-sm px-2 py-0.5 text-xs font-medium",
        complexity ? complexityVariants[complexity] : variants[variant],
        className,
      )}
      {...props}
    />
  );
}
