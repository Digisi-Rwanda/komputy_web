"use client";
import { motion, useReducedMotion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { Icon } from "@/components/atoms/Icon";
import { RunStatusPill, StatusPill, stageDot } from "@/components/atoms/StatusPill";
import { MetaChip } from "@/components/atoms/Chip";
import { Money } from "@/components/atoms/Numbers";
import { LiveDot } from "@/components/atoms/LiveDot";
import { compact } from "@/lib/format";
import { eclTrend, leases as mockLeases, run as getRun } from "@/data/mock/data";
import { cn } from "@/lib/cn";

const SCREENS = ["ecl", "leases"] as const;
const URLS = { ecl: "app.ledgerline.com/ecl/runs/RUN-0142", leases: "app.ledgerline.com/leases/register/LSE-0087" };

/** Stacked area of ECL by stage (decorative mini chart inside the product window). */
function MiniArea() {
  const W = 520, H = 120, max = Math.max(...eclTrend.map((d) => d.s1 + d.s2 + d.s3)) * 1.1;
  const x = (i: number) => (i / (eclTrend.length - 1)) * W;
  const band = (lo: (d: (typeof eclTrend)[number]) => number, hi: (d: (typeof eclTrend)[number]) => number) =>
    [...eclTrend.map((d, i) => `${x(i)},${H - (hi(d) / max) * H}`), ...[...eclTrend].reverse().map((d, i) => `${x(eclTrend.length - 1 - i)},${H - (lo(d) / max) * H}`)].join(" ");
  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${H + 18}`} className="w-full">
      <polygon points={band(() => 0, (d) => d.s1)} fill="var(--chart-1)" opacity={0.9} />
      <polygon points={band((d) => d.s1, (d) => d.s1 + d.s2)} fill="var(--stage-2)" opacity={0.85} />
      <polygon points={band((d) => d.s1 + d.s2, (d) => d.s1 + d.s2 + d.s3)} fill="var(--stage-3)" opacity={0.85} />
      {eclTrend.map((d, i) => <text key={d.month} x={x(i)} y={H + 14} fontSize={10} textAnchor={i === 0 ? "start" : i === eclTrend.length - 1 ? "end" : "middle"} fill="var(--fg-muted)">{d.month}</text>)}
    </svg>
  );
}

function EclScreen() {
  const r = getRun("RUN-0142")!;
  const label = { 1: "Performing", 2: "SICR", 3: "Credit-impaired" } as const;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-h4 text-fg">{r.name}</p>
        <RunStatusPill status="signed-off" />
        <span className="ml-auto hidden gap-2 sm:flex"><MetaChip>{r.engine}</MetaChip><MetaChip>30 Sep 2026</MetaChip></span>
      </div>
      <div>
        <p className="text-micro text-fg-muted">Total ECL</p>
        <p className="flex flex-wrap items-baseline gap-2 text-[26px] font-medium tracking-[-0.03em] text-fg sm:text-h2">
          <Money value={r.totalEcl} currency="USD" />
          <span className="text-small text-warning">▲ 4.2 % <span className="text-fg-muted">vs Aug</span></span>
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {r.stages.map((s) => (
          <div key={s.stage} className="rounded-md border border-line p-2.5">
            <p className="flex items-center gap-1.5 truncate text-[11px] text-fg-muted"><span aria-hidden className={cn("size-1.5 rounded-full", stageDot[s.stage])} />Stage {s.stage}<span className="hidden md:inline"> · {label[s.stage]}</span></p>
            <p className="mt-1 text-small text-fg tabular-nums">USD {compact(s.ecl)} <span className="text-micro text-fg-muted">{(s.share * 100).toFixed(1)} %</span></p>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1"><MiniArea /></div>
        <div className="hidden shrink-0 items-center gap-2 rounded-md border border-line px-3 py-2 text-micro text-fg sm:flex"><LiveDot />7 / 7 checks passed</div>
      </div>
    </div>
  );
}

function LeaseScreen() {
  const l = mockLeases[0];
  const rows = [["2027", "24,868.52", "2,486.85", "10,000.00", "17,355.37"], ["2028", "17,355.37", "1,735.54", "10,000.00", "9,090.91"], ["2029", "9,090.91", "909.09", "10,000.00", "0.00"]];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-h4 text-fg">{l.name}</p>
        <StatusPill tone="positive">Approved</StatusPill>
        <span className="ml-auto hidden gap-2 sm:flex"><MetaChip>{l.id}</MetaChip><MetaChip>IFRS 16</MetaChip></span>
      </div>
      <div>
        <p className="text-micro text-fg-muted">Lease liability · 31 Oct 2026</p>
        <p className="text-[26px] font-medium tracking-[-0.03em] text-fg sm:text-h2"><Money value={l.liability ?? 0} currency="USD" /></p>
      </div>
      <div className="overflow-hidden rounded-md border border-line">
        <table className="w-full text-micro tabular-nums">
          <caption className="sr-only">Amortisation schedule</caption>
          <thead><tr className="border-b border-line text-fg-muted">{["Period", "Opening", "Interest", "Payment", "Closing"].map((h, i) => <th key={h} scope="col" className={cn("px-3 py-2 font-normal", i ? "text-right" : "text-left", i === 2 && "hidden sm:table-cell")}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r) => <tr key={r[0]} className="border-b border-line last:border-0">{r.map((c, i) => <td key={i} className={cn("px-3 py-2 text-fg-body", i ? "text-right" : "text-fg", i === 2 && "hidden sm:table-cell")}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className="flex items-center gap-2 text-micro text-fg-muted"><Lock className="size-3" />Approved by Jean Habimana · rate override verified</p>
    </div>
  );
}

/** L1 product window: browser chrome + mini app, cycling ECL run → lease every 6 s; tilts flat as it scrolls in. */
export function ProductWindow() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [14, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((v) => (v + 1) % SCREENS.length), 6000);
    return () => clearInterval(t);
  }, [reduce]);
  const screen = SCREENS[i];

  return (
    <div ref={ref} className="relative mx-auto max-w-[960px] [perspective:1400px]">
      <motion.div
        style={reduce ? undefined : { rotateX, scale, transformOrigin: "center bottom" }}
        className="ring-inner overflow-hidden rounded-t-panel border border-b-0 border-line-strong bg-canvas/95 backdrop-blur"
        role="img"
        aria-label={screen === "ecl" ? "Ledgerline ECL run Q3 2026 provisioning, signed off, total ECL USD 12,846,210.55" : "Ledgerline lease LSE-0087 Kigali Heights, approved, liability USD 24,868.52"}
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span aria-hidden className="flex gap-1.5">{[0, 1, 2].map((d) => <span key={d} className="size-2.5 rounded-full bg-surface-active" />)}</span>
          <span aria-hidden className="mx-auto flex max-w-sm flex-1 items-center justify-center gap-1.5 truncate rounded-full bg-surface px-3 py-1 font-mono text-[11px] text-fg-muted"><Lock className="size-3 shrink-0" />{URLS[screen]}</span>
          <span aria-hidden className="w-10" />
        </div>
        <div aria-hidden className="flex">
          <div className="hidden w-48 shrink-0 flex-col gap-1 border-r border-line bg-sidebar p-3 text-micro md:flex">
            <span className="mb-2 inline-flex size-6 items-center justify-center rounded-md bg-accent text-[11px] text-white">K</span>
            <span className="flex items-center gap-2 px-2 py-1.5 text-fg-muted"><Icon name="home" size={14} />Home</span>
            <span className={cn("flex items-center gap-2 rounded-full px-2 py-1.5", screen === "ecl" ? "text-fg" : "text-fg-muted")}><Icon name="ecl" size={14} />Expected Credit Loss</span>
            {screen === "ecl" && <span className="ml-5 rounded-full bg-surface px-2 py-1.5 text-fg">Runs</span>}
            <span className={cn("flex items-center gap-2 rounded-full px-2 py-1.5", screen === "leases" ? "text-fg" : "text-fg-muted")}><Icon name="leases" size={14} />Lease Accounting</span>
            {screen === "leases" && <span className="ml-5 rounded-full bg-surface px-2 py-1.5 text-fg">Register</span>}
          </div>
          <div className="relative min-h-[330px] min-w-0 flex-1 p-4 sm:min-h-[360px] sm:p-6">
            <AnimatePresence mode="wait" initial={false} presenceAffectsLayout={false}>
              <motion.div key={screen} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
                {screen === "ecl" ? <EclScreen /> : <LeaseScreen />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
      <div className="absolute -bottom-px left-0 right-0 flex justify-center gap-2 pb-3">
        {SCREENS.map((s, n) => (
          <button key={s} type="button" aria-label={`Show ${s === "ecl" ? "ECL run" : "lease"} preview`} aria-pressed={n === i} onClick={() => setI(n)} className={cn("h-1.5 rounded-full transition-all duration-base", n === i ? "w-6 bg-fg" : "w-1.5 bg-line-strong")} />
        ))}
      </div>
    </div>
  );
}
