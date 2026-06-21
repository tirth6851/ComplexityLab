import {
  Code2,
  LayoutDashboard,
  MessageSquare,
  ScanLine,
  Settings,
  History,
  Terminal,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  ready: boolean;
  /** Path prefix used for the active state when an item owns a subtree. */
  match?: string;
}

/** Workspace navigation, consumed by the sidebar and mobile drawer. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, ready: true },
  { label: "Analyzer", href: "/analyzer", icon: ScanLine, ready: true },
  { label: "Analyses", href: "/analyses", icon: History, ready: true },
  { label: "Snippets",    href: "/snippets",   icon: Code2,     ready: true  },
  { label: "Chat",       href: "/chat",        icon: MessageSquare, ready: true  },
  { label: "Playground", href: "/playground", icon: Terminal,   ready: true },
  { label: "Progress",   href: "/progress",   icon: TrendingUp, ready: true },
  {
    label: "Settings",
    href: "/settings/profile",
    icon: Settings,
    ready: true,
    match: "/settings",
  },
];
