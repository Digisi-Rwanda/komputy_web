"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { presets, transition } from "@/lib/motion";

/** Fade + 8px rise when scrolled into view (once). Static under reduced motion. */
export function FadeIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial={presets.rise.initial} whileInView={presets.rise.animate} viewport={{ once: true, margin: "-10% 0px" }} transition={{ ...transition, delay: delay / 1000 }}>
      {children}
    </motion.div>
  );
}
