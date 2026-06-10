import Link from "next/link";
import { Bookmark, History, ScanLine, Settings } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const actions = [
  {
    label: "New analysis",
    desc: "Analyze code complexity",
    icon: ScanLine,
    href: "/analyzer",
  },
  {
    label: "Your analyses",
    desc: "Review past breakdowns",
    icon: History,
    href: "/analyses",
  },
  {
    label: "Your snippets",
    desc: "Browse saved solutions",
    icon: Bookmark,
    href: "/snippets",
  },
  {
    label: "Settings",
    desc: "Profile and account",
    icon: Settings,
    href: "/settings/profile",
  },
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
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-start gap-2 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium">{action.label}</span>
              <span className="text-xs text-muted-foreground">
                {action.desc}
              </span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
