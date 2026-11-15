"use client";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { NumberTicker } from "@/components/atoms/NumberTicker";
import { manifesto } from "@/data/content";

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.22, 1]);
  return <motion.span style={{ opacity }}>{word} </motion.span>;
}

const fmt = (decimals: number, suffix: string) => (v: number) =>
  `${v < 0 ? "(" : ""}${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;

/** L2: paragraph that lights up word by word as it scrolls (Monitor effect), then four counting stats. */
export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = `${manifesto.lead} ${manifesto.rest}`.split(" ");
  return (
    <section aria-labelledby="manifesto" className="border-t border-line">
      <div className="mx-auto max-w-site border-x border-line px-4 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <span className="ring-inner inline-flex h-7 items-center rounded-full bg-surface px-3 text-micro text-fg-body">{manifesto.label}</span>
        <h2 id="manifesto" className="sr-only">{manifesto.lead}</h2>
        <p ref={ref} className="mt-6 max-w-5xl text-[28px] font-medium leading-[1.2] tracking-[-0.03em] text-fg sm:text-[36px] lg:text-[44px]">
          {reduce ? (
            <><span>{manifesto.lead} </span><span className="text-fg-muted">{manifesto.rest}</span></>
          ) : (
            words.map((w, i) => <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, Math.min(1, (i + 2) / words.length)]} />)
          )}
        </p>
      </div>
      <dl className="mx-auto mt-16 grid max-w-site grid-cols-2 border-x border-t border-line lg:grid-cols-4">
        {manifesto.stats.map((s) => (
          <div key={s.label} className="flex flex-col-reverse gap-2 border-b border-r border-line p-6 last:border-r-0 sm:p-8 lg:border-b-0 [&:nth-child(2)]:border-r-0 lg:[&:nth-child(2)]:border-r">
            <dt className="text-small text-fg-muted">{s.label}</dt>
            <dd className="flex items-baseline gap-2 text-[36px] font-medium leading-none tracking-[-0.03em] text-fg sm:text-h1">
              <NumberTicker value={s.value} format={fmt(s.decimals, s.suffix)} />
              <span aria-hidden className="text-h4 text-positive">↗</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
