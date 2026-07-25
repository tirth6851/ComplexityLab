import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection, CodeBlock } from "@/components/content/content-page";

export const metadata: Metadata = {
  title: "How to Analyze Time Complexity of Any Algorithm",
  description:
    "A step-by-step method for deriving Big-O from source code: single loops, nested loops, recursion, logarithmic behavior, and simplifying to the dominant term.",
  alternates: { canonical: "/guides/how-to-analyze-time-complexity" },
  openGraph: {
    title: "How to Analyze Time Complexity of Any Algorithm",
    description:
      "A step-by-step method for deriving Big-O from source code: loops, nested loops, recursion, and dominant-term simplification.",
    url: "/guides/how-to-analyze-time-complexity",
  },
};

export default function HowToAnalyzeTimeComplexityGuide() {
  return (
    <ContentPage
      eyebrow="Guide"
      title="How to Analyze Time Complexity of Any Algorithm"
      dek="A repeatable method for reading a function and deriving its Big-O — no memorization required, just five patterns applied consistently."
    >
      <ContentSection heading="1. Start by counting the basic operations">
        <p>
          Time complexity measures how the number of operations grows as the input size{" "}
          <code className="font-mono text-sm text-ink-primary">n</code> grows. You don&rsquo;t
          count exact operations — you count how that count <em>scales</em>. The question to ask
          for every piece of code is: &ldquo;if I double the input, how does the work change?&rdquo;
        </p>
      </ContentSection>

      <ContentSection heading="2. A single loop is O(n)">
        <p>
          A loop that runs once per element does one unit of work per element, so the total work
          scales linearly with the input:
        </p>
        <CodeBlock>{`function sum(nums) {
  let total = 0;
  for (let i = 0; i < nums.length; i++) {
    total += nums[i]; // O(1) work, done n times
  }
  return total;
}
// Time: O(n)`}</CodeBlock>
        <p>
          It doesn&rsquo;t matter what happens inside the loop body, as long as it&rsquo;s
          constant-time work — the loop runs n times, so the function is O(n).
        </p>
      </ContentSection>

      <ContentSection heading="3. Nested loops multiply">
        <p>
          When a loop runs inside another loop, the work for the inner loop happens once for{" "}
          <em>every</em> iteration of the outer loop. Multiply their complexities together:
        </p>
        <CodeBlock>{`function hasDuplicatePair(nums) {
  for (let i = 0; i < nums.length; i++) {       // n iterations
    for (let j = 0; j < nums.length; j++) {     // n iterations, for each i
      if (i !== j && nums[i] === nums[j]) return true;
    }
  }
  return false;
}
// Time: O(n) * O(n) = O(n²)`}</CodeBlock>
        <p>
          This generalizes: three nested loops over the same input is O(n³), and so on. The rule
          is <strong className="text-ink-primary">multiply the iteration counts</strong>, not add
          them — the inner loop restarts fully for every pass of the outer loop.
        </p>
      </ContentSection>

      <ContentSection heading="4. Recursion: count calls, then work per call">
        <p>
          For recursive functions, first figure out how many times the function calls itself, then
          how much work each call does on its own (excluding the recursive calls). A recursive sum
          that makes one call per element and does O(1) work per call is still O(n):
        </p>
        <CodeBlock>{`function sum(nums, i = 0) {
  if (i >= nums.length) return 0;
  return nums[i] + sum(nums, i + 1); // one recursive call, O(1) own work
}
// Time: O(n) — n calls, O(1) work each`}</CodeBlock>
        <p>
          But a recursive function that makes <em>two</em> calls per invocation — like the naive
          Fibonacci implementation — branches exponentially:
        </p>
        <CodeBlock>{`function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2); // two recursive calls
}
// Time: O(2ⁿ) — the call tree doubles at every level`}</CodeBlock>
        <p>
          Adding memoization (caching each result the first time it&rsquo;s computed) collapses
          this back down to O(n), because each distinct subproblem is only ever solved once.
        </p>
      </ContentSection>

      <ContentSection heading="5. Logarithmic behavior: when the problem shrinks by a fraction each step">
        <p>
          O(log n) shows up whenever an algorithm discards a constant <em>fraction</em> of the
          remaining input at each step, rather than a constant amount. Binary search is the
          canonical example — it halves the search space every iteration:
        </p>
        <CodeBlock>{`function binarySearch(sortedNums, target) {
  let low = 0, high = sortedNums.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (sortedNums[mid] === target) return mid;
    if (sortedNums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}
// Time: O(log n) — the search space halves each iteration`}</CodeBlock>
        <p>
          To find how many halvings it takes to shrink n down to 1, you&rsquo;re asking &ldquo;2
          to what power equals n?&rdquo; — that&rsquo;s exactly what log₂(n) means. For n = 1,024,
          that&rsquo;s only 10 iterations.
        </p>
      </ContentSection>

      <ContentSection heading="6. Simplify to the dominant term">
        <p>
          Big-O describes behavior as n gets large, so you drop constants and keep only the
          fastest-growing term. If a function does one loop of n, then a nested loop of n², the
          total operation count is n + n², but for large n the n² term dominates completely:
        </p>
        <CodeBlock>{`function process(nums) {
  for (const x of nums) { /* O(n) */ }

  for (const x of nums) {
    for (const y of nums) { /* O(n²) */ }
  }
}
// Total: O(n) + O(n²) → simplify to O(n²)`}</CodeBlock>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-ink-primary">Drop constants:</strong> O(3n) simplifies to
            O(n) — a loop that runs three separate times over the input is still linear.
          </li>
          <li>
            <strong className="text-ink-primary">Drop lower-order terms:</strong> O(n² + n)
            simplifies to O(n²) — the smaller term becomes irrelevant as n grows.
          </li>
          <li>
            <strong className="text-ink-primary">Sequential blocks add, nested blocks
            multiply:</strong> two separate loops back-to-back add their complexities; a loop
            inside a loop multiplies them.
          </li>
        </ul>
      </ContentSection>

      <ContentSection heading="Worked example: putting it together">
        <p>Walk through this function using the rules above:</p>
        <CodeBlock>{`function example(nums) {
  console.log(nums[0]);              // O(1)

  for (const x of nums) {            // O(n)
    console.log(x);
  }

  for (const x of nums) {            // O(n) outer
    for (const y of nums) {          // O(n) inner, multiplied
      console.log(x, y);
    }
  }
}`}</CodeBlock>
        <p>
          Three blocks, run sequentially: O(1) + O(n) + O(n²). Add them, then keep only the
          dominant term:
        </p>
        <p className="font-mono text-lg font-semibold text-primary">
          Final answer: O(n²)
        </p>
      </ContentSection>

      <ContentSection heading="Next steps">
        <p>
          Keep the full table of complexity classes handy while you practice — and check back
          here as algorithm-specific breakdowns (binary search, quicksort, merge sort, dynamic
          programming) are published.
        </p>
        <p>
          <Link href="/complexity-cheatsheet" className="text-primary hover:underline">
            ← Back to the Big-O Cheat Sheet
          </Link>
        </p>
      </ContentSection>
    </ContentPage>
  );
}
