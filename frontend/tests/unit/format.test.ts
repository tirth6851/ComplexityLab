import { describe, expect, it } from "vitest";
import { timeAgo } from "@/lib/format";

const NOW = Date.parse("2026-06-09T12:00:00Z");

function ago(ms: number): string {
  return new Date(NOW - ms).toISOString();
}

describe("timeAgo", () => {
  it("formats recent moments", () => {
    expect(timeAgo(ago(10_000), NOW)).toBe("just now");
    expect(timeAgo(ago(5 * 60_000), NOW)).toBe("5m ago");
    expect(timeAgo(ago(3 * 3_600_000), NOW)).toBe("3h ago");
  });

  it("formats days and weeks", () => {
    expect(timeAgo(ago(2 * 86_400_000), NOW)).toBe("2d ago");
    expect(timeAgo(ago(10 * 86_400_000), NOW)).toBe("1w ago");
  });

  it("falls back to a short date after ~a month", () => {
    expect(timeAgo(ago(60 * 86_400_000), NOW)).toMatch(/\w+ \d{1,2}, \d{4}/);
  });

  it("returns the raw string for unparseable input", () => {
    expect(timeAgo("not-a-date", NOW)).toBe("not-a-date");
  });

  it("clamps future timestamps to 'just now'", () => {
    expect(timeAgo(new Date(NOW + 60_000).toISOString(), NOW)).toBe("just now");
  });
});
