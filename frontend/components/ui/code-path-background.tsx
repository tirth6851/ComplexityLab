"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const mainParticleX = [690, 780, 780, 860, 900, 900, 820, 780, 690];
const mainParticleY = [122, 122, 220, 220, 290, 418, 418, 520, 520];
const secondaryParticleX = [84, 172, 260, 260, 352, 430];
const secondaryParticleY = [530, 530, 530, 602, 602, 602];

function Node({ cx, cy, strong = false }: { cx: number; cy: number; strong?: boolean }) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={strong ? 7 : 5}
        className="fill-primary"
        opacity={strong ? 0.18 : 0.11}
      />
      <circle
        cx={cx}
        cy={cy}
        r={strong ? 3 : 2.5}
        className="fill-cyan-200"
        opacity={strong ? 0.26 : 0.16}
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
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="code-path-line" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.08" />
            <stop offset="55%" stopColor="#2dd4bf" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.055" />
          </linearGradient>
        </defs>

        <g filter="url(#code-path-soft-glow)" className="blur-[0.5px]">
          <g opacity="0.82">
            <path
              d="M690 122 H780 V220 H860 Q900 220 900 260 V418 H820 Q780 418 780 458 V520 H690"
              fill="none"
              stroke="url(#code-path-line)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M780 220 H700 Q650 220 650 270 V345 H730"
              fill="none"
              stroke="url(#code-path-line)"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.72"
            />
            <path
              d="M900 290 H948 V150"
              fill="none"
              stroke="url(#code-path-line)"
              strokeWidth="1.15"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.58"
            />

            <Node cx={690} cy={122} strong />
            <Node cx={780} cy={122} />
            <Node cx={780} cy={220} strong />
            <Node cx={860} cy={220} />
            <Node cx={900} cy={290} strong />
            <Node cx={900} cy={418} />
            <Node cx={820} cy={418} />
            <Node cx={780} cy={520} strong />
            <Node cx={690} cy={520} />
            <Node cx={650} cy={345} />
            <Node cx={730} cy={345} />
            <Node cx={948} cy={150} />
          </g>

          <g opacity="0.36">
            <path
              d="M84 530 H260 V602 H430"
              fill="none"
              stroke="url(#code-path-line)"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M172 530 V470 H308"
              fill="none"
              stroke="url(#code-path-line)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Node cx={84} cy={530} />
            <Node cx={172} cy={530} />
            <Node cx={260} cy={530} />
            <Node cx={260} cy={602} />
            <Node cx={352} cy={602} />
            <Node cx={430} cy={602} />
            <Node cx={308} cy={470} />
          </g>
        </g>

        {!reduceMotion && (
          <>
            <motion.circle
              r="3.4"
              className="fill-cyan-200"
              initial={false}
              animate={{ cx: mainParticleX, cy: mainParticleY, opacity: [0, 0.22, 0.22, 0] }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear", times: [0, 0.08, 0.88, 1] }}
              filter="url(#code-path-soft-glow)"
            />
            <motion.circle
              r="2.5"
              className="fill-primary"
              initial={false}
              animate={{ cx: secondaryParticleX, cy: secondaryParticleY, opacity: [0, 0.12, 0.12, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 5, times: [0, 0.1, 0.85, 1] }}
              filter="url(#code-path-soft-glow)"
            />
          </>
        )}
      </svg>
    </div>
  );
}