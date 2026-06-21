/** Normalized execution status values returned by the /api/execute route. */
export type ExecutionStatus =
  | "accepted"
  | "compile_error"
  | "runtime_error"
  | "time_limit"
  | "error";

/**
 * The shape returned by POST /api/execute.
 * All fields except status and statusLabel are null when execution did not complete.
 */
export interface ExecutionResult {
  status: ExecutionStatus;
  /** Human-readable label from Judge0, e.g. "Accepted", "Compilation Error". */
  statusLabel: string;
  /** Decoded stdout, truncated to 64 KB. Null when empty or execution failed. */
  stdout: string | null;
  /** Decoded stderr. Null when empty or not applicable. */
  stderr: string | null;
  /** Decoded compiler output. Non-null only when status is compile_error. */
  compileOutput: string | null;
  /** Wall-clock execution time in milliseconds. Null when execution did not complete. */
  timeMs: number | null;
  /** Peak memory usage in kilobytes. Null when execution did not complete. */
  memoryKb: number | null;
}
