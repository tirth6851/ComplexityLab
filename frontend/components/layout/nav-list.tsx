"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav";
import { cn } from "@/lib/utils";

/**
 * Renders workspace nav items. Shared by the desktop sidebar and mobile drawer;
 * `onNavigate` lets the drawer close itself after a selection.
 */
export function NavList({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex-1 space-y-1.5 px-3 py-3.5 transition-[padding] duration-200 ease-ds",
        collapsed && "space-y-1 px-2.5",
      )}
      aria-label="Workspace"
    >
      {NAV_ITEMS.map((item) => {
        const root = item.match ?? item.href;
        const active =
          item.ready &&
          (pathname === root || pathname.startsWith(`${root}/`));
        const Icon = item.icon;
        const inner = (
          <>
            <Icon
              className={cn(
                "shrink-0 stroke-[2.1] transition-all duration-200",
                collapsed ? "h-5 w-5" : "h-5 w-5",
              )}
              aria-hidden
            />
            <span
              className={cn(
                "truncate transition-all duration-200",
                collapsed && "sr-only",
              )}
            >
              {item.label}
            </span>
            {!item.ready && !collapsed && (
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
            title={collapsed ? item.label : undefined}
            className={cn(
              "group relative flex items-center rounded-ds-lg border text-[15px] font-semibold leading-none transition-all duration-150 ease-ds focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              collapsed ? "h-[42px] justify-center px-0" : "h-[46px] gap-3.5 px-3.5",
              active
                ? "border-primary/30 bg-[var(--accent-muted)] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_28px_-24px_rgba(0,229,153,0.85)]"
                : "border-transparent text-ink-secondary hover:border-line-subtle hover:bg-surface-raised/70 hover:text-ink-primary",
            )}
          >
            {inner}
            {collapsed && (
              <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-ds-md border border-line-subtle bg-card/95 px-2.5 py-1.5 text-xs font-medium text-ink-primary opacity-0 shadow-ds-lg backdrop-blur transition group-hover:block group-hover:opacity-100 group-focus-visible:block group-focus-visible:opacity-100">
                {item.label}
              </span>
            )}
          </Link>
        ) : (
          <span
            key={item.label}
            aria-disabled="true"
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex cursor-default items-center rounded-ds-lg border border-transparent text-[15px] font-semibold text-ink-muted/70",
              collapsed ? "h-[42px] justify-center px-0" : "h-[46px] gap-3.5 px-3.5",
            )}
          >
            {inner}
          </span>
        );
      })}
    </nav>
  );
}