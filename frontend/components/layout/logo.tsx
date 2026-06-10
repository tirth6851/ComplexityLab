import { cn } from "@/lib/utils";

/**
 * ComplexityLab logo — a lab-mark (a rising cost curve in an ink chip) plus the
 * wordmark. The curve traces a Big-O growth path, terminating in a Signal Green
 * node. Pure inline SVG + tokens; no icon dependency.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className="flex size-8 flex-none items-center justify-center rounded-ds-sm border border-line-accent shadow-glow-green"
        style={{
          background: "linear-gradient(180deg, var(--ink-750), var(--ink-850))",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 21 H21"
            stroke="var(--border-strong)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M3 19 C 8 19, 9 14, 12 11 S 18 4, 21 3"
            stroke="var(--accent-green)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="21" cy="3" r="2.1" fill="var(--accent-green)" />
        </svg>
      </span>
      {showWordmark && (
        <span className="font-semibold tracking-tight">
          Complexity<span className="text-primary">Lab</span>
        </span>
      )}
    </div>
  );
}
