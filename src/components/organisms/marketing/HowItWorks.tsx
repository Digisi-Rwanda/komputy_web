"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { Badge } from "@/components/atoms/Badge";
import { cn } from "@/lib/cn";
import { howItWorks } from "@/data/content";
import { Frame, SectionHeading } from "@/components/organisms/marketing/Frame";
import { showCode } from "@/lib/code";

const icon = { passed: [CheckCircle2, "text-positive"], warning: [AlertTriangle, "text-warning"], error: [XCircle, "text-negative"] } as const;

/** L4: six numbered steps on a hairline, ECL/Leases switch, and the matching validation report card. */
export function HowItWorks() {
  const [svc, setSvc] = useState<"ecl" | "leases">("ecl");
  const report = howItWorks.reports[svc];
  return (
    <Frame id="how-it-works" label="How it works">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading label={howItWorks.label} title={howItWorks.title} />
        <ToggleGroup label="Show steps for" value={svc} onChange={(v) => setSvc(v as "ecl" | "leases")} options={[{ value: "ecl", label: "ECL" }, { value: "leases", label: "Leases" }]} />
      </div>
      <ol className="relative mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
        <span aria-hidden className="absolute left-5 right-5 top-5 hidden h-px bg-line-strong lg:block" />
        {howItWorks.steps.map((s) => (
          <li key={s.n} className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center">
            <span className="relative z-[1] inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong bg-canvas font-mono text-small text-fg">{s.n}</span>
            <span className="flex flex-col gap-1">
              <span className="text-small font-medium text-fg">{s.title}</span>
              <AnimatePresence mode="wait" initial={false} presenceAffectsLayout={false}>
                <motion.span key={svc} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="text-micro text-fg-muted">{s[svc]}</motion.span>
              </AnimatePresence>
            </span>
          </li>
        ))}
      </ol>
      <AnimatePresence mode="wait" initial={false} presenceAffectsLayout={false}>
        <motion.div key={svc} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="ring-inner mt-14 overflow-hidden rounded-panel border border-line bg-raised">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
            <p className="mr-2 text-small text-fg">{report.title}</p>
            <Badge tone="positive">{report.counts.passed} passed</Badge>
            <Badge tone="warning">{report.counts.warning} warnings</Badge>
            <Badge tone="negative">{report.counts.error} {report.counts.error === 1 ? "error" : "errors"}</Badge>
          </div>
          <ul className="divide-y divide-line">
            {report.rows.map((r) => {
              const [I, c] = icon[r.status];
              return (
                <li key={r.code} className="flex flex-wrap items-center gap-3 px-5 py-3 text-small">
                  <I aria-hidden className={cn("size-4 shrink-0", c)} />
                  <span className="font-mono text-micro text-fg-muted">{showCode(r.code)}</span>
                  <span className="min-w-0 flex-1 text-fg-body">{r.text}</span>
                  <span className={cn("text-micro", c)}>{r.note}</span>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end border-t border-line px-5 py-3"><span className="rounded-full bg-primary px-4 py-1.5 text-micro font-medium text-primary-fg">{report.action}</span></div>
        </motion.div>
      </AnimatePresence>
    </Frame>
  );
}
