"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type LoaderSize = "sm" | "md" | "lg";

export interface HoloPulseLoaderProps {
  label?: string;
  fullScreen?: boolean;
  size?: LoaderSize;
  className?: string;
}

const sizes: Record<
  LoaderSize,
  {
    shell: string;
    ring: string;
    cross: string;
    dot: string;
    iconWrap: string;
    icon: number;
    label: string;
    gap: string;
  }
> = {
  sm: {
    shell: "size-9",
    ring: "size-7",
    cross: "h-10 w-10",
    dot: "size-1",
    iconWrap: "p-0.5",
    icon: 11,
    label: "text-[9px]",
    gap: "gap-2",
  },
  md: {
    shell: "size-16",
    ring: "size-14",
    cross: "h-16 w-16",
    dot: "size-1.5",
    iconWrap: "p-1",
    icon: 16,
    label: "text-[10px]",
    gap: "gap-4",
  },
  lg: {
    shell: "size-24",
    ring: "size-20",
    cross: "h-24 w-24",
    dot: "size-2",
    iconWrap: "p-1.5",
    icon: 20,
    label: "text-xs",
    gap: "gap-5",
  },
};

/**
 * HoloPulseLoader is the shared ComplexityLab loading instrument. Use
 * `fullScreen` only for route/page/auth waits; keep compact sizes for cards,
 * buttons, and AI generation states.
 */
export function HoloPulseLoader({
  label = "Loading",
  fullScreen = false,
  size = "md",
  className,
}: HoloPulseLoaderProps) {
  const [dots, setDots] = React.useState("");
  const s = sizes[size];

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setDots((value) => (value.length >= 3 ? "" : `${value}.`));
    }, 420);
    return () => window.clearInterval(interval);
  }, []);

  const statusText = `${label}${dots}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        s.gap,
        fullScreen
          ? "min-h-screen w-full bg-background bg-grid-lines px-6"
          : "w-fit",
        className,
      )}
    >
      <div className="relative flex items-center justify-center">
        <div
          aria-hidden
          className="absolute inset-0 scale-150 rounded-full bg-[radial-gradient(circle,rgba(0,229,153,0.18),rgba(34,211,238,0.09)_42%,transparent_68%)] blur-xl motion-safe:animate-pulse"
        />

        <div
          aria-hidden
          className={cn(
            "absolute flex items-center justify-center opacity-25",
            s.cross,
          )}
        >
          <div className="absolute h-full w-px bg-gradient-to-b from-transparent via-cyan-300 to-transparent" />
          <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
        </div>

        <div
          aria-hidden
          className={cn(
            "relative flex items-center justify-center rounded-full border border-dashed border-cyan-300/25 motion-safe:animate-[spin_2.4s_linear_infinite]",
            s.shell,
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-full border border-dashed border-emerald-300/45 motion-safe:animate-[spin_1.45s_linear_infinite_reverse]",
              s.ring,
            )}
          >
            <div
              className={cn(
                "relative z-10 rounded-full border border-emerald-300/35 bg-background shadow-[0_0_18px_-6px_rgba(0,229,153,0.95)]",
                s.iconWrap,
              )}
            >
              <PlusIcon
                size={s.icon}
                className="text-emerald-300 motion-safe:animate-[pulse_2s_ease-in-out_infinite]"
              />
            </div>
          </div>

          <div className={cn("absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(0,229,153,0.9)]", s.dot)} />
          <div className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.85)]", s.dot)} />
          <div className={cn("absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.85)]", s.dot)} />
          <div className={cn("absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.85)]", s.dot)} />
        </div>
      </div>

      <p
        className={cn(
          "font-mono font-medium uppercase tracking-[0.24em] text-emerald-300",
          s.label,
        )}
      >
        <span aria-hidden>{statusText}</span>
        <span className="sr-only">{label}</span>
      </p>
    </div>
  );
}
