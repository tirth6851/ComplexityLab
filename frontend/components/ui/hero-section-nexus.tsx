"use client";

import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  type Transition,
} from "framer-motion";
import {
  ArrowRight,
  Code2,
  History,
  LayoutDashboard,
  Menu,
  ScanLine,
  Sparkles,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SVGProps,
} from "react";
import { Logo } from "@/components/layout/logo";
import { CleanMotionBackground } from "@/components/ui/clean-motion-background";
import { cn } from "@/lib/utils";

const ROTATING_WORDS = [
  "Complexity",
  "Algorithms",
  "Optimization",
  "Data Structures",
  "Code Analysis",
] as const;

const NAV_ITEMS = [
  { label: "Analyzer", href: "/analyzer" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "History", href: "/analyses" },
  { label: "Snippets", href: "/snippets" },
  { label: "Cheat Sheet", href: "/complexity-cheatsheet" },
] as const;

interface Dot {
  x: number;
  y: number;
  opacity: number;
  radius: number;
  pulse: number;
}

function RotatingText({
  words,
  className,
  intervalMs = 2200,
}: {
  words: readonly string[];
  className?: string;
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const word = words[index] ?? words[0];
  const characters = useMemo(() => Array.from(word), [word]);
  const transition: Transition = { type: "spring", damping: 20, stiffness: 280 };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % words.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, words.length]);

  return (
    <span className={cn("relative inline-flex min-w-[9.5ch] align-bottom", className)}>
      <span className="sr-only">{word}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={word}
          aria-hidden="true"
          className="inline-flex whitespace-pre"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={{
            hidden: {},
            visible: {},
            exit: {},
          }}
        >
          {characters.map((character, characterIndex) => (
            <motion.span
              key={`${word}-${characterIndex}`}
              className="inline-block"
              variants={{
                hidden: { y: "100%", opacity: 0 },
                visible: { y: 0, opacity: 1 },
                exit: { y: "-100%", opacity: 0 },
              }}
              transition={{
                ...transition,
                delay: (characters.length - characterIndex) * 0.012,
              }}
            >
              {character === " " ? "\u00A0" : character}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function InteractiveDots() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });

  const createDots = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * scale));
    canvas.height = Math.max(1, Math.floor(rect.height * scale));
    const spacing = 28 * scale;
    const dots: Dot[] = [];

    for (let x = spacing / 2; x < canvas.width; x += spacing) {
      for (let y = spacing / 2; y < canvas.height; y += spacing) {
        dots.push({
          x,
          y,
          opacity: 0.22 + Math.random() * 0.2,
          radius: 1.1 * scale,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }

    dotsRef.current = dots;
  }, []);

  useEffect(() => {
    createDots();
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frame = 0;
    let raf = 0;
    const scale = window.devicePixelRatio || 1;

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (event.clientX - rect.left) * scale,
        y: (event.clientY - rect.top) * scale,
      };
    };

    const onLeave = () => {
      mouseRef.current = { x: null, y: null };
    };

    const draw = () => {
      const context = canvas.getContext("2d");
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      frame += 0.018;
      const mouse = mouseRef.current;

      for (const dot of dotsRef.current) {
        let boost = 0;
        if (mouse.x !== null && mouse.y !== null) {
          const dx = dot.x - mouse.x;
          const dy = dot.y - mouse.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          boost = Math.max(0, 1 - distance / (150 * scale));
        }
        const alpha = Math.min(0.92, dot.opacity + boost * 0.55);
        const radius = dot.radius + boost * 2.4 * scale + Math.sin(frame + dot.pulse) * 0.18;
        context.beginPath();
        context.fillStyle = `rgba(0, 229, 153, ${alpha})`;
        context.shadowColor = "rgba(0, 229, 153, 0.42)";
        context.shadowBlur = boost > 0 ? 16 * scale : 0;
        context.arc(dot.x, dot.y, Math.max(0.8, radius), 0, Math.PI * 2);
        context.fill();
      }

      raf = window.requestAnimationFrame(draw);
    };

    window.addEventListener("resize", createDots);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    raf = window.requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", createDots);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      window.cancelAnimationFrame(raf);
    };
  }, [createDots]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}

function MiniCodeTrace() {
  const rows = [
    ["01", "for item in collection"],
    ["02", "  compare target"],
    ["03", "  halve search window"],
    ["04", "return complexity"],
  ] as const;

  return (
    <motion.div
      className="mx-auto mt-10 w-full max-w-4xl overflow-hidden rounded-ds-xl border border-line bg-card/80 shadow-ds-xl backdrop-blur"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.7, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between border-b border-line bg-surface-panel/75 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-destructive" />
          <span className="size-2.5 rounded-full bg-warn" />
          <span className="size-2.5 rounded-full bg-primary" />
        </div>
        <span className="font-mono text-2xs uppercase tracking-label text-ink-muted">
          visual trace
        </span>
      </div>
      <div className="grid lg:grid-cols-[1fr_0.82fr]">
        <div className="bg-[#050816] p-5 font-mono text-sm">
          {rows.map(([number, text], index) => (
            <motion.div
              key={number}
              className="flex gap-4 rounded-ds-sm px-2 py-2 text-ink-secondary"
              initial={{ backgroundColor: "rgba(0,0,0,0)" }}
              animate={{
                backgroundColor:
                  index === 2 ? "rgba(0, 229, 153, 0.10)" : "rgba(0,0,0,0)",
              }}
              transition={{ delay: 1 + index * 0.18, duration: 0.35 }}
            >
              <span className="w-6 text-ink-faint">{number}</span>
              <span>{text}</span>
            </motion.div>
          ))}
        </div>
        <div className="space-y-4 border-t border-line bg-surface-panel/50 p-5 lg:border-l lg:border-t-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-ds-lg border border-line bg-card p-4">
              <p className="text-xs text-ink-muted">Time</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-primary">
                O(log n)
              </p>
            </div>
            <div className="rounded-ds-lg border border-line bg-card p-4">
              <p className="text-xs text-ink-muted">Space</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-info">
                O(1)
              </p>
            </div>
          </div>
          <div className="rounded-ds-lg border border-line bg-card p-4">
            <p className="font-mono text-2xs uppercase tracking-label text-primary">
              AI guidance
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-secondary">
              The loop repeatedly halves the search area, so execution grows
              logarithmically while memory remains constant.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group relative py-1 text-sm font-medium text-ink-secondary transition-colors hover:text-foreground"
    >
      {children}
      <span className="absolute inset-x-0 -bottom-1 h-px scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
    </Link>
  );
}

function NavIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M4 16.5c4.5 0 4.7-9 8.2-9 2.9 0 3.2 5.9 7.8 5.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="13.4" r="2" fill="currentColor" />
    </svg>
  );
}

export function HeroSectionNexus() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 10);
  });

  return (
    <section className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <InteractiveDots />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(65%_50%_at_50%_0%,rgba(0,229,153,0.13),transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-background to-transparent" />
      </div>

      <motion.header
        className="fixed inset-x-0 top-0 z-50 px-4 py-3"
        animate={{
          y: scrolled ? 2 : 0,
        }}
      >
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between rounded-pill border border-line bg-card/75 px-4 shadow-ds-lg backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2" aria-label="ComplexityLab home">
            <Logo />
          </Link>

          <CleanMotionBackground
            items={NAV_ITEMS.map((item) => ({
              key: item.label,
              label: item.label,
              href: item.href,
            }))}
            mode="hover"
            ariaLabel="Primary navigation"
            layoutId="landing-nav-hover-highlight"
            className="hidden items-center gap-1 md:flex"
            itemClassName="rounded-pill px-3 py-1.5 text-sm font-medium text-ink-secondary hover:text-foreground"
            indicatorClassName="border-primary/20 bg-gradient-to-r from-emerald-400/10 via-teal-300/10 to-cyan-300/10 shadow-[0_10px_30px_-24px_rgba(0,229,153,0.85)]"
          />

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/sign-in" className="text-sm font-medium text-ink-secondary hover:text-foreground">
              Sign in
            </Link>
            <Link
              href="/analyzer"
              className="inline-flex h-9 items-center gap-2 rounded-ds-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow-green transition hover:brightness-110"
            >
              Start Analyzing
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-ds-md border border-line bg-card text-ink-secondary md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="mx-auto mt-2 max-w-7xl rounded-ds-xl border border-line bg-card/95 p-4 shadow-ds-xl backdrop-blur-xl md:hidden"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="grid gap-3">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 pb-16 pt-28 text-center sm:px-6 lg:px-8">
        <motion.div
          className="mb-6 inline-flex items-center gap-2 rounded-pill border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          AI-powered visual complexity lab
        </motion.div>

        <motion.h1
          className="max-w-5xl text-balance font-display text-4xl font-bold leading-[1.02] tracking-normal text-white sm:text-6xl lg:text-[76px]"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.65, ease: "easeOut" }}
        >
          Master Big-O with
          <br />
          Visual Code Tracing{" "}
          <span className="block overflow-hidden pt-2 text-primary text-glow-primary">
            <RotatingText words={ROTATING_WORDS} />
          </span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-3xl text-pretty text-base leading-7 text-ink-secondary sm:text-lg"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: "easeOut" }}
        >
          Analyze code, understand time and space complexity, visualize execution
          flow, and improve solutions with AI-powered guidance.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.55, ease: "easeOut" }}
        >
          <Link
            href="/analyzer"
            className="inline-flex h-11 items-center gap-2 rounded-ds-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-glow-green transition hover:brightness-110"
          >
            Start Analyzing
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center gap-2 rounded-ds-md border border-line bg-card/55 px-5 text-sm font-semibold text-foreground backdrop-blur transition hover:border-primary/40 hover:bg-surface-raised"
          >
            View Dashboard
          </Link>
        </motion.div>

        <motion.div
          className="mt-9 flex flex-wrap items-center justify-center gap-3 text-xs text-ink-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.48, duration: 0.5 }}
        >
          {[
            [ScanLine, "Analyzer"],
            [LayoutDashboard, "Dashboard"],
            [History, "History"],
            [Code2, "Snippets"],
          ].map(([Icon, label]) => (
            <span
              key={label as string}
              className="inline-flex items-center gap-2 rounded-pill border border-line bg-card/50 px-3 py-1.5 backdrop-blur"
            >
              <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
              {label as string}
            </span>
          ))}
        </motion.div>

        <MiniCodeTrace />
      </div>

      <NavIcon className="pointer-events-none absolute bottom-10 right-8 hidden h-24 w-24 text-primary/10 lg:block" />
    </section>
  );
}
