import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "default" | "sm" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ds-md border border-transparent font-medium transition-all duration-150 ease-ds active:translate-y-px active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45";

const variants: Record<Variant, string> = {
  // Signal Green primary — luminous, with a brightness lift + glow on hover.
  default:
    "bg-primary text-primary-foreground shadow-[0_0_28px_-12px_rgba(0,229,153,0.9)] hover:brightness-110 hover:shadow-glow-green",
  secondary:
    "border-line bg-secondary text-secondary-foreground hover:border-line-strong hover:bg-surface-raised",
  outline:
    "border-line bg-card/40 text-ink-primary hover:border-primary/35 hover:bg-surface-raised",
  ghost: "text-ink-primary hover:bg-surface-raised/80",
  destructive:
    "bg-destructive text-destructive-foreground hover:brightness-110",
};

const sizes: Record<Size, string> = {
  default: "h-9 px-4 text-sm",
  sm: "h-[30px] px-2.5 text-xs",
  lg: "h-11 px-5 text-sm",
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
