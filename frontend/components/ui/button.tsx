import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "default" | "sm" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ds-md border border-transparent font-medium transition-all duration-150 ease-ds active:translate-y-px active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45";

const variants: Record<Variant, string> = {
  // Signal Green primary — luminous, with a brightness lift + glow on hover.
  default:
    "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_14px_34px_-18px_rgba(0,229,153,0.95)] hover:brightness-110 hover:shadow-glow-green",
  secondary:
    "border-line-subtle bg-secondary/80 text-secondary-foreground shadow-ds-sm hover:border-line-strong hover:bg-surface-raised",
  outline:
    "border-line-subtle bg-card/45 text-ink-primary shadow-ds-sm hover:border-primary/35 hover:bg-surface-raised hover:text-foreground",
  ghost: "text-ink-secondary hover:bg-surface-raised/80 hover:text-ink-primary",
  destructive:
    "bg-destructive text-destructive-foreground hover:brightness-110",
};

const sizes: Record<Size, string> = {
  default: "h-10 px-4 text-sm",
  sm: "h-8 px-3 text-xs",
  lg: "h-12 px-5 text-base",
  icon: "h-9 w-9",
};

/** Returns the button class string so links/anchors can share button styling. */
export function buttonClassName(
  { variant = "default", size = "default" }: { variant?: Variant; size?: Size } = {},
) {
  return cn(base, variants[variant], sizes[size]);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonClassName({ variant, size }), className)}
      {...props}
    />
  );
}
