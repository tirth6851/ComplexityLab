"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const notations = [
  {
    label: "O(1)",
    className: "-left-10 top-10 text-[92px] sm:text-[132px] lg:text-[156px]",
    opacity: "opacity-[0.035]",
    blur: "blur-[2px]",
    drift: 12,
    duration: 28,
    delay: 0,
  },
  {
    label: "O(log n)",
    className: "-right-16 top-20 text-[76px] sm:text-[112px] lg:text-[142px]",
    opacity: "opacity-[0.04]",
    blur: "blur-[3px]",
    drift: 10,
    duration: 34,
    delay: 3,
  },
  {
    label: "O(n)",
    className: "-left-20 top-[42%] text-[128px] sm:text-[168px] lg:text-[204px]",
    opacity: "opacity-[0.026]",
    blur: "blur-[4px]",
    drift: 14,
    duration: 38,
    delay: 1.5,
  },
  {
    label: "O(n log n)",
    className: "-right-28 top-[45%] text-[64px] sm:text-[96px] lg:text-[128px]",
    opacity: "opacity-[0.032]",
    blur: "blur-[3px]",
    drift: 9,
    duration: 31,
    delay: 5,
  },
  {
    label: "O(n�)",
    className: "-bottom-10 -left-12 text-[104px] sm:text-[146px] lg:text-[176px]",
    opacity: "opacity-[0.034]",
    blur: "blur-[3px]",
    drift: 11,
    duration: 36,
    delay: 2.5,
  },
  {
    label: "O(2ⁿ)",
    className: "-bottom-14 -right-14 text-[92px] sm:text-[134px] lg:text-[168px]",
    opacity: "opacity-[0.03]",
    blur: "blur-[4px]",
    drift: 13,
    duration: 40,
    delay: 4,
  },
] as const;

export function BigOBackground({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {notations.map((notation) => (
        <motion.span
          key={notation.label}
          className={cn(
            "absolute select-none whitespace-nowrap font-mono font-bold leading-none text-primary text-glow-primary",
            notation.className,
            notation.opacity,
            notation.blur,
          )}
          initial={false}
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [0, notation.drift, 0],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: notation.duration,
                  delay: notation.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        >
          {notation.label}
        </motion.span>
      ))}
    </div>
  );
}