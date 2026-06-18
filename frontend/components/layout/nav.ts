import {
  Code2,
  LayoutDashboard,
  ScanLine,
  Settings,
  History,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  ready: boolean;
  /**
   * Path prefix used for the active state when the item owns a subtree whose
   * root differs from `href` (e.g. Settings links to /settings/profile but is
   * active for all /settings/*).
   */
  match?: string;
}

/** Shared primary navigation, consumed by both the sidebar and mobile drawer. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, ready: true },
  { label: "Analyzer", href: "/analyzer", icon: ScanLine, ready: true },
  { label: "Analyses", href: "/analyses", icon: History, ready: true },
  { label: "Snippets", href: "/snippets", icon: Code2, ready: true },
  {
    label: "Settings",
    href: "/settings/profile",
    icon: Settings,
    ready: true,
    match: "/settings",
  },
];
