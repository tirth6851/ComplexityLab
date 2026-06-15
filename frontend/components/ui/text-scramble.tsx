"use client";

import { useEffect, useMemo, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ{}[]()/\\<>#$01";

export function TextScramble({
  words,
  intervalMs = 2200,
  className,
}: {
  words: string[];
  intervalMs?: number;
  className?: string;
}) {
  const safeWords = useMemo(() => (words.length > 0 ? words : ["code"]), [words]);
  const [index, setIndex] = useState(0);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const cycle = window.setInterval(() => {
      setIndex((value) => (value + 1) % safeWords.length);
      setFrame(0);
    }, intervalMs);
    return () => window.clearInterval(cycle);
  }, [intervalMs, safeWords.length]);

  useEffect(() => {
    const raf = window.setInterval(() => {
      setFrame((value) => Math.min(value + 1, 12));
    }, 38);
    return () => window.clearInterval(raf);
  }, [index]);

  const word = safeWords[index];
  const revealed = Math.ceil((frame / 12) * word.length);
  const display = word
    .split("")
    .map((char, position) => {
      if (position < revealed || char === " ") return char;
      return CHARS[(position + frame + index) % CHARS.length];
    })
    .join("");

  return (
    <span className={className} aria-label={word}>
      {display}
    </span>
  );
}
