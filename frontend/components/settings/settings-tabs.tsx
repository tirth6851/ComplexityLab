"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Profile", href: "/settings/profile" },
  { label: "Account", href: "/settings/account" },
];

/** Segmented tab nav for the settings section. */
export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings sections"
      className="inline-flex gap-1 rounded-ds-md border border-line-subtle bg-surface-panel p-1"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-ds-sm px-3 py-1.5 text-sm font-medium transition-colors duration-[120ms] ease-ds",
              active
                ? "bg-surface-raised text-ink-primary"
                : "text-ink-muted hover:text-ink-secondary",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
