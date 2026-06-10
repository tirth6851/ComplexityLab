import { cn } from "@/lib/utils";
import { Tag } from "@/components/ui/tag";
import { TIER_COLOR, tierFromNotation } from "@/lib/complexity";
import { growthValue } from "@/lib/analysis/growth";

/**
 * ComplexityTimeline — growth curves f(n) for the reference Big-O classes on
 * a log₁₀ cost axis, with the detected class highlighted. Pure SVG, colored
 * entirely by complexity tokens; no chart library.
 */

const BASE_CURVES: { notation: string; color: string }[] = [
  { notation: "O(1)", color: "var(--c-o1)" },
  { notation: "O(log n)", color: "var(--c-log)" },
  { notation: "O(n)", color: "var(--c-n)" },
  { notation: "O(n log n)", color: "var(--c-nlogn)" },
  { notation: "O(n²)", color: "var(--c-n2)" },
  { notation: "O(2ⁿ)", color: "var(--c-exp)" },
];

const W = 560;
const H = 230;
const PAD = { left: 44, right: 14, top: 14, bottom: 30 };
const N_MAX = 100;
/** Cost axis spans 10⁰ … 10⁶ operations; curves clip off the top. */
const DECADES = 6;

function normalizeKey(notation: string): string {
  return notation.toLowerCase().replace(/\s+/g, "");
}

/** Build an SVG path for a curve, stopping once it exits the top of the plot. */
function curvePath(notation: string): string {
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const points: string[] = [];

  for (let n = 1; n <= N_MAX; n++) {
    const decades = Math.log10(Math.max(1, growthValue(notation, n)));
    const x = PAD.left + ((n - 1) / (N_MAX - 1)) * innerW;
    const clipped = Math.min(decades, DECADES);
    const y = PAD.top + innerH - (clipped / DECADES) * innerH;
    points.push(`${points.length === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
    if (decades > DECADES) break;
  }
  return points.join(" ");
}

export interface ComplexityTimelineProps {
  /** Big-O class to highlight (the analysis result). */
  highlight: string;
  className?: string;
}

export function ComplexityTimeline({
  highlight,
  className,
}: ComplexityTimelineProps) {
  const highlightKey = normalizeKey(highlight);
  const curves = BASE_CURVES.some((c) => normalizeKey(c.notation) === highlightKey)
    ? BASE_CURVES
    : [
        ...BASE_CURVES,
        { notation: highlight, color: TIER_COLOR[tierFromNotation(highlight)].fg },
      ];

  const innerH = H - PAD.top - PAD.bottom;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-ds-md border border-line-subtle bg-surface-panel bg-grid-dots p-4",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="cx-label">Growth timeline</span>
        <span className="font-mono text-2xs text-ink-faint">
          cost vs. input size n
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Growth curves of common complexity classes with ${highlight} highlighted`}
        className="w-full"
      >
        {/* decade gridlines + labels */}
        {Array.from({ length: DECADES + 1 }, (_, d) => {
          const y = PAD.top + innerH - (d / DECADES) * innerH;
          return (
            <g key={d}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y}
                y2={y}
                stroke="var(--border-subtle)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6}
                y={y + 3}
                textAnchor="end"
                fontSize={9}
                fontFamily="var(--font-mono)"
                fill="var(--text-muted)"
              >
                {d === 0 ? "1" : `10^${d}`}
              </text>
            </g>
          );
        })}
        <text
          x={W - PAD.right}
          y={H - 8}
          textAnchor="end"
          fontSize={9}
          fontFamily="var(--font-mono)"
          fill="var(--text-muted)"
        >
          input size n →
        </text>

        {/* reference curves (dimmed) then the highlighted curve on top */}
        {curves
          .filter((c) => normalizeKey(c.notation) !== highlightKey)
          .map((c) => (
            <path
              key={c.notation}
              d={curvePath(c.notation)}
              fill="none"
              stroke={c.color}
              strokeWidth={1.5}
              opacity={0.28}
            />
          ))}
        {curves
          .filter((c) => normalizeKey(c.notation) === highlightKey)
          .map((c) => (
            <path
              key={c.notation}
              d={curvePath(c.notation)}
              fill="none"
              stroke={c.color}
              strokeWidth={2.5}
              style={{ filter: `drop-shadow(0 0 6px ${c.color})` }}
            />
          ))}
      </svg>

      <div className="flex flex-wrap gap-1.5">
        {curves.map((c) => (
          <Tag
            key={c.notation}
            dotColor={c.color}
            selected={normalizeKey(c.notation) === highlightKey}
            className="h-[22px] px-2 text-2xs"
          >
            {c.notation}
          </Tag>
        ))}
      </div>
    </div>
  );
}
