"use client";

import { usePathname } from "next/navigation";
import { CleanMotionBackground } from "@/components/ui/clean-motion-background";
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
      <CleanMotionBackground
        items={TABS.map((tab) => ({
          key: tab.href,
          label: tab.label,
          href: tab.href,
        }))}
        value={pathname === "/settings/account" ? "/settings/account" : "/settings/profile"}
        mode="select"
        ariaLabel="Settings sections"
        layoutId="settings-tab-highlight"
        className="contents"
        itemClassName={(_, state) =>
          cn(
            "rounded-ds-sm px-3 py-1.5 text-sm font-medium",
            state.active ? "text-ink-primary" : "text-ink-muted hover:text-ink-secondary",
          )
        }
        indicatorClassName="bg-gradient-to-r from-emerald-400/12 via-teal-300/12 to-cyan-300/12"
        getItemProps={(_, state) => ({ "aria-current": state.active ? "page" : undefined })}
      />
    </nav>
  );
}
