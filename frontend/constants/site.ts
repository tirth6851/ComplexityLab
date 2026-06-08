/** App-wide static metadata. */
export const SITE = {
  name: "ComplexityLab",
  description:
    "Interactive lab for learning algorithms and computational complexity.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
