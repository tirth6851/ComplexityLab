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
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="group flex min-h-32 flex-col items-start gap-3 rounded-ds-lg border border-line-subtle bg-surface-panel/60 p-4 text-left shadow-inset-well transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-raised hover:shadow-ds-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-ds-md border border-line-accent bg-card text-primary transition-all group-hover:shadow-glow-green-soft">
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-display text-base font-semibold">{action.label}</span>
              <span className="text-sm leading-5 text-ink-secondary">
                {action.desc}
              </span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
