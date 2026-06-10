/**
 * Growth functions for Big-O classes. Used by the analyzer metrics (estimated
 * operations at a given input size) and the complexity-timeline chart.
 */

function normalize(notation: string): string {
  return notation.toLowerCase().replace(/\s+/g, "");
}

/** ln Γ(n+1) via Stirling — keeps factorial growth finite for display math. */
function logFactorial(n: number): number {
  if (n < 2) return 0;
  return n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n);
}

/**
 * f(n) for a Big-O class. Exponential/factorial values are computed in log
 * space and capped so charts and formatting never overflow to Infinity.
 */
export function growthValue(notation: string, n: number): number {
  const size = Math.max(1, n);
  switch (normalize(notation)) {
    case "o(1)":
    case "o(c)":
      return 1;
    case "o(logn)":
      return Math.max(1, Math.log2(size));
    case "o(n)":
      return size;
    case "o(nlogn)":
      return size * Math.max(1, Math.log2(size));
    case "o(n²)":
    case "o(n^2)":
      return size ** 2;
    case "o(n³)":
    case "o(n^3)":
      return size ** 3;
    case "o(2ⁿ)":
    case "o(2^n)":
      return Math.min(2 ** Math.min(size, 1000), Number.MAX_VALUE);
    case "o(n!)":
      return Math.min(Math.exp(Math.min(logFactorial(size), 700)), Number.MAX_VALUE);
    default:
      return size;
  }
}

/** Compact human formatting: 999 → "999", 10400 → "~10.4K", 1e9 → "~1.0B". */
export function formatOps(value: number): string {
  if (!Number.isFinite(value)) return "10^300+";
  if (value < 1000) return `${Math.round(value)}`;
  const units = ["K", "M", "B", "T"];
  let v = value;
  for (const unit of units) {
    v /= 1000;
    if (v < 1000) return `~${v.toFixed(1)}${unit}`;
  }
  return `10^${Math.round(Math.log10(value))}`;
}
