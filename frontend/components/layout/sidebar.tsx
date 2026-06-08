"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, LayoutDashboard, ScanLine, TrendingUp } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, ready: true },
  { label: "Analyses", href: "#", icon: ScanLine, ready: false },
  { label: "Snippets", href: "#", icon: Code2, ready: false },
  { label: "Progress", href: "#", icon: TrendingUp, ready: false },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-14 items-center border-b border-border px-6">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {nav.map((item) => {
          const active = item.ready && pathname === item.href;
          const Icon = item.icon;
          const inner = (
            <>
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {!item.ready && (
                <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Soon
                </span>
              )}
            </>
          );

          return item.ready ? (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {inner}
            </Link>
          ) : (
            <span
              key={item.label}
              aria-disabled
              className="flex cursor-default items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/50"
            >
              {inner}
            </span>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          Free plan · mock data
        </div>
      </div>
    </aside>
  );
}
