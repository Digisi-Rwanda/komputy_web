"use client";
import { useState } from "react";
import { CheckCircle2, Circle, Download, FileText } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Waterfall } from "@/components/organisms/Waterfall";
import { toast } from "@/components/organisms/Toaster";
import { download, toCsv } from "@/lib/csv";
import { money } from "@/lib/format";
import { leaseData } from "@/data/mock/index";

const CARDS = [["rollforward", "Liability roll-forward", "Opening to closing, by movement"], ["maturity", "Maturity analysis", "Undiscounted cash flows by band"], ["disclosure", "IFRS 16 disclosure pack", "Note 14 tables with paragraph checklist"]] as const;

/** LC-05 lease reports: index, roll-forward waterfall, maturity, Note 14 disclosure pack. */
export function LeaseReports() {
  const [open, setOpen] = useState<string>("rollforward");
  const O = leaseData.overview, M = leaseData.maturity, D = leaseData.disclosure;
  const mTotal = M.reduce((s, [, v]) => s + v, 0);
  const [ticked, setTicked] = useState(D.paragraphs.slice(0, 7));
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">{CARDS.map(([id, t, d]) => <button key={id} type="button" aria-pressed={open === id} onClick={() => setOpen(id)} className={`flex flex-col gap-1 rounded-panel border p-4 text-left ${open === id ? "border-fg" : "border-line hover:border-line-strong"}`}><FileText className="size-4 text-fg-muted" /><span className="text-small text-fg">{t}</span><span className="text-micro text-fg-muted">{d}</span></button>)}</div>
      {open === "rollforward" && <section className="flex flex-col gap-3"><Waterfall title="Lease liability roll-forward · Jan–Oct 2026" steps={O.rollForward} increaseIsBad={false} />
        <Button size="sm" variant="secondary" className="w-fit" icon={<Download />} onClick={() => download("lease-rollforward-2026-10.csv", toCsv([["Movement", "USD"], ...O.rollForward.map((s) => [s.label, s.value])]))}>Download CSV</Button></section>}
      {open === "maturity" && <section className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3"><h2 className="text-h4">Undiscounted cash flows</h2>
          {M.map(([band, v]) => <div key={band} className="flex items-center gap-3 text-small"><span className="w-16 text-fg-muted">{band}</span><span className="h-3 flex-1 rounded-full bg-surface"><span className="block h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${(v / mTotal) * 100}%` }} /></span><span className="w-28 text-right tabular-nums">{money(v)}</span></div>)}
          <p className="text-micro text-fg-muted">Total {money(mTotal)} · discounted {money(O.liability)}</p></div>
        <div className="flex flex-col gap-3"><h2 className="text-h4">Current / non-current</h2>
          <table className="text-small tabular-nums"><caption className="sr-only">Current and non-current split</caption><tbody>{[["Current", O.current], ["Non-current", O.nonCurrent], ["Total", O.liability]].map(([k, v]) => <tr key={k} className="border-t border-line"><th scope="row" className="py-2 text-left font-normal text-fg-body">{k}</th><td className="text-right">{money(v as number)}</td></tr>)}</tbody></table></div>
      </section>}
      {open === "disclosure" && <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex flex-col gap-4"><h2 className="text-h4">Note 14 — Leases</h2>
          <div className="relative overflow-x-auto"><table className="w-full min-w-[460px] text-small tabular-nums"><caption className="sr-only">ROU assets by class</caption>
            <thead><tr className="text-fg-muted">{["Class", "Carrying amount", "Depreciation"].map((h, k) => <th key={h} scope="col" className={`py-1.5 font-normal ${k ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
            <tbody>{D.rouByClass.map(([c, a, d]) => <tr key={c} className="border-t border-line"><td className="py-2">{c}</td><td className="text-right">{money(a)}</td><td className="text-right">{money(d)}</td></tr>)}</tbody></table></div>
          <p className="text-small text-fg-body">Total cash outflow for leases: <span className="tabular-nums text-fg">{money(D.cashOutflow)}</span></p>
          <Button className="w-fit" icon={<Download />} disabled={ticked.length < D.paragraphs.length} disabledReason={`${D.paragraphs.length - ticked.length} paragraphs not reviewed`} onClick={() => toast.success("Note 14 pack exported (.docx + .xlsx)")}>Export disclosure pack</Button></div>
        <aside className="flex h-fit flex-col gap-2 rounded-panel border border-line p-4"><p className="text-small text-fg">IFRS 16 checklist · {ticked.length}/{D.paragraphs.length}</p>
          {D.paragraphs.map((p) => { const on = ticked.includes(p); return <button key={p} type="button" aria-pressed={on} onClick={() => setTicked((t) => (on ? t.filter((x) => x !== p) : [...t, p]))} className="flex items-center gap-2 text-left text-small text-fg-body">{on ? <CheckCircle2 className="size-4 text-positive" /> : <Circle className="size-4 text-fg-subtle" />}¶ {p}</button>; })}</aside>
      </section>}
    </div>
  );
}
