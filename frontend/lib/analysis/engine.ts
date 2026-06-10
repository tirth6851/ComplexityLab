import type {
  AnalysisMetric,
  AnalyzeCodeInput,
  CodeAnalysis,
} from "@/lib/ai/types";
import type { ComplexityTier } from "@/lib/complexity";
import { formatOps, growthValue } from "./growth";

/**
 * Deterministic heuristic complexity engine.
 *
 * This is the "mock" analysis backend: no AI, no network — a static scan for
 * the structural signals that dominate asymptotic cost (loop nesting,
 * recursion shape, halving patterns, sort calls, memoization, allocations).
 * Deterministic by design so it is unit-testable and the analyzer experience
 * feels real before an LLM provider is wired in.
 *
 * It is intentionally approximate. Confidence is reported alongside the
 * verdict, and every detected signal is surfaced as a human-readable note.
 */

/** Notations the engine can emit, ranked cheap → costly. */
const NOTATION_RANK = [
  "O(1)",
  "O(log n)",
  "O(n)",
  "O(n log n)",
  "O(n²)",
  "O(n³)",
  "O(2ⁿ)",
] as const;

type Notation = (typeof NOTATION_RANK)[number];

const NOTATION_TIER: Record<Notation, ComplexityTier> = {
  "O(1)": "optimal",
  "O(log n)": "optimal",
  "O(n)": "good",
  "O(n log n)": "fair",
  "O(n²)": "poor",
  "O(n³)": "poor",
  "O(2ⁿ)": "critical",
};

function rank(n: Notation): number {
  return NOTATION_RANK.indexOf(n);
}

function maxNotation(...candidates: Notation[]): Notation {
  return candidates.reduce((a, b) => (rank(b) > rank(a) ? b : a), "O(1)");
}

/* ------------------------------------------------------------------ */
/* Source preprocessing                                                */
/* ------------------------------------------------------------------ */

/** Blank out string literals and comments so they don't trip keyword scans. */
export function stripNoise(code: string, language: string): string {
  let out = code
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""')
    .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
    .replace(/`(?:\\.|[^`\\])*`/g, "``");

  if (language === "python") {
    out = out
      .replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, '""')
      .replace(/#[^\n]*/g, "");
  } else {
    out = out.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Signal extraction                                                  */
/* ------------------------------------------------------------------ */

interface LoopScan {
  /** Maximum loop nesting depth. */
  maxDepth: number;
  /** Number of distinct loop headers. */
  headerCount: number;
  /** Loop depth at a given character index (brace languages only). */
  depthAt: (index: number) => number;
}

/** Loop nesting for brace-delimited languages via a single character walk. */
function scanBraceLoops(code: string): LoopScan {
  const headerIdx: number[] = [];
  const headerRe = /\b(?:for|while|do)\b/g;
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(code))) headerIdx.push(m.index);

  const headers = new Set(headerIdx);
  const depthAt = new Array<number>(code.length).fill(0);
  const stack: boolean[] = [];
  let pendingLoop = false;
  let depth = 0;
  let maxDepth = 0;

  for (let i = 0; i < code.length; i++) {
    if (headers.has(i)) pendingLoop = true;
    const ch = code[i];
    if (ch === "{") {
      stack.push(pendingLoop);
      if (pendingLoop) {
        depth++;
        maxDepth = Math.max(maxDepth, depth);
      }
      pendingLoop = false;
    } else if (ch === "}") {
      if (stack.pop()) depth--;
    }
    depthAt[i] = depth;
  }

  return {
    maxDepth,
    headerCount: headerIdx.length,
    depthAt: (i) => depthAt[Math.min(Math.max(i, 0), depthAt.length - 1)] ?? 0,
  };
}

/** Loop nesting for Python via indentation tracking. */
function scanIndentLoops(code: string): LoopScan {
  const lines = code.split("\n");
  const stack: number[] = [];
  let maxDepth = 0;
  let headerCount = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    const indent = (line.match(/^\s*/) as RegExpMatchArray)[0].length;
    while (stack.length && indent <= stack[stack.length - 1]) stack.pop();
    if (/^\s*(?:for|while)\b/.test(line)) {
      headerCount++;
      stack.push(indent);
      maxDepth = Math.max(maxDepth, stack.length);
    }
  }

  return { maxDepth, headerCount, depthAt: () => 0 };
}

/** Functional iteration (.map/.forEach/…) counts as one level of looping. */
function functionalIterationDepth(code: string, scan: LoopScan): number {
  const re = /\.(?:forEach|map|filter|reduce|flatMap|some|every|find)\s*\(/g;
  let depth = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    depth = Math.max(depth, scan.depthAt(m.index) + 1);
  }
  return depth;
}

/** Halving / doubling patterns → logarithmic loop or divide-and-conquer. */
function hasHalvingPattern(code: string): boolean {
  return (
    /(?:\/=\s*2|\*=\s*2|>>=?\s*1)/.test(code) ||
    /=\s*\w+\s*\/\/\s*2/.test(code) ||
    /=\s*\(?\s*\w+\s*\+\s*\w+\s*\)?\s*(?:\/\/|\/)\s*2/.test(code) ||
    /Math\.floor\(\s*\(?[^)]*\/\s*2\s*\)?\s*\)/.test(code) ||
    /\bmid(?:dle)?\b/i.test(code)
  );
}

function hasSortCall(code: string): boolean {
  return /\.sort\s*\(|\bsorted\s*\(|Arrays\.sort|Collections\.sort|sort\.(?:Slice|Sort|Ints|Strings)|std::sort|\.sort_unstable|\bqsort\s*\(/.test(
    code,
  );
}

function hasMemoization(code: string): boolean {
  return /\b(?:memo\w*|cache\w*|lru_cache|dp)\b/i.test(code);
}

interface RecursionScan {
  kind: "none" | "linear" | "branching";
  functionNames: string[];
}

/** Find declared function names across supported language families. */
export function findFunctionNames(code: string): string[] {
  const names = new Set<string>();
  const patterns = [
    /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g, // JS/TS function decls
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(?[\w\s,:{}[\]<>]*\)?\s*=>/g, // arrow fns
    /\bdef\s+([A-Za-z_]\w*)\s*\(/g, // Python
    /\bfunc\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)\s*\(/g, // Go (incl. methods)
    /\bfn\s+([A-Za-z_]\w*)\s*[(<]/g, // Rust
    /^[ \t]*(?:public|private|protected|static|final|synchronized|[\w<>[\],\s]*?)\s+([a-z]\w*)\s*\([^;]*\)\s*\{/gm, // Java/C++ methods
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(code))) {
      const name = m[1];
      // Skip keywords that the looser method pattern can capture.
      if (!/^(?:if|for|while|switch|return|catch|new|do|else)$/.test(name)) {
        names.add(name);
      }
    }
  }
  return [...names];
}

/** Detect self-recursion and whether it branches (≥2 self call sites). */
function scanRecursion(code: string): RecursionScan {
  const functionNames = findFunctionNames(code);
  let best: RecursionScan["kind"] = "none";

  for (const name of functionNames) {
    const escaped = name.replace(/[$]/g, "\\$&");
    const callRe = new RegExp(`\\b${escaped}\\s*\\(`, "g");
    const defRe = new RegExp(
      `(?:function\\s+|def\\s+|func\\s+(?:\\([^)]*\\)\\s*)?|fn\\s+|(?:const|let|var)\\s+)${escaped}\\b`,
      "g",
    );
    const calls = (code.match(callRe) ?? []).length;
    const defs = (code.match(defRe) ?? []).length;
    const selfCalls = calls - defs;
    if (selfCalls >= 2) return { kind: "branching", functionNames };
    if (selfCalls === 1) best = "linear";
  }
  return { kind: best, functionNames };
}

/** Linear-sized allocation growth (push/append inside a loop, dp tables…). */
function hasLinearAllocation(code: string, loopDepth: number): boolean {
  const growsCollection =
    /\.(?:push|append|add|unshift|extend|insert|push_back)\s*\(/.test(code) ||
    /\w+\[[\w\s+\-*]]?\]\s*=\s*[^=]/.test(code);
  return (
    (loopDepth >= 1 && growsCollection) ||
    /new\s+Array\s*\(|Array\.from\s*\(|new\s+\w+\[\w+\]|make\(\s*\[\]|vec!\[|Vec::with_capacity|\[0\]\s*\*\s*\w+|list\(range/.test(
      code,
    )
  );
}

/** Matrix / 2-D table allocation → quadratic space. */
function hasMatrixAllocation(code: string): boolean {
  return (
    /new\s+\w+\[\w+\]\[\w+\]/.test(code) ||
    /\[\s*\[0\]\s*\*\s*\w+/.test(code) ||
    /\[\[0\]\s*\*/.test(code) ||
    /Array\.from\([^)]*\)\s*\.map\(\s*\(\)?\s*=>\s*(?:new\s+Array|\[)/.test(code) ||
    /for\s*\([^)]*\)[^{]*\{[^}]*new\s+Array/.test(code) ||
    /vec!\[\s*vec!/.test(code)
  );
}

/* ------------------------------------------------------------------ */
/* Verdict assembly                                                    */
/* ------------------------------------------------------------------ */

const TIER_SUMMARY: Record<ComplexityTier, string> = {
  optimal: "Scales effortlessly — cost barely grows with input size.",
  good: "Solid linear scaling — cost grows in step with input size.",
  fair: "Reasonable scaling, but the log-linear cost will show on large inputs.",
  poor: "Polynomial blow-up — this becomes a bottleneck as inputs grow.",
  critical: "Exponential growth — practical only for very small inputs.",
};

function loopDepthTier(depth: number): ComplexityTier {
  if (depth <= 1) return "optimal";
  if (depth === 2) return "fair";
  return "critical";
}

function buildMetrics(
  time: Notation,
  space: Notation,
  loopDepth: number,
  confidence: number,
): AnalysisMetric[] {
  const N = 1000;
  const ops = growthValue(time, N);
  const units = growthValue(space, N);

  return [
    {
      id: "ops",
      label: `EST. OPS @ N=${N}`,
      value: formatOps(ops),
      fraction: Math.min(1, Math.log10(Math.max(ops, 1)) / 9),
      tier: NOTATION_TIER[time],
      hint: `${time} growth at n = ${N}`,
    },
    {
      id: "space",
      label: `EST. MEMORY @ N=${N}`,
      value: `${formatOps(units)} units`,
      fraction: Math.min(1, Math.log10(Math.max(units, 1)) / 6),
      tier: NOTATION_TIER[space],
      hint: `${space} auxiliary space`,
    },
    {
      id: "depth",
      label: "MAX LOOP DEPTH",
      value: `${loopDepth}`,
      fraction: Math.min(1, loopDepth / 4),
      tier: loopDepthTier(loopDepth),
      hint: loopDepth >= 2 ? "Nested iteration detected" : "No nested iteration",
    },
    {
      id: "confidence",
      label: "ENGINE CONFIDENCE",
      value: `${Math.round(confidence * 100)}%`,
      fraction: confidence,
      tier: "accent",
      hint: "Heuristic static scan (no AI provider yet)",
    },
  ];
}

/**
 * Analyze source code and produce a full `CodeAnalysis`.
 * Pure and deterministic: same input → same output.
 */
export function analyzeCode(input: AnalyzeCodeInput): CodeAnalysis {
  const language = input.language.toLowerCase();
  const code = stripNoise(input.code, language);
  const meaningfulLines = code
    .split("\n")
    .filter((l) => l.trim().length > 0).length;

  if (meaningfulLines === 0) {
    return {
      time: { notation: "O(1)", tier: "optimal", reason: "No executable statements found." },
      space: { notation: "O(1)", tier: "optimal", reason: "No allocations found." },
      verdict: "Nothing to analyze yet — paste some code or load a sample.",
      notes: ["The submitted source contained no executable statements."],
      metrics: buildMetrics("O(1)", "O(1)", 0, 0.3),
      confidence: 0.3,
      provider: "mock",
    };
  }

  /* ---- gather signals ---- */
  const scan =
    language === "python" ? scanIndentLoops(code) : scanBraceLoops(code);
  const loopDepth = Math.max(
    scan.maxDepth,
    functionalIterationDepth(code, scan),
  );
  const halving = hasHalvingPattern(code);
  const sorts = hasSortCall(code);
  const memo = hasMemoization(code);
  const recursion = scanRecursion(code);
  const notes: string[] = [];

  /* ---- time complexity ---- */
  let loopTime: Notation = "O(1)";
  if (loopDepth === 1) {
    loopTime = halving && scan.headerCount === 1 ? "O(log n)" : "O(n)";
  } else if (loopDepth === 2) {
    loopTime = halving ? "O(n log n)" : "O(n²)";
  } else if (loopDepth >= 3) {
    loopTime = "O(n³)";
  }
  if (loopDepth > 0) {
    notes.push(
      loopDepth === 1
        ? loopTime === "O(log n)"
          ? "Single loop with a halving step — iterates ~log₂(n) times."
          : "Single non-nested loop — one full pass over the input."
        : `${loopDepth} levels of nested iteration detected${halving ? " (inner loop halves its range)" : ""}.`,
    );
  }

  let sortTime: Notation = "O(1)";
  if (sorts) {
    sortTime = "O(n log n)";
    notes.push("Sort call detected — comparison sorts cost at least O(n log n).");
  }

  let recursionTime: Notation = "O(1)";
  let recursionSpace: Notation = "O(1)";
  if (recursion.kind === "branching") {
    if (memo) {
      recursionTime = "O(n)";
      recursionSpace = "O(n)";
      notes.push(
        "Branching recursion with memoization — each subproblem is solved once.",
      );
    } else if (halving) {
      if (loopDepth >= 1) {
        recursionTime = "O(n log n)";
        recursionSpace = "O(n)";
        notes.push(
          "Divide-and-conquer recursion with linear merge work — classic O(n log n).",
        );
      } else {
        recursionTime = "O(log n)";
        recursionSpace = "O(log n)";
        notes.push(
          "Recursion that halves the search space — only one branch executes per level.",
        );
      }
    } else {
      recursionTime = "O(2ⁿ)";
      recursionSpace = "O(n)";
      notes.push(
        "Branching recursion without memoization — the call tree doubles per level.",
      );
    }
  } else if (recursion.kind === "linear") {
    recursionTime = halving ? "O(log n)" : "O(n)";
    recursionSpace = recursionTime;
    notes.push(
      halving
        ? "Single self-call with a halving step — logarithmic recursion depth."
        : "Single self-call per invocation — linear recursion depth.",
    );
  }

  const time = maxNotation(loopTime, sortTime, recursionTime);

  /* ---- space complexity ---- */
  let space: Notation = "O(1)";
  if (hasMatrixAllocation(code)) {
    space = "O(n²)";
    notes.push("2-D table allocation detected — quadratic auxiliary space.");
  } else if (recursionSpace !== "O(1)") {
    space = recursionSpace;
    notes.push(
      space === "O(log n)"
        ? "Call stack grows logarithmically with input size."
        : "Call stack / memo table grows linearly with input size.",
    );
  } else if (hasLinearAllocation(code, loopDepth)) {
    space = "O(n)";
    notes.push("Collection grows inside the iteration — linear auxiliary space.");
  } else {
    notes.push("Only fixed-size variables detected — constant auxiliary space.");
  }

  /* ---- confidence ---- */
  let confidence = 0.92;
  if (meaningfulLines < 3) confidence -= 0.25;
  if (recursion.functionNames.length === 0 && loopDepth === 0) confidence -= 0.2;
  if (meaningfulLines > 120) confidence -= 0.12;
  confidence = Math.max(0.4, Math.min(0.95, confidence));

  const timeTier = NOTATION_TIER[time];
  const spaceTier = NOTATION_TIER[space];

  return {
    time: {
      notation: time,
      tier: timeTier,
      reason:
        time === recursionTime && recursion.kind !== "none"
          ? "Dominated by the recursion structure."
          : time === sortTime && sorts
            ? "Dominated by the sort call."
            : time === "O(1)"
              ? "No input-dependent iteration detected."
              : "Dominated by the loop structure.",
    },
    space: {
      notation: space,
      tier: spaceTier,
      reason:
        space === "O(1)"
          ? "No input-proportional allocations."
          : "Auxiliary structures grow with input size.",
    },
    verdict: `${time} time, ${space} space. ${TIER_SUMMARY[timeTier]}`,
    notes,
    metrics: buildMetrics(time, space, loopDepth, confidence),
    confidence,
    provider: "mock",
  };
}
