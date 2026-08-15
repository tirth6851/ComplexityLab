import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/content/content-page";
import { FaqItem } from "@/components/content/faq-item";

export const metadata: Metadata = {
  title: "Big-O and Complexity Analysis FAQ",
  description:
    "Answers to common questions about Big-O notation, time and space complexity, and how to analyze algorithms — what O(1) means, why constants drop out, and more.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Big-O and Complexity Analysis FAQ",
    description:
      "Answers to common questions about Big-O notation, time and space complexity, and how to analyze algorithms.",
    url: "/faq",
  },
};

const FAQS = [
  {
    q: "What does Big-O notation actually mean?",
    a: "Big-O describes how the running time (or memory use) of an algorithm grows as the input size grows, ignoring constant factors and lower-order terms. O(n) means the work scales linearly with input size; it doesn't tell you the exact number of operations, just the growth pattern.",
  },
  {
    q: "Why do constants get dropped in Big-O?",
    a: "Because Big-O describes growth rate, not exact speed. An algorithm that does 3n operations and one that does 100n operations are both O(n) — they scale identically as n grows, even though one has a bigger constant factor. The constant matters for real-world speed, but not for the asymptotic classification.",
  },
  {
    q: "What's the difference between O(n) and O(n²)?",
    a: "O(n) means work grows proportionally to input size — double the input, roughly double the work. O(n²) means work grows with the square of input size — double the input, roughly quadruple the work. For small n the difference can look tiny; for large n it becomes enormous (n = 10,000 gives 10,000 operations for O(n) vs. 100,000,000 for O(n²)).",
  },
  {
    q: "Is O(1) always faster than O(n)?",
    a: "Not necessarily for small inputs — an O(1) algorithm with a huge constant factor can be slower than an O(n) algorithm on small n. Big-O only describes what happens as n grows large; it says nothing about performance at any single fixed size. For large enough n, though, O(1) will always eventually win.",
  },
  {
    q: "What is the difference between time complexity and space complexity?",
    a: "Time complexity measures how the number of operations grows with input size. Space complexity measures how the memory used grows with input size. They're analyzed with the same Big-O tools but are independent — an algorithm can have great time complexity and poor space complexity, or vice versa.",
  },
  {
    q: "Why does recursion often add O(n) or O(log n) space, even if it returns a single value?",
    a: "Every recursive call adds a frame to the call stack that stays allocated until that call returns. A recursive function whose calls are all live at once — like one that recurses once per element — uses O(n) stack space. A recursive function that halves its problem each call, like binary search, only ever has O(log n) frames active at once.",
  },
  {
    q: "Why is my sorting algorithm's worst case different from its average case?",
    a: "Some algorithms, like quicksort, perform very differently depending on the input's structure. A poor pivot choice on already-sorted input can make quicksort degrade to O(n²), even though its average case across random inputs is O(n log n). Algorithms like merge sort avoid this by making the same amount of work regardless of input order.",
  },
  {
    q: "Do I need to memorize Big-O classes for interviews?",
    a: "It helps to recognize the common classes on sight (O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ)), but the more valuable skill is being able to derive them from code — counting loops, recognizing halving patterns, and multiplying nested work. That derivation process is the same every time.",
  },
] as const;

// FAQPage structured data, generated from the same FAQS array rendered on the
// page — no content is fabricated for SEO, it's just a machine-readable copy
// of what's already on screen. `<` is escaped so the JSON can't prematurely
// close the surrounding <script> tag.
const faqJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
}).replace(/</g, "\\u003c");

export default function FaqPage() {
  return (
    <>
      {/* Rendered outside ContentPage's children so it doesn't occupy a DOM
          slot inside the `space-y-10` content stack (script is invisible but
          still a sibling, which would otherwise shift the first item's spacing). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: faqJsonLd }}
      />
      <ContentPage
        eyebrow="Reference"
        title="Frequently Asked Questions"
        dek="Straight answers to the questions that come up most when people start learning Big-O notation and complexity analysis."
      >
        <div className="rounded-ds-md border border-line px-4 sm:px-6">
          {FAQS.map((item, index) => (
            <FaqItem key={item.q} question={item.q} defaultOpen={index === 0}>
              <p>{item.a}</p>
            </FaqItem>
          ))}
        </div>

        <ContentSection heading="Still have questions?">
          <p>
            Start with{" "}
            <Link href="/guides/how-to-analyze-time-complexity" className="text-primary hover:underline">
              How to Analyze Time Complexity of Any Algorithm
            </Link>{" "}
            for the general method, or the{" "}
            <Link href="/complexity-cheatsheet" className="text-primary hover:underline">
              Big-O Cheat Sheet
            </Link>{" "}
            for a quick reference across all the common complexity classes. For the distinction
            between O, Ω, and Θ notation specifically, see{" "}
            <Link href="/guides/big-o-vs-big-theta-vs-big-omega" className="text-primary hover:underline">
              Big-O vs. Big-Theta vs. Big-Omega
            </Link>
            .
          </p>
        </ContentSection>
      </ContentPage>
    </>
  );
}
