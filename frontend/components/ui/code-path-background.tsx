"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const NETWORKS = {
  main: "M650 116 H758 V198 H846 Q894 198 894 246 V350 H820 Q772 350 772 398 V492 H652",
  mainBranch: "M758 198 H672 Q628 198 628 250 V326 H718",
  mainLoop: "M846 198 H930 V106 H810",
  upperLeft: "M46 118 H150 V188 H236",
  upperLeftBranch: "M150 188 V256 H246",
  upperRight: "M720 72 H814 V132 H918 V206 H980",
  lowerLeft: "M-24 526 H108 V606 H246 V548 H364",
  lowerLoop: "M108 526 V456 H240 V526",
  lowerRight: "M668 612 H760 V552 H852 V612 H968",
} as const;

const tracerRoutes = {
  main: {
    x: [650, 708, 758, 758, 812, 870, 894, 894, 850, 820, 772, 772, 718, 652],
    y: [116, 116, 116, 198, 198, 206, 246, 350, 350, 350, 398, 492, 492, 492],
  },
  branch: {
    x: [650, 708, 758, 758, 704, 650, 628, 628, 678, 718],
    y: [116, 116, 116, 198, 198, 210, 250, 326, 326, 326],
  },
  lower: {
    x: [-24, 50, 108, 108, 170, 246, 246, 300, 364],
    y: [526, 526, 526, 606, 606, 606, 548, 548, 548],
  },
  upper: {
    x: [46, 104, 150, 150, 190, 236],
    y: [118, 118, 118, 188, 188, 188],
  },
} as const;

const mainNodes = [
  { cx: 650, cy: 116, strong: true, label: "O(1)", lx: 612, ly: 94 },
  { cx: 758, cy: 116 },
  { cx: 758, cy: 198, strong: true },
  { cx: 846, cy: 198 },
  { cx: 894, cy: 246, strong: true, label: "O(log n)", lx: 910, ly: 238 },
  { cx: 894, cy: 350 },
  { cx: 820, cy: 350 },
  { cx: 772, cy: 492, strong: true },
  { cx: 652, cy: 492 },
  { cx: 628, cy: 326 },
  { cx: 718, cy: 326 },
  { cx: 930, cy: 106 },
  { cx: 810, cy: 106 },
] as const;

const secondaryNodes = [
  { cx: 46, cy: 118 },
  { cx: 150, cy: 118, strong: true },
  { cx: 150, cy: 188 },
  { cx: 236, cy: 188, label: "O(1)", lx: 246, ly: 168 },
  { cx: 246, cy: 256 },
  { cx: 720, cy: 72 },
  { cx: 814, cy: 72, strong: true },
  { cx: 814, cy: 132 },
  { cx: 918, cy: 132 },
  { cx: 980, cy: 206 },
  { cx: -24, cy: 526 },
  { cx: 108, cy: 526, strong: true, label: "O(n)", lx: 128, ly: 510 },
  { cx: 108, cy: 606 },
  { cx: 246, cy: 606 },
  { cx: 246, cy: 548, strong: true },
  { cx: 364, cy: 548 },
  { cx: 240, cy: 456 },
  { cx: 668, cy: 612 },
  { cx: 760, cy: 552 },
  { cx: 852, cy: 612 },
  { cx: 968, cy: 612 },
] as const;

const mainPulseNodes = [
  { cx: 650, cy: 116, delay: 0.15, strong: true },
  { cx: 758, cy: 116, delay: 1.15 },
  { cx: 758, cy: 198, delay: 2.35, strong: true },
  { cx: 894, cy: 246, delay: 5.2, strong: true },
  { cx: 820, cy: 350, delay: 9.1 },
  { cx: 772, cy: 492, delay: 12.6, strong: true },
] as const;

const branchPulseNodes = [
  { cx: 758, cy: 198, delay: 1.8, strong: true },
  { cx: 628, cy: 326, delay: 5.3 },
  { cx: 718, cy: 326, delay: 8.7 },
] as const;

const lowerPulseNodes = [
  { cx: 108, cy: 526, delay: 2, strong: true },
  { cx: 246, cy: 606, delay: 7 },
  { cx: 246, cy: 548, delay: 10.6, strong: true },
] as const;

const codeTokens = [
  { label: "if", x: 616, y: 236, delay: 1.2, duration: 7.5 },
  { label: "loop", x: 812, y: 92, delay: 3.8, duration: 8.2 },
  { label: "return", x: 904, y: 386, delay: 5.4, duration: 9 },
  { label: "O(n)", x: 132, y: 488, delay: 2.6, duration: 8.6 },
  { label: "mid", x: 724, y: 330, delay: 6.7, duration: 7.8 },
  { label: "n++", x: 254, y: 578, delay: 0.8, duration: 8.8 },
] as const;

function hasLabel(node: unknown): node is { label: string; lx: number; ly: number } {
  if (!node || typeof node !== "object") return false;
  const candidate = node as { label?: unknown; lx?: unknown; ly?: unknown };
  return typeof candidate.label === "string" && typeof candidate.lx === "number" && typeof candidate.ly === "number";
}

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
        r={strong ? 5.6 : 4.1}
        className="fill-primary"
        opacity={strong ? 0.12 : 0.07}
      />
      <circle
        cx={cx}
        cy={cy}
        r={strong ? 2.35 : 1.85}
        className="fill-cyan-200"
        opacity={strong ? 0.18 : 0.11}
      />
    </g>
  );
}

function ComplexityLabel({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: string;
}) {
  return (
    <text
      x={x}
      y={y}
      fill="#0f766e"
      className="font-mono text-[12px] font-semibold tracking-[0.18em] blur-[2px]"
      opacity="0.035"
    >
      {children}
    </text>
  );
}

function CodeToken({
  label,
  x,
  y,
  delay,
  duration,
}: {
  label: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
}) {
  return (
    <motion.text
      x={x}
      y={y}
      fill="#0f766e"
      className="font-mono text-[11px] font-semibold tracking-[0.16em] blur-[2px]"
      initial={false}
      animate={{ opacity: [0, 0.045, 0.025, 0], y: [y, y - 3, y - 5, y - 5] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.22, 0.7, 1],
      }}
    >
      {label}
    </motion.text>
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
      r={strong ? 8.2 : 6.4}
      className="fill-cyan-200"
      initial={false}
      animate={{ opacity: [0, 0.145, 0], scale: [0.7, 1.22, 1.42] }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeOut",
        delay,
        times: [0, 0.075, 0.18],
      }}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
    />
  );
}

function BasePath({
  d,
  opacity = 1,
  width = 1,
}: {
  d: string;
  opacity?: number;
  width?: number;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke="url(#code-path-line)"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    />
  );
}

function HighlightPath({
  d,
  delay = 0,
  duration = 16,
  opacity = 0.14,
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
      animate={{ pathLength: [0, 0.42, 0.72, 1, 1], opacity: [0, opacity, opacity * 0.78, opacity * 0.34, 0] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
        times: [0, 0.36, 0.62, 0.86, 1],
      }}
    />
  );
}

function Tracer({
  x,
  y,
  delay = 0,
  duration,
  color = "fill-cyan-200",
  radius = 2.7,
  opacity = 0.18,
}: {
  x: readonly number[];
  y: readonly number[];
  delay?: number;
  duration: number;
  color?: string;
  radius?: number;
  opacity?: number;
}) {
  return (
    <g>
      <motion.circle
        r={radius + 2.4}
        className={color}
        initial={false}
        animate={{ cx: [...x], cy: [...y], opacity: [0, opacity * 0.18, opacity * 0.18, 0] }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: "linear",
          times: [0, 0.08, 0.88, 1],
        }}
      />
      <motion.circle
        r={radius}
        className={color}
        initial={false}
        animate={{ cx: [...x], cy: [...y], opacity: [0, opacity, opacity, 0] }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: "linear",
          times: [0, 0.08, 0.88, 1],
        }}
      />
    </g>
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
            <stop offset="55%" stopColor="#2dd4bf" stopOpacity="0.048" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        <g filter="url(#code-path-soft-glow)" className="blur-[0.45px]">
          <g opacity="0.64">
            <BasePath d={NETWORKS.main} width={1.25} />
            <BasePath d={NETWORKS.mainBranch} width={1.05} opacity={0.64} />
            <BasePath d={NETWORKS.mainLoop} width={0.95} opacity={0.5} />
            {mainNodes.map((node) => (
              <g key={`${node.cx}-${node.cy}`}>
                <Node {...node} />
                {hasLabel(node) && (
                  <ComplexityLabel x={node.lx} y={node.ly}>{node.label}</ComplexityLabel>
                )}
              </g>
            ))}
          </g>

          <g opacity="0.34">
            <BasePath d={NETWORKS.upperLeft} width={0.95} />
            <BasePath d={NETWORKS.upperLeftBranch} width={0.9} opacity={0.72} />
            <BasePath d={NETWORKS.upperRight} width={0.95} opacity={0.68} />
            <BasePath d={NETWORKS.lowerLeft} width={1} />
            <BasePath d={NETWORKS.lowerLoop} width={0.9} opacity={0.68} />
            <BasePath d={NETWORKS.lowerRight} width={0.9} opacity={0.55} />
            {secondaryNodes.map((node) => (
              <g key={`${node.cx}-${node.cy}`}>
                <Node {...node} />
                {hasLabel(node) && (
                  <ComplexityLabel x={node.lx} y={node.ly}>{node.label}</ComplexityLabel>
                )}
              </g>
            ))}
          </g>
        </g>

        {!reduceMotion && (
          <g filter="url(#code-path-soft-glow)">
            <HighlightPath d={NETWORKS.main} duration={16} opacity={0.18} />
            <HighlightPath d={NETWORKS.mainBranch} delay={7.8} duration={14} opacity={0.14} />
            <HighlightPath d={NETWORKS.lowerLeft} delay={2.4} duration={18} opacity={0.105} />
            <HighlightPath d={NETWORKS.upperLeft} delay={5.5} duration={13} opacity={0.095} />

            {codeTokens.map((token) => (
              <CodeToken key={`${token.label}-${token.x}-${token.y}`} {...token} />
            ))}

            {mainPulseNodes.map((node) => (
              <PulseNode key={`main-${node.cx}-${node.cy}`} {...node} duration={16} />
            ))}
            {branchPulseNodes.map((node) => (
              <PulseNode
                key={`branch-${node.cx}-${node.cy}`}
                {...node}
                delay={7.8 + node.delay}
                duration={14}
              />
            ))}
            {lowerPulseNodes.map((node) => (
              <PulseNode key={`lower-${node.cx}-${node.cy}`} {...node} duration={18} />
            ))}

            <Tracer
              x={tracerRoutes.main.x}
              y={tracerRoutes.main.y}
              duration={16}
              radius={3}
              opacity={0.2}
            />
            <Tracer
              x={tracerRoutes.branch.x}
              y={tracerRoutes.branch.y}
              delay={8.5}
              duration={14}
              color="fill-primary"
              radius={2.6}
              opacity={0.15}
            />
            <Tracer
              x={tracerRoutes.lower.x}
              y={tracerRoutes.lower.y}
              delay={3}
              duration={18}
              color="fill-teal-200"
              radius={2.25}
              opacity={0.1}
            />
            <Tracer
              x={tracerRoutes.upper.x}
              y={tracerRoutes.upper.y}
              delay={6}
              duration={14}
              color="fill-cyan-100"
              radius={2}
              opacity={0.08}
            />
          </g>
        )}
      </svg>
    </div>
  );
}