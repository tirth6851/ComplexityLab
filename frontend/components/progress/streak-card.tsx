import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ProgressState } from "@/types";

export function StreakCard({ progress }: { progress: ProgressState | null }) {
  const current = progress?.currentStreak ?? 0;
  const longest = progress?.longestStreak ?? 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-1 flex items-center gap-2">
          <Flame className="h-5 w-5 text-warn" aria-hidden />
          <span className="font-mono text-3xl font-bold tabular-nums text-ink-primary">
            {current}
          </span>
          <span className="text-sm text-ink-muted">day streak</span>
        </div>
        <p className="font-mono text-xs text-ink-faint">
          Longest: {longest} day{longest !== 1 ? "s" : ""}
        </p>
      </CardContent>
    </Card>
  );
}
