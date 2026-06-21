import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { progressToNextLevel } from "@/lib/progress/levels";
import type { ProgressState } from "@/types";

export function LevelCard({ progress }: { progress: ProgressState | null }) {
  if (!progress || progress.xp === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="cx-label mb-1">Level</p>
          <p className="text-sm text-ink-muted">
            Save analyses to earn XP and level up.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { level, into, span, fraction } = progressToNextLevel(progress.xp);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-3 flex items-baseline gap-2">
          <span
            className="font-mono text-4xl font-bold tabular-nums"
            style={{ color: "var(--accent)" }}
          >
            {level}
          </span>
          <span className="text-sm text-ink-muted">Level</span>
          <span className="ml-auto font-mono text-sm text-ink-muted">
            {progress.xp} XP
          </span>
        </div>
        <ProgressBar
          value={Math.round(fraction * 100)}
          showPercent={false}
          color="var(--accent)"
          aria-label={`Level ${level} progress`}
        />
        <p className="mt-1.5 font-mono text-xs text-ink-faint">
          {into} / {span} XP to Lvl {level + 1}
        </p>
      </CardContent>
    </Card>
  );
}
