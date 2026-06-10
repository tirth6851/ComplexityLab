"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav";
import { cn } from "@/lib/utils";

/**
 * Renders the primary nav items. Shared by the desktop sidebar and the mobile
 * drawer; `onNavigate` lets the drawer close itself after a selection.
 */
export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-4" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const root = item.match ?? item.href;
        const active =
          item.ready &&
          (pathname === root || pathname.startsWith(`${root}/`));
        const Icon = item.icon;
        const inner = (
          <>
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span>{item.label}</span>
            {!item.ready && (
              <span className="ml-auto rounded-ds-xs bg-surface-raised px-1.5 py-0.5 font-mono text-2xs font-medium uppercase tracking-label text-ink-faint">
                Soon
              </span>
            )}
          </>
        );

        return item.ready ? (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-ds-sm px-3 py-2 text-sm font-medium transition-colors duration-[120ms] ease-ds",
              active
                ? "bg-[var(--accent-muted)] text-primary"
                : "text-ink-secondary hover:bg-surface-raised hover:text-ink-primary",
            )}
          >
            {inner}
          </Link>
        ) : (
          <span
            key={item.label}
            aria-disabled="true"
            className="flex cursor-default items-center gap-3 rounded-ds-sm px-3 py-2 text-sm font-medium text-ink-muted/70"
          >
            {inner}
          </span>
        );
      })}
    </nav>
  );
}
