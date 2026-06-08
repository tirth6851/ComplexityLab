import { Bookmark, Library, ScanLine, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const actions = [
  { label: "New analysis", desc: "Analyze code complexity", icon: ScanLine },
  { label: "Save snippet", desc: "Store a reusable solution", icon: Bookmark },
  { label: "Review progress", desc: "See your skill growth", icon: TrendingUp },
  { label: "Browse library", desc: "Explore algorithms", icon: Library },
] as const;

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
        <CardDescription>Jump straight into a task</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              className="flex flex-col items-start gap-2 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium">{action.label}</span>
              <span className="text-xs text-muted-foreground">
                {action.desc}
              </span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
