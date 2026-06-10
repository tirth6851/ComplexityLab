"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav";

/** Titles for routes that need more specificity than their nav item label. */
const EXACT_TITLES: Record<string, string> = {
  "/settings/profile": "Profile settings",
  "/settings/account": "Account settings",
};

/**
 * Topbar page title, derived from the current pathname so the shared shell
 * shows the right heading on every app route.
 */
export function PageTitle() {
  const pathname = usePathname();

  const title =
    EXACT_TITLES[pathname] ??
    NAV_ITEMS.find((item) => {
      if (!item.ready) return false;
      const root = item.match ?? item.href;
      return pathname === root || pathname.startsWith(`${root}/`);
    })?.label ??
    "ComplexityLab";

  return <span className="font-medium text-ink-primary">{title}</span>;
}
