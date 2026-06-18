import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyXp } from "@/types";

const W = 560;
const H = 80;
const PAD = { left: 8, right: 8, top: 8, bottom: 20 };

export function ActivityChart({ history }: { history: DailyXp[] }) {
  if (!history.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>XP Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-muted">
            Save analyses to earn XP and see your activity here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxXp = Math.max(...history.map((d) => d.xp), 1);
  const totalXp = history.reduce((s, d) => s + d.xp, 0);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / Math.max(history.length, 30);
  const barW = Math.max(3, slot - 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>XP Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`30-day XP activity chart. ${totalXp} XP earned across ${history.length} active day${history.length !== 1 ? "s" : ""}.`}
          className="w-full"
        >
          {history.map((day, i) => {
            const barH = Math.max(2, (day.xp / maxXp) * innerH);
            const x = PAD.left + i * slot + (slot - barW) / 2;
            const y = PAD.top + innerH - barH;
            return (
              <rect
                key={day.date}
                x={x.toFixed(1)}
                y={y.toFixed(1)}
                width={barW.toFixed(1)}
                height={barH.toFixed(1)}
                fill="var(--accent)"
                opacity={0.85}
                rx={1}
              >
                <title>{`${day.date}: ${day.xp} XP`}</title>
              </rect>
            );
          })}
          <text
            x={PAD.left}
            y={H - 4}
            fontSize={8}
            fontFamily="var(--font-mono)"
            fill="var(--text-muted)"
          >
            30-day XP
          </text>
          <text
            x={W - PAD.right}
            y={H - 4}
            textAnchor="end"
            fontSize={8}
            fontFamily="var(--font-mono)"
            fill="var(--text-muted)"
          >
            {totalXp} total
          </text>
        </svg>
      </CardContent>
    </Card>
  );
}
