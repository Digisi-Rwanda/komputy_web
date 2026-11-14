"use client";
import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { money } from "@/lib/format";

/** Counts up to `value` when visible (hero numbers). Renders the final value for SSR and reduced motion. */
export function NumberTicker({ value, decimals = 2, format, className }: { value: number; decimals?: number; /** custom formatter (client callers only) */ format?: (v: number) => string; className?: string }) {
  const fmt = format ?? ((v: number) => money(v, decimals));
  // Latest formatter via ref so a new function identity each render does not restart the animation.
  const fmtRef = useRef(fmt);
  useEffect(() => { fmtRef.current = fmt; });
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!seen || reduce || !ref.current) return;
    const c = animate(0, value, { duration: 1.2, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = fmtRef.current(v); } });
    return () => c.stop();
  }, [seen, reduce, value]);
  return <span ref={ref} className={`tabular-nums ${className ?? ""}`}>{fmt(value)}</span>;
}
