"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const particles = Array.from({ length: 24 }, (_, index) => {
  const left = (index * 37 + 11) % 100;
  const top = (index * 53 + 17) % 100;
  const size = 2 + (index % 4);
  const delay = (index % 8) * 0.28;
  const duration = 7 + (index % 5);
  const cyan = index % 3 === 0;
  const teal = index % 3 === 1;

  return {
    id: index,
    left,
    top,
    size,
    delay,
    duration,
    color: cyan
      ? "bg-cyan-300/45 shadow-[0_0_16px_rgba(34,211,238,0.35)]"
      : teal
        ? "bg-teal-300/45 shadow-[0_0_16px_rgba(45,212,191,0.32)]"
        : "bg-emerald-300/45 shadow-[0_0_16px_rgba(16,185,129,0.34)]",
  };
});

const subscribe = (onStoreChange: () => void) => {
  onStoreChange();
  return () => {};
};

const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function AuthParticleField({ className }: { className?: string }) {
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const reduceMotion = useReducedMotion();

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className={cn(
            "absolute rounded-full opacity-60 blur-[0.2px]",
            particle.id > 10 && "hidden sm:block",
            particle.color,
          )}
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.7 }}
          animate={
            reduceMotion
              ? { opacity: 0.28 }
              : {
                  opacity: [0.18, 0.62, 0.26],
                  y: [-8, 10, -8],
                  x: [0, particle.id % 2 === 0 ? 10 : -10, 0],
                  scale: [0.85, 1.15, 0.9],
                }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </div>
  );
}