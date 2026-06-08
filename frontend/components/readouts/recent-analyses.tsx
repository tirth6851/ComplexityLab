import { Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { recentAnalyses } from "@/lib/mock-data";
import type { Complexity } from "@/types";

/** Color-codes a complexity class: cheap = primary, costly = destructive. */
function tone(c: Complexity): "default" | "secondary" | "destructive" {
  if (c === "O(1)" || c === "O(log n)") return "default";
  if (c === "O(n²)" || c === "O(2ⁿ)") return "destructive";
  return "secondary";
}

export function RecentAnalyses() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent analyses</CardTitle>
        <CardDescription>Your latest complexity breakdowns</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {recentAnalyses.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted"
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-sm font-medium">{a.title}</p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{a.language}</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {a.createdAt}
                </span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Badge variant={tone(a.timeComplexity)} className="font-mono">
                {a.timeComplexity}
              </Badge>
              <Badge variant="outline" className="font-mono">
                {a.spaceComplexity}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
