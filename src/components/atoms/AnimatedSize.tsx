"use client";
import { motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { transition } from "@/lib/motion";

/** Animates height when its content changes (validation steps, expanding panels). */
export function AnimatedSize({ children, className }: { children: ReactNode; className?: string }) {
  const inner = useRef<HTMLDivElement>(null);
  const [h, setH] = useState<number | "auto">("auto");
  useEffect(() => {
    if (!inner.current) return;
    const ro = new ResizeObserver(([e]) => setH(e.contentRect.height));
    ro.observe(inner.current);
    return () => ro.disconnect();
  }, []);
  return (
    <motion.div className={className} style={{ overflow: "hidden" }} animate={{ height: h }} transition={transition}>
      <div ref={inner}>{children}</div>
    </motion.div>
  );
}
