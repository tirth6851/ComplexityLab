"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md";

const DIMS: Record<Size, { w: number; h: number; knob: number; pad: number }> = {
  sm: { w: 34, h: 20, knob: 14, pad: 3 },
  md: { w: 42, h: 24, knob: 18, pad: 3 },
};

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: Size;
  label?: React.ReactNode;
  id?: string;
  className?: string;
}

/**
 * Switch — an animated toggle. The track lights Signal Green with a soft glow
 * when on; the knob slides with a gentle spring overshoot. Controlled
 * (`checked`) or uncontrolled (`defaultChecked`).
 */
export function Switch({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  size = "md",
  label,
  id,
  className,
}: SwitchProps) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(defaultChecked);
  const on = isControlled ? checked : internal;
  const reactId = React.useId();
  const inputId = id ?? reactId;
  const d = DIMS[size];

  const toggle = () => {
    if (disabled) return;
    if (!isControlled) setInternal(!on);
    onChange?.(!on);
  };

  const track = (
    <button
      type="button"
      role="switch"
      id={inputId}
      aria-checked={on}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        "relative flex-none rounded-pill border p-0 transition-[background,box-shadow,border-color] duration-200 ease-ds",
        on
          ? "border-line-accent bg-[var(--accent-green)] shadow-glow-green"
          : "border-line-strong bg-surface-raised shadow-inset-well",
        disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer",
        !label && className,
      )}
      style={{ width: d.w, height: d.h }}
    >
      <span
        className="absolute rounded-full shadow-ds-sm transition-[left] duration-200 ease-snap"
        style={{
          top: d.pad,
          left: on ? d.w - d.knob - d.pad - 1 : d.pad,
          width: d.knob,
          height: d.knob,
          background: on ? "var(--text-on-accent)" : "var(--text-secondary)",
        }}
      />
    </button>
  );

  if (!label) return track;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "inline-flex items-center gap-2.5 text-base text-ink-primary",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      )}
    >
      {track}
      <span>{label}</span>
    </label>
  );
}
