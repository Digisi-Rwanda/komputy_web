"use client";
import { motion, useReducedMotion } from "motion/react";
import { ease } from "@/lib/motion";

/** Headline revealed word by word (blur + rise), as on the inspiration landing page. Screen readers get the plain text. */
export function WordReveal({ text, className, as: Tag = "h1" }: { text: string; className?: string; as?: "h1" | "h2" | "p" }) {
  const reduce = useReducedMotion();
  if (reduce) return <Tag className={className}>{text}</Tag>;
  return (
    <Tag className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <motion.span key={i} aria-hidden className="inline-block whitespace-pre" initial={{ opacity: 0, y: 12, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.6, ease: ease.out, delay: i * 0.06 }}>
          {w + " "}
        </motion.span>
      ))}
    </Tag>
  );
}
