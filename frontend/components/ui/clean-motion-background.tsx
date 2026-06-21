"use client";

import Link from "next/link";
import {
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import {
  useId,
  useMemo,
  useState,
  type ComponentType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type CleanMotionMode = "hover" | "select" | "both";

export interface CleanMotionItem<Key extends string = string> {
  key: Key;
  label: ReactNode;
  href?: string;
  disabled?: boolean;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

export interface CleanMotionItemState<Key extends string = string> {
  active: boolean;
  highlighted: boolean;
  key: Key;
}

export interface CleanMotionBackgroundProps<Key extends string = string> {
  items: readonly CleanMotionItem<Key>[];
  value?: Key;
  defaultKey?: Key;
  onChange?: (key: Key) => void;
  mode?: CleanMotionMode;
  className?: string;
  itemClassName?:
    | string
    | ((item: CleanMotionItem<Key>, state: CleanMotionItemState<Key>) => string);
  indicatorClassName?: string;
  layoutId?: string;
  ariaLabel?: string;
  role?: HTMLAttributes<HTMLElement>["role"];
  itemRole?: HTMLAttributes<HTMLElement>["role"];
  getItemProps?: (
    item: CleanMotionItem<Key>,
    state: CleanMotionItemState<Key>,
  ) => HTMLAttributes<HTMLElement>;
  renderItem?: (
    item: CleanMotionItem<Key>,
    state: CleanMotionItemState<Key>,
  ) => ReactNode;
}

const baseTransition: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.82,
};

export function CleanMotionBackground<Key extends string = string>({
  items,
  value,
  defaultKey,
  onChange,
  mode = "select",
  className,
  itemClassName,
  indicatorClassName,
  layoutId,
  ariaLabel,
  role,
  itemRole,
  getItemProps,
  renderItem,
}: CleanMotionBackgroundProps<Key>) {
  const generatedId = useId();
  const shouldReduceMotion = useReducedMotion();
  const fallbackKey = defaultKey ?? items[0]?.key;
  const [internalKey, setInternalKey] = useState<Key | undefined>(fallbackKey);
  const [hoverKey, setHoverKey] = useState<Key | null>(null);


  const selectedKey = value ?? internalKey;
  const highlightedKey = useMemo(() => {
    if ((mode === "hover" || mode === "both") && hoverKey) return hoverKey;
    if (mode === "hover") return defaultKey;
    return selectedKey;
  }, [defaultKey, hoverKey, mode, selectedKey]);

  const transition = shouldReduceMotion ? { duration: 0 } : baseTransition;
  const resolvedLayoutId = layoutId ?? `clean-motion-${generatedId}`;

  function handleSelect(item: CleanMotionItem<Key>) {
    if (item.disabled) return;
    if (mode === "select" || mode === "both") {
      setInternalKey(item.key);
      onChange?.(item.key);
    }
  }

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      onMouseLeave={() => setHoverKey(null)}
      className={cn("relative isolate", className)}
    >
      {items.map((item) => {
        const active = selectedKey === item.key;
        const highlighted = highlightedKey === item.key;
        const state: CleanMotionItemState<Key> = {
          active,
          highlighted,
          key: item.key,
        };
        const Icon = item.icon;
        const extraProps = getItemProps?.(item, state) ?? {};
        const resolvedItemClassName = cn(
          "relative isolate transition-colors duration-150 ease-ds focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45",
          typeof itemClassName === "function"
            ? itemClassName(item, state)
            : itemClassName,
        );
        const content = renderItem ? (
          renderItem(item, state)
        ) : (
          <>
            {Icon && <Icon className="h-4 w-4" aria-hidden />}
            <span>{item.label}</span>
          </>
        );
        const background = highlighted ? (
          <motion.span
            aria-hidden="true"
            layoutId={resolvedLayoutId}
            transition={transition}
            className={cn(
              "absolute inset-0 -z-10 rounded-[inherit] border border-primary/25 bg-gradient-to-r from-emerald-400/15 via-teal-300/14 to-cyan-300/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_34px_-26px_rgba(34,211,238,0.9)]",
              indicatorClassName,
            )}
          />
        ) : null;

        if (item.href && !item.disabled) {
          return (
            <Link
              key={item.key}
              href={item.href}
              role={itemRole}
              aria-label={typeof item.label === "string" ? item.label : undefined}
              {...extraProps}
              onMouseEnter={() => setHoverKey(item.key)}
              onFocus={() => setHoverKey(item.key)}
              onBlur={() => setHoverKey(null)}
              onClick={(event) => {
                extraProps.onClick?.(event as never);
                handleSelect(item);
              }}
              className={resolvedItemClassName}
            >
              {background}
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            role={itemRole}
            disabled={item.disabled}
            {...extraProps}
            onMouseEnter={() => setHoverKey(item.key)}
            onFocus={() => setHoverKey(item.key)}
            onBlur={() => setHoverKey(null)}
            onClick={(event) => {
              extraProps.onClick?.(event as never);
              handleSelect(item);
            }}
            className={resolvedItemClassName}
          >
            {background}
            {content}
          </button>
        );
      })}
    </div>
  );
}