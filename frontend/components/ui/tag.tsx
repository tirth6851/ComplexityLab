import * as React from "react";
import { cn } from "@/lib/utils";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  selected?: boolean;
  /** Optional colored dot (a CSS color or token var). */
  dotColor?: string;
  /** Renders a × affordance and fires this on click. */
  onRemove?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Tag — a mono chip for filters, languages, and selectable facets. Optional
 * colored dot, selected (Signal Green) state, and removable affordance.
 */
export function Tag({
  children,
  selected = false,
  dotColor,
  onRemove,
  onClick,
  className,
  ...props
}: TagProps) {
  const interactive = !!onClick;

  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-ds-sm border px-2.5 font-mono text-xs font-medium tracking-[0.01em] transition-colors duration-[120ms] ease-ds",
        selected
          ? "border-line-accent bg-[var(--accent-muted)] text-[var(--green-300)]"
          : "border-line bg-surface-card text-ink-secondary",
        interactive && !selected && "hover:bg-surface-raised",
        interactive && "cursor-pointer",
        className,
      )}
      {...props}
    >
      {dotColor && (
        <span
          className="size-[7px] flex-none rounded-[2px]"
          style={{ background: dotColor }}
        />
      )}
      {children}
      {onRemove && (
        <button
          type="button"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(e);
          }}
          className="-mr-0.5 inline-flex size-3.5 items-center justify-center rounded-ds-xs text-ink-muted hover:text-ink-primary"
        >
          ×
        </button>
      )}
    </span>
  );
}
