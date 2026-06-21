import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACHIEVEMENTS } from "@/lib/progress/achievements";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AchievementGrid({ unlockedKeys }: { unlockedKeys: string[] }) {
  const unlocked = new Set(unlockedKeys);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const isUnlocked = unlocked.has(a.key);
            return (
              <div
                key={a.key}
                title={isUnlocked ? `${a.name} (+${a.xp} XP)` : a.hint}
                className={cn(
                  "flex flex-col gap-1 rounded-ds-md border p-2.5 text-xs transition-colors",
                  isUnlocked
                    ? "border-line-accent bg-surface-panel/60 text-ink-primary"
                    : "border-line-subtle bg-surface-panel/30 text-ink-faint opacity-60",
                )}
              >
                <Trophy
                  className={cn(
                    "h-4 w-4",
                    isUnlocked ? "text-[var(--accent)]" : "text-ink-faint",
                  )}
                  aria-hidden
                />
                <span className={cn("font-medium leading-tight", !isUnlocked && "font-normal")}>
                  {isUnlocked ? a.name : "???"}
                </span>
                <span className="text-[10px] leading-tight">{a.hint}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
