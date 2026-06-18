import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionShell({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8", className)}>
      {(eyebrow || title || description) && (
        <div className="mx-auto mb-10 max-w-2xl text-center">
          {eyebrow && (
            <p className="font-mono text-xs uppercase tracking-label text-primary">
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
