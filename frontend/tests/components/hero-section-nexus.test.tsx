import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const motion = vi.hoisted(() => ({ reduce: false }));

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return { ...actual, useReducedMotion: () => motion.reduce };
});

import { HeroSectionNexus } from "@/components/ui/hero-section-nexus";

const ROTATE_WAIT_MS = 2600;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("HeroSectionNexus rotating headline word", () => {
  beforeEach(() => {
    // jsdom has no canvas implementation; the dots field only needs a null context.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    motion.reduce = false;
  });

  it("keeps the first word when the visitor prefers reduced motion", async () => {
    motion.reduce = true;
    render(<HeroSectionNexus />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Complexity");

    await wait(ROTATE_WAIT_MS);

    expect(heading).toHaveTextContent("Complexity");
    expect(heading).not.toHaveTextContent("Algorithms");
  }, 10_000);

  it("rotates to the next word otherwise", async () => {
    render(<HeroSectionNexus />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Complexity");

    await wait(ROTATE_WAIT_MS);

    expect(heading).toHaveTextContent("Algorithms");
  }, 10_000);
});
