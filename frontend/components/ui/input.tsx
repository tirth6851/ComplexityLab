import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Leading icon node, inset on the left. */
  icon?: React.ReactNode;
  /** Render the value in mono (for code / numeric input). */
  mono?: boolean;
}

/**
 * Input — a recessed "well" text field with an optional label, leading icon,
 * hint, and error state. Focus lights a Signal Green ring.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { label, error, hint, icon, mono, id, className, ...props },
    ref,
  ) {
    const reactId = React.useId();
    const inputId = id ?? reactId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-mono text-2xs font-medium uppercase tracking-label text-ink-muted"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="pointer-events-none absolute left-3 flex items-center text-ink-muted">
              {icon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            aria-invalid={error ? true : undefined}
            className={cn(
              "h-10 w-full rounded-ds-md border bg-surface-inset text-sm text-ink-primary shadow-inset-well outline-none transition-[border-color,box-shadow] placeholder:text-ink-faint",
              "focus:border-primary/60 focus:shadow-glow-green",
              error
                ? "border-destructive/60"
                : "border-line-subtle",
              icon ? "pl-9 pr-3" : "px-3",
              mono && "font-mono",
              className,
            )}
            {...props}
          />
        </div>
        {error ? (
          <span className="text-xs text-destructive">{error}</span>
        ) : (
          hint && <span className="text-xs text-ink-muted">{hint}</span>
        )}
      </div>
    );
  },
);
