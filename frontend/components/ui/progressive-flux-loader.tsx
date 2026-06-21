"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface ProgressiveFluxPhase {
  at: number;
  label: string;
}

export interface ProgressiveFluxLoaderProps {
  value?: number;
  phases?: ProgressiveFluxPhase[];
  duration?: number;
  loop?: boolean;
  showLabel?: boolean;
  label?: string;
  gradient?: string;
  onComplete?: () => void;
  className?: string;
  barClassName?: string;
  textClassName?: string;
}

export const COMPLEXITY_ANALYSIS_PHASES: ProgressiveFluxPhase[] = [
  { at: 0, label: "initializing analysis" },
  { at: 25, label: "scanning code structure" },
  { at: 55, label: "estimating complexity" },
  { at: 80, label: "generating insights" },
  { at: 100, label: "analysis complete" },
];

const FLUX_FROM = "var(--flux-from, #00E599)";
const FLUX_MID = "var(--flux-mid, #2DD4BF)";
const FLUX_TO = "var(--flux-to, #22D3EE)";

const DEFAULT_GRADIENT = `linear-gradient(90deg, ${FLUX_FROM} 0%, ${FLUX_MID} 36%, ${FLUX_TO} 56%, ${FLUX_MID} 78%, ${FLUX_FROM} 100%)`;
const BAR_SHADOW = `0 0 18px color-mix(in oklab, ${FLUX_FROM} 48%, transparent), 0 0 34px color-mix(in oklab, ${FLUX_TO} 34%, transparent), inset 0 1.5px 0 rgba(255,255,255,0.42), inset 0 -2px 3px rgba(0,30,40,0.38)`;
const SHEEN_GRADIENT =
  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)";

const Z_TRANSITION: Transition = { duration: 0.82, ease: [0.22, 1, 0.36, 1] };
const LETTER_TRANSITION: Transition = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1],
};

function pickLabel(value: number, sortedPhases: ProgressiveFluxPhase[]) {
  let active = sortedPhases[0]?.label ?? "";
  for (const phase of sortedPhases) {
    if (value >= phase.at) active = phase.label;
  }
  return active;
}

function FluxLabel({
  label,
  reduced,
  className,
}: {
  label: string;
  reduced: boolean;
  className?: string;
}) {
  const base = cn(
    "absolute inset-0 flex items-center justify-center text-center font-display text-2xl font-semibold tracking-normal text-ink-primary sm:text-3xl",
    className,
  );

  if (reduced) {
    return (
      <div aria-hidden className={base}>
        {label}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={label}
        aria-hidden
        className={base}
        style={{ transformStyle: "preserve-3d" }}
        initial={{ opacity: 0, z: -260, scale: 0.78, filter: "blur(12px)" }}
        animate={{
          opacity: [0, 1, 1],
          z: [-260, 34, 0],
          scale: [0.78, 1.035, 1],
          filter: ["blur(12px)", "blur(0px)", "blur(0px)"],
        }}
        exit={{
          opacity: 0,
          z: 160,
          scale: 1.16,
          filter: "blur(8px)",
          transition: { duration: 0.32, ease: [0.7, 0, 0.84, 0] },
        }}
        transition={Z_TRANSITION}
      >
        <span className="inline-flex">
          {label.split("").map((char, index) => (
            <motion.span
              key={`${label}-${index}`}
              className="inline-block"
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ ...LETTER_TRANSITION, delay: 0.12 + index * 0.025 }}
            >
              {char === " " ? "\u00a0" : char}
            </motion.span>
          ))}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

export function ProgressiveFluxLoader({
  value,
  phases = COMPLEXITY_ANALYSIS_PHASES,
  duration = 12,
  loop = true,
  showLabel = true,
  label = "Progress",
  gradient = DEFAULT_GRADIENT,
  onComplete,
  className,
  barClassName,
  textClassName,
}: ProgressiveFluxLoaderProps) {
  const reduced = !!useReducedMotion();
  const isControlled = typeof value === "number";
  const [internal, setInternal] = React.useState(0);
  const onCompleteRef = React.useRef(onComplete);
  const completedRef = React.useRef(false);

  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  React.useEffect(() => {
    if (isControlled) return;
    let raf = 0;
    let timer = 0;
    let start: number | null = null;
    const totalMs = Math.max(500, duration * 1000);

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const pct = Math.min(100, ((ts - start) / totalMs) * 100);
      setInternal(pct);
      if (pct >= 100) {
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current?.();
        }
        if (loop) {
          start = null;
          completedRef.current = false;
          timer = window.setTimeout(() => {
            setInternal(0);
            raf = requestAnimationFrame(tick);
          }, 700);
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [isControlled, duration, loop]);

  const raw = isControlled ? value! : internal;
  const current = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;

  React.useEffect(() => {
    if (!isControlled) return;
    if (current >= 100 && !completedRef.current) {
      completedRef.current = true;
      onCompleteRef.current?.();
    } else if (current < 100) {
      completedRef.current = false;
    }
  }, [isControlled, current]);

  const sortedPhases = React.useMemo(
    () => [...phases].sort((a, b) => a.at - b.at),
    [phases],
  );
  const phaseLabel = React.useMemo(
    () => pickLabel(current, sortedPhases),
    [current, sortedPhases],
  );
  const rounded = Math.round(current);

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center gap-5",
        className,
      )}
    >
      {showLabel && (
        <div
          className="relative h-14 w-full select-none"
          style={reduced ? undefined : { perspective: "1000px" }}
        >
          <FluxLabel
            label={phaseLabel}
            reduced={reduced}
            className={textClassName}
          />
        </div>
      )}

      <div className="w-full space-y-2">
        <div
          className={cn(
            "relative h-4 w-full overflow-hidden rounded-full border border-line-subtle bg-surface-inset shadow-[inset_0_2px_5px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.04)]",
            barClassName,
          )}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={rounded}
          aria-valuetext={phaseLabel ? `${rounded}% - ${phaseLabel}` : `${rounded}%`}
          aria-label={label}
        >
          <motion.div
            className="relative h-full rounded-full"
            style={{ background: gradient, boxShadow: BAR_SHADOW }}
            initial={false}
            animate={{ width: `${current}%` }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
            }
          >
            {!reduced && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-1/2 rounded-full"
                style={{ background: SHEEN_GRADIENT, mixBlendMode: "screen" }}
                animate={{ x: ["-110%", "210%"] }}
                transition={{ duration: 1.45, ease: "linear", repeat: Infinity }}
              />
            )}
          </motion.div>
        </div>
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">
          <span>{phaseLabel}</span>
          <span>{rounded}%</span>
        </div>
      </div>
    </div>
  );
}

export default ProgressiveFluxLoader;
