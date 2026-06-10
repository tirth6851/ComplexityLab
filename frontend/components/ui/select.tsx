import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

/**
 * Select — a native select styled as a recessed "well" (matches Input).
 * Native on purpose: full keyboard/touch support with zero dependencies.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, id, className, children, ...props }, ref) {
    const reactId = React.useId();
    const selectId = id ?? reactId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-medium tracking-[0.01em] text-ink-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "h-9 w-full cursor-pointer appearance-none rounded-ds-md border border-line bg-surface-inset pl-3 pr-8 text-sm text-ink-primary shadow-inset-well outline-none transition-[border-color,box-shadow]",
              "focus:border-primary/60 focus:shadow-glow-green",
              "disabled:cursor-not-allowed disabled:opacity-45",
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
        </div>
      </div>
    );
  },
);
