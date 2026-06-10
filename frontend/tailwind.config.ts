import type { Config } from "tailwindcss";

/**
 * Theme tokens are bound to CSS custom properties defined in `app/globals.css`.
 * That CSS file is the single source of truth for token *values*; this file maps
 * those tokens into Tailwind's color/spacing/typography scales. Swapping in a real
 * design system means changing the variable values in globals.css, not this file.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // `<alpha-value>` lets Tailwind inject opacity modifiers (bg-primary/10)
        // into these CSS-variable colors. Without it, /opacity utilities are no-ops.
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        // Complexity gradient: cheap (1, green) → costly (5, red).
        complexity: {
          1: "hsl(var(--complexity-1) / <alpha-value>)",
          2: "hsl(var(--complexity-2) / <alpha-value>)",
          3: "hsl(var(--complexity-3) / <alpha-value>)",
          4: "hsl(var(--complexity-4) / <alpha-value>)",
          5: "hsl(var(--complexity-5) / <alpha-value>)",
        },

        /* ---- Design-system raw-token utilities (theme-aware) ---- */
        // Layered ink surfaces — bg-surface-card, bg-surface-panel, …
        surface: {
          inset: "var(--surface-inset)",
          base: "var(--bg-base)",
          card: "var(--surface-card)",
          panel: "var(--surface-panel)",
          raised: "var(--surface-raised)",
        },
        // Text scale — text-ink-primary / -secondary / -muted / -faint
        ink: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
          "on-accent": "var(--text-on-accent)",
        },
        // Border scale — border-line-subtle / -strong / -accent
        line: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
          accent: "var(--border-accent)",
        },
        // Complexity tiers (named) — text-cx-optimal, bg-cx-critical, …
        cx: {
          optimal: "var(--cx-optimal)",
          good: "var(--cx-good)",
          fair: "var(--cx-fair)",
          poor: "var(--cx-poor)",
          critical: "var(--cx-critical)",
        },
        // Brand Signal Green (raw) + semantic status colors
        signal: "var(--accent-green)",
        ok: "var(--ok)",
        warn: "var(--warn)",
        danger: "var(--danger)",
        info: "var(--info)",
      },
      borderRadius: {
        "2xl": "calc(var(--radius) + 8px)",
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // DS radius scale (precise px) — rounded-ds-sm … rounded-pill
        "ds-xs": "var(--radius-xs)",
        "ds-sm": "var(--radius-sm)",
        "ds-md": "var(--radius-md)",
        "ds-lg": "var(--radius-lg)",
        "ds-xl": "var(--radius-xl)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        "ds-sm": "var(--shadow-sm)",
        "ds-md": "var(--shadow-md)",
        "ds-lg": "var(--shadow-lg)",
        "ds-xl": "var(--shadow-xl)",
        "inset-well": "var(--shadow-inset)",
        "glow-green": "var(--glow-green)",
        "glow-green-soft": "var(--glow-green-soft)",
        "glow-amber": "var(--glow-amber)",
        "glow-red": "var(--glow-red)",
        "glow-cyan": "var(--glow-cyan)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": "0.625rem",
      },
      letterSpacing: {
        label: "0.10em",
      },
      transitionTimingFunction: {
        ds: "var(--ease-out)",
        snap: "var(--ease-snap)",
      },
      backgroundImage: {
        "complexity-gradient": "var(--complexity-gradient)",
      },
    },
  },
  plugins: [],
};

export default config;
