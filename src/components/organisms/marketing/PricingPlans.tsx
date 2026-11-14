"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { cn } from "@/lib/cn";
import { ADDONS, COMPARISON, PLANS } from "@/data/pricing";

/** Package cards with Monthly/Annual switch + add-ons strip. */
export function PlanCards() {
  const [annual, setAnnual] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <ToggleGroup label="Billing period" value={annual ? "annual" : "monthly"} onChange={(v) => setAnnual(v === "annual")} options={[{ value: "monthly", label: "Monthly" }, { value: "annual", label: "Annual · save 2 months" }]} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => (
          <li key={p.id} className={cn("relative flex flex-col gap-3 rounded-panel border p-6", p.featured ? "border-fg bg-raised" : "border-line")}>
            {p.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-micro font-medium text-primary-fg">Most popular</span>}
            <h3 className="text-h4">{p.name}</h3>
            <p className="text-micro text-fg-muted">{p.tagline}</p>
            <p className="text-h3 font-medium text-fg">{p.price} <span className="text-small font-normal text-fg-muted">{p.unit}</span></p>
            <p className="min-h-5 text-micro text-link">{annual && p.annualNote}</p>
            <ul className="flex flex-1 flex-col gap-2">{p.features.map((f) => <li key={f} className="flex items-start gap-2 text-small text-fg-body"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-positive" />{f}</li>)}</ul>
            <Button asChild variant={p.featured || p.id === "trial" ? "primary" : "outline"} className="mt-2 w-full"><Link href={p.cta.href}>{p.cta.label}</Link></Button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card border border-line px-5 py-4 text-small">
        <span className="text-fg">Add-ons</span>
        {ADDONS.map((a) => <span key={a.name} className="text-fg-muted"><span className="text-fg-body">{a.name}</span> · {a.note}</span>)}
      </div>
    </div>
  );
}

const cell = (v: boolean | string) => v === true ? <Check aria-label="Included" className="mx-auto size-4 text-positive" /> : v === false ? <Minus aria-label="Not included" className="mx-auto size-4 text-fg-subtle" /> : <span className="text-micro text-fg-body">{v}</span>;

/** Features × packages. Desktop: table with sticky header. Phones: one package at a time (no sideways scroll). */
export function Comparison() {
  const [col, setCol] = useState(2);
  return (
    <>
      <div className="md:hidden">
        <ToggleGroup label="Package" value={String(col)} onChange={(v) => setCol(Number(v))} options={PLANS.map((p, i) => ({ value: String(i), label: p.name.split(" ")[0] }))} className="mb-4 max-w-full overflow-x-auto" />
        {COMPARISON.map((g) => (
          <dl key={g.group} className="mb-6">
            <dt className="label-mono mb-2">{g.group}</dt>
            {g.rows.map(([f, ...v]) => <dd key={f} className="flex items-center justify-between gap-4 border-b border-line py-2.5 text-small text-fg-body"><span>{f}</span>{cell(v[col])}</dd>)}
          </dl>
        ))}
      </div>
      <table className="hidden w-full text-small md:table">
        <caption className="sr-only">Package comparison</caption>
        <thead className="sticky top-16 z-[1] bg-canvas">
          <tr className="border-b border-line">
            <th scope="col" className="py-3 text-left font-normal text-fg-muted">Feature</th>
            {PLANS.map((p) => <th key={p.id} scope="col" className={cn("py-3 text-center font-medium", p.featured ? "text-fg" : "text-fg-body")}>{p.name}</th>)}
          </tr>
        </thead>
        {COMPARISON.map((g) => (
          <tbody key={g.group}>
            <tr><th scope="rowgroup" colSpan={5} className="label-mono pb-2 pt-6 text-left">{g.group}</th></tr>
            {g.rows.map(([f, ...v]) => (
              <tr key={f} className="border-b border-line">
                <th scope="row" className="py-3 text-left font-normal text-fg-body">{f}</th>
                {v.map((x, i) => <td key={i} className={cn("py-3 text-center", PLANS[i].featured && "bg-raised")}>{cell(x)}</td>)}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </>
  );
}
