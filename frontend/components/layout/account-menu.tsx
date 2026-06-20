"use client";

import Link from "next/link";
import { SignOutButton, useUser } from "@clerk/nextjs";
import {
  ChevronDown,
  LogOut,
  Palette,
  Settings,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const menuItems = [
  { label: "Profile", href: "/settings/profile", icon: UserRound },
  { label: "Settings", href: "/settings/account", icon: Settings },
] as const;

function initials(name?: string | null, email?: string | null) {
  const source = name || email || "CL";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CL";
}

export function AccountMenu() {
  const { user, isLoaded } = useUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const name = user?.fullName ?? user?.firstName ?? "ComplexityLab user";
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "Workspace account";
  const imageUrl = user?.imageUrl;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
        className={cn(
          "flex h-10 items-center gap-2 rounded-pill border border-line-subtle bg-surface-panel/80 py-1 pl-1 pr-2 text-left shadow-ds-sm transition-all hover:border-primary/35 hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          open && "border-primary/35 bg-surface-raised",
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-accent bg-card text-xs font-semibold text-primary shadow-inset-well">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Clerk supplies a small avatar URL; avoiding next/image config churn.
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(name, email)
          )}
        </span>
        <span className="hidden min-w-0 md:block">
          <span className="block max-w-32 truncate text-sm font-semibold text-ink-primary">
            {isLoaded ? name : "Account"}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-ink-muted transition-transform duration-150",
            open && "rotate-180 text-primary",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-ds-xl border border-line-subtle bg-card/95 shadow-ds-xl backdrop-blur-xl"
        >
          <div className="border-b border-line-subtle bg-surface-panel/45 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-accent bg-card text-sm font-semibold text-primary shadow-inset-well">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Clerk supplies a small avatar URL; avoiding next/image config churn.
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(name, email)
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-primary">
                  {name}
                </p>
                <p className="truncate text-xs text-ink-muted">{email}</p>
              </div>
            </div>
          </div>

          <div className="p-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex h-10 items-center gap-3 rounded-ds-md px-3 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-raised hover:text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="h-[18px] w-[18px] text-primary" aria-hidden />
                  {item.label}
                </Link>
              );
            })}

            <div className="mt-1 flex h-10 items-center justify-between gap-3 rounded-ds-md px-3 text-sm font-medium text-ink-secondary">
              <span className="flex items-center gap-3">
                <Palette className="h-[18px] w-[18px] text-primary" aria-hidden />
                Appearance
              </span>
              <ThemeToggle className="h-8 w-8 rounded-ds-md" />
            </div>
          </div>

          <div className="border-t border-line-subtle p-2">
            <SignOutButton redirectUrl="/">
              <button
                type="button"
                role="menuitem"
                className="flex h-10 w-full items-center gap-3 rounded-ds-md px-3 text-left text-sm font-medium text-ink-secondary transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <LogOut className="h-[18px] w-[18px]" aria-hidden />
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      )}
    </div>
  );
}