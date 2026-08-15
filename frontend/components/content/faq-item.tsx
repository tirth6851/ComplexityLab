import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Single collapsible FAQ entry. Native <details>/<summary> instead of a
 * client-side accordion: keyboard toggling, screen-reader open/closed
 * state, and find-in-page all come free, and the content page still
 * renders (and reads) fully without JS — a hard requirement for
 * a content-heavy public page like /faq.
 */
export function FaqItem({
  question,
  children,
  defaultOpen = false,
}: {
  question: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group border-b border-line py-1 last:border-0 [&_summary::-webkit-details-marker]:hidden [&_summary::marker]:content-none"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-ds-md py-3 font-display text-2xl font-semibold tracking-normal text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span>{question}</span>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-ink-faint transition-transform duration-150 ease-ds group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="space-y-3 pb-4 pt-1 text-base leading-7 text-ink-secondary">
        {children}
      </div>
    </details>
  );
}
