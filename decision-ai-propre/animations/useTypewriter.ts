"use client";

import { useEffect, useRef, useState } from "react";

interface UseTypewriterOptions {
  /** Only starts (and restarts) typing while this is true */
  active: boolean;
  /** ms between characters */
  speed?: number;
  /** called once the full text has been typed */
  onDone?: () => void;
}

/**
 * Simple char-by-char typewriter. Respects prefers-reduced-motion by
 * revealing the full text immediately for users who opt out of motion.
 */
export function useTypewriter(text: string, { active, speed = 35, onDone }: UseTypewriterOptions) {
  const [display, setDisplay] = useState("");
  const [done, setDone] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) {
      setDisplay("");
      setDone(false);
      return;
    }

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setDisplay(text);
      setDone(true);
      onDoneRef.current?.();
      return;
    }

    let i = 0;
    setDisplay("");
    setDone(false);

    const interval = setInterval(() => {
      i += 1;
      setDisplay(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onDoneRef.current?.();
      }
    }, speed);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, active, speed]);

  return { display, done };
}
