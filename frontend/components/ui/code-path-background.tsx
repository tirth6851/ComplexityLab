"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const MAIN_PATH =
  "M690 122 H780 V220 H860 Q900 220 900 260 V418 H820 Q780 418 780 458 V520 H690";
const BRANCH_PATH = "M690 122 H780 V220 H700 Q650 220 650 270 V345 H730";
const RETURN_PATH = "M900 290 H948 V150";
const SECONDARY_PATH = "M84 530 H260 V602 H430";
const SECONDARY_BRANCH_PATH = "M172 530 V470 H308";

const mainParticleX = [690, 745, 780, 780, 828, 878, 900, 900, 870, 820, 780, 780, 730, 690];
const mainParticleY = [122, 122, 122, 220, 220, 226, 290, 418, 418, 418, 458, 520, 520, 520];
const branchParticleX = [690, 745, 780, 780, 736, 682, 650, 650, 690, 730];
const branchParticleY = [122, 122, 122, 220, 220, 228, 270, 345, 345, 345];
const secondaryParticleX = [84, 172, 260, 260, 352, 430];
const secondaryParticleY = [530, 530, 530, 602, 602, 602];

const mainPulseNodes = [
  { cx: 690, cy: 122, delay: 0.15, strong: true },
  { cx: 780, cy: 122, delay: 1.15 },
  { cx: 780, cy: 220, delay: 2.45, strong: true },
  { cx: 900, cy: 290, delay: 5.2, strong: true },
  { cx: 820, cy: 418, delay: 9.1 },
  { cx: 780, cy: 520, delay: 12.5, strong: true },
  { cx: 690, cy: 520, delay: 14.2 },
] as const;

const branchPulseNodes = [
  { cx: 780, cy: 220, delay: 1.7, strong: true },
  { cx: 650, cy: 345, delay: 5.4 },
  { cx: 730, cy: 345, delay: 8.6 },
] as const;

const staticNodes = [
  { cx: 690, cy: 122, strong: true },
  { cx: 780, cy: 122 },
  { cx: 780, cy: 220, strong: true },
  { cx: 860, cy: 220 },
  { cx: 900, cy: 290, strong: true },
  { cx: 900, cy: 418 },
  { cx: 820, cy: 418 },
  { cx: 780, cy: 520, strong: true },
  { cx: 690, cy: 520 },
  { cx: 650, cy: 345 },
  { cx: 730, cy: 345 },
  { cx: 948, cy: 150 },
] as const;

const secondaryNodes = [
  { cx: 84, cy: 530 },
  { cx: 172, cy: 530 },
  { cx: 260, cy: 530 },
  { cx: 260, cy: 602 },
  { cx: 352, cy: 602 },
  { cx: 430, cy: 602 },
  { cx: 308, cy: 470 },
] as const;

function Node({
  cx,
  cy,
  strong = false,
}: {
  cx: number;
  cy: number;
  strong?: boolean;
}) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={strong ? 5.8 : 4.4}
        className="fill-primary"
        opacity={strong ? 0.13 : 0.08}
      />
      <circle
        cx={cx}
        cy={cy}
        r={strong ? 2.5 : 2}
        className="fill-cyan-200"
        opacity={strong ? 0.2 : 0.12}
      />
    </g>
  );
}

function PulseNode({
  cx,
  cy,
  delay,
  strong = false,
  duration = 16,
}: {
  cx: number;
  cy: number;
  delay: number;
  strong?: boolean;
  duration?: number;
}) {
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={strong ? 8 : 6.5}
      className="fill-cyan-200"
      initial={false}
      animate={{ opacity: [0, 0.13, 0], scale: [0.72, 1.22, 1.4] }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeOut",
        delay,
        times: [0, 0.08, 0.16],
      }}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
    />
  );
}

function HighlightPath({
  d,
  delay = 0,
  duration = 16,
  opacity = 0.16,
}: {
  d: string;
  delay?: number;
  duration?: number;
  opacity?: number;
}) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="#67e8f9"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={false}
      animate={{ pathLength: [0, 0.58, 1, 1], opacity: [0, opacity, opacity * 0.7, 0] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
        times: [0, 0.5, 0.84, 1],
      }}
    />
  );
}

export function CodePathBackground({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <svg
        viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full text-primary"
      >
        <defs>
          <filter id="code-path-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="code-path-line" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.055" />
            <stop offset="55%" stopColor="#2dd4bf" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        <g filter="url(#code-path-soft-glow)" className="blur-[0.5px]">
          <g opacity="0.7">
            <path
              d={MAIN_PATH}
              fill="none"
              stroke="url(#code-path-line)"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={BRANCH_PATH}
              fill="none"
              stroke="url(#code-path-line)"
              strokeWidth="1.12"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.62"
            />
            <path
              d={RETURN_PATH}
              fill="none"
              stroke="url(#code-path-line)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.46"
            />

            {staticNodes.map((node) => (
              <Node key={`${node.cx}-${node.cy}`} {...node} />
            ))}
          </g>

          <g opacity="0.26">
            <path
              d={SECONDARY_PATH}
              fill="none"
              stroke="url(#code-path-line)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={SECONDARY_BRANCH_PATH}
              fill="none"
              stroke="url(#code-path-line)"
              strokeWidth="0.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {secondaryNodes.map((node) => (
              <Node key={`${node.cx}-${node.cy}`} {...node} />
            ))}
          </g>
        </g>

        {!reduceMotion && (
          <g filter="url(#code-path-soft-glow)">
            <HighlightPath d={MAIN_PATH} duration={16} opacity={0.14} />
            <HighlightPath d={BRANCH_PATH} delay={8} duration={16} opacity={0.115} />
            <HighlightPath d={SECONDARY_PATH} delay={5} duration={20} opacity={0.07} />

            {mainPulseNodes.map((node) => (
              <PulseNode key={`main-${node.cx}-${node.cy}`} {...node} />
            ))}
            {branchPulseNodes.map((node) => (
              <PulseNode
                key={`branch-${node.cx}-${node.cy}`}
                {...node}
                delay={8 + node.delay}
              />
            ))}

            <motion.circle
              r="3"
              className="fill-cyan-200"
              initial={false}
              animate={{
                cx: mainParticleX,
                cy: mainParticleY,
                opacity: [0, 0.2, 0.2, 0],
              }}
              transition={{
                duration: 16,
                repeat: Infinity,
                ease: "linear",
                times: [0, 0.08, 0.88, 1],
              }}
            />
            <motion.circle
              r="2.7"
              className="fill-primary"
              initial={false}
              animate={{
                cx: branchParticleX,
                cy: branchParticleY,
                opacity: [0, 0.16, 0.16, 0],
              }}
              transition={{
                duration: 16,
                repeat: Infinity,
                ease: "linear",
                delay: 8,
                times: [0, 0.08, 0.78, 1],
              }}
            />
            <motion.circle
              r="2.2"
              className="fill-teal-200"
              initial={false}
              animate={{
                cx: secondaryParticleX,
                cy: secondaryParticleY,
                opacity: [0, 0.09, 0.09, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
                delay: 5,
                times: [0, 0.1, 0.85, 1],
              }}
            />
          </g>
        )}
      </svg>
    </div>
  );
}