import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection, CodeBlock } from "@/components/content/content-page";

export const metadata: Metadata = {
  title: "Big-O vs. Big-Theta vs. Big-Omega Explained",
  description:
    "The difference between O (upper bound), Ω (lower bound), and Θ (tight bound) notation, why 'Big-O' gets used loosely for all three in practice, and worked examples of each.",
  alternates: { canonical: "/guides/big-o-vs-big-theta-vs-big-omega" },
  openGraph: {
    title: "Big-O vs. Big-Theta vs. Big-Omega Explained",
    description:
      "The difference between O (upper bound), Ω (lower bound), and Θ (tight bound) notation, with worked examples of each.",
    url: "/guides/big-o-vs-big-theta-vs-big-omega",
    // "article" is the only OpenGraph type the Metadata type allows modifiedTime on.
    type: "article",
    modifiedTime: "2026-07-25",
  },
};

export default function BigOVsThetaVsOmegaGuide() {
  return (
    <ContentPage
      eyebrow="Guide"
      title="Big-O vs. Big-Theta vs. Big-Omega"
      dek="Three different bounds on how an algorithm's running time grows — O is an upper bound, Ω is a lower bound, and Θ is both at once. Here's what that actually means and why it matters."
      lastUpdated="2026-07-25"
    >
      <ContentSection heading="Why three notations exist">
        <p>
          In everyday conversation, &ldquo;Big-O&rdquo; gets used as a catch-all for
          &ldquo;how fast is this algorithm.&rdquo; Formally, though, O, Ω, and Θ each answer a
          different question about an algorithm&rsquo;s running time as a function of input size{" "}
          <code className="font-mono text-sm text-ink-primary">n</code>:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-ink-primary">O (Big-O):</strong> an <em>upper bound</em> —
            &ldquo;this algorithm never does more than roughly this much work.&rdquo;
          </li>
          <li>
            <strong className="text-ink-primary">Ω (Big-Omega):</strong> a <em>lower bound</em> —
            &ldquo;this algorithm always does at least roughly this much work.&rdquo;
          </li>
          <li>
            <strong className="text-ink-primary">Θ (Big-Theta):</strong> a <em>tight bound</em> —
            both of the above at once, meaning the upper and lower bounds match.
          </li>
        </ul>
      </ContentSection>

      <ContentSection heading="Big-O: the upper bound">
        <p>
          Saying an algorithm is O(n²) means its running time grows{" "}
          <em>no faster than</em> some constant multiple of n², for large enough n. It says
          nothing about whether the algorithm might actually run faster on some or all inputs —
          only that n² is a ceiling.
        </p>
        <p>
          This is why linear search is technically correct to describe as O(n²) — it never runs
          slower than that — even though O(n) is the far more useful and precise upper bound.
          In practice, people use O to mean the <em>tightest known</em> upper bound, which is why
          it gets used loosely in place of Θ.
        </p>
      </ContentSection>

      <ContentSection heading="Big-Omega: the lower bound">
        <p>
          Saying an algorithm is Ω(n) means its running time grows{" "}
          <em>at least as fast as</em> some constant multiple of n — a floor, not a ceiling. Every
          comparison-based sort, for instance, is Ω(n): you can&rsquo;t sort a list without at
          least looking at every element once.
        </p>
        <CodeBlock>{`function findFirstEven(nums) {
  for (const n of nums) {
    if (n % 2 === 0) return n; // could return on the very first element
  }
  return null;
}
// Best case: Ω(1) — the first element might already be even
// Worst case: O(n) — might have to check every element`}</CodeBlock>
        <p>
          Notice this function has different bounds for its best and worst case — Ω describes the
          best case here, O describes the worst case, and neither alone tells the whole story.
        </p>
      </ContentSection>

      <ContentSection heading="Big-Theta: the tight bound">
        <p>
          Saying an algorithm is Θ(n log n) means its running time grows{" "}
          <em>exactly proportionally</em> to n log n — the upper bound (O) and lower bound (Ω)
          coincide. This is the strongest, most informative statement you can make about an
          algorithm&rsquo;s growth rate, because it rules out both &ldquo;might be slower&rdquo;
          and &ldquo;might be faster.&rdquo;
        </p>
        <p>
          <Link href="/algorithms/merge-sort" className="text-primary hover:underline">
            Merge sort
          </Link>{" "}
          is Θ(n log n): its best, average, and worst cases are all n log n, so the upper and lower
          bounds match exactly, in every case.{" "}
          <Link href="/algorithms/quicksort" className="text-primary hover:underline">
            Quicksort
          </Link>
          , by contrast, is only O(n²) and Ω(n log n) — its bounds don&rsquo;t coincide, so it has
          no single Θ that covers every case; its <em>average</em> case, though, is Θ(n log n).
        </p>
      </ContentSection>

      <ContentSection heading="Worked example: linear search">
        <p>
          Searching an unsorted array of n elements for a target value, stopping as soon as it&rsquo;s
          found:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-ink-primary">Best case — Ω(1):</strong> the target is the
            first element checked.
          </li>
          <li>
            <strong className="text-ink-primary">Worst case — O(n):</strong> the target is last,
            or absent, and every element gets checked.
          </li>
          <li>
            <strong className="text-ink-primary">No single Θ:</strong> because the best and worst
            cases differ, there&rsquo;s no n-only tight bound covering the algorithm as a whole —
            only per-case statements.
          </li>
        </ul>
        <p>
          Compare that to{" "}
          <Link href="/algorithms/binary-search" className="text-primary hover:underline">
            binary search
          </Link>
          , where even the worst case is O(log n) and the tight bound Θ(log n) applies uniformly
          because the halving behavior doesn&rsquo;t depend on where the target happens to be.
        </p>
      </ContentSection>

      <ContentSection heading="Why 'Big-O' is used loosely for all three">
        <p>
          In casual engineering conversation and even in most textbooks, &ldquo;Big-O&rdquo; is
          used as shorthand for &ldquo;the tight growth rate&rdquo; — what is formally Θ — because
          people almost always report the tightest bound they know, and an upper bound that&rsquo;s
          also a lower bound is the most useful thing to say. Strictly, O only promises &ldquo;no
          worse than,&rdquo; but in practice, if someone says an algorithm &ldquo;is O(n log n),&rdquo;
          they usually mean it behaves like n log n, not merely that it&rsquo;s bounded above by it.
        </p>
      </ContentSection>

      <ContentSection heading="Related pages">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Link href="/guides/how-to-analyze-time-complexity" className="text-primary hover:underline">
              How to Analyze Time Complexity of Any Algorithm
            </Link>{" "}
            — the general method for deriving these bounds from code.
          </li>
          <li>
            <Link href="/complexity-cheatsheet" className="text-primary hover:underline">
              Big-O Cheat Sheet
            </Link>{" "}
            — the common complexity classes these bounds are expressed in.
          </li>
          <li>
            <Link href="/algorithms/quicksort" className="text-primary hover:underline">
              Quicksort
            </Link>{" "}
            — a concrete example of an algorithm whose O and Ω bounds don&rsquo;t coincide.
          </li>
          <li>
            <Link href="/algorithms/binary-search" className="text-primary hover:underline">
              Binary Search
            </Link>{" "}
            — an algorithm with a uniform Θ(log n) bound across best, average, and worst case reasoning.
          </li>
        </ul>
      </ContentSection>
    </ContentPage>
  );
}
