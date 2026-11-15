"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Money } from "@/components/atoms/Numbers";
import { StatusPill } from "@/components/atoms/StatusPill";
import { HeroMetric, StatCard } from "@/components/molecules/StatCard";
import { ProgressBar } from "@/components/molecules/Progress";
import { Section } from "@/components/organisms/PageHeader";
import { Waterfall } from "@/components/organisms/Waterfall";
import { date, money } from "@/lib/format";
import { useLeaseData } from "@/components/organisms/leases/LeaseData";


/** LA-02 overview. */
export function LeasesOverview() {
  const leaseData = useLeaseData();
  const O = leaseData.overview;
  const total = O.byClass.reduce((a, [, v]) => a + v, 0);
  const cur = leaseData.currency, label = new Date(`${leaseData.period}-01T00:00:00`).toLocaleString("en-GB", { month: "long", year: "numeric" });
  const close = leaseData.close as null | { period: string; steps: { id: string; status: string }[] };
  const attention = [
    ...leaseData.inbox.map((i) => [i.title, i.meta, "info", "Awaiting approval", i.age, "/leases/inbox"] as const),
    ...leaseData.mySubmissions.filter((m) => m.returnComment).map((m) => [m.title, `Returned: “${m.returnComment}”`, "warning", "Returned", m.age, `/leases/register/${m.lease}/summary`] as const),
    ...leaseData.imports.filter(([, , , st]) => st === "needs_fixing").map(([id, f]) => [`Import ${id}`, `${f} has rows with errors`, "negative", "Needs fixing", "", "/leases/imports"] as const),
    ...leaseData.register.filter((r) => r.verificationFailed).map((r) => [`${r.id} ${r.name}`, "Stored schedule no longer matches its inputs", "negative", "Check", "", `/leases/register/${r.id}/summary`] as const),
  ].slice(0, 8);
  return (
    <>
      <HeroMetric label={`Total lease liability · ${label}`} currency={cur} value={<Money value={O.liability} />} sub={`${O.active} active leases · ${O.entities} entit${O.entities === 1 ? "y" : "ies"}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="ROU assets" value={money(O.rou)} meta={cur} />
        <StatCard label="Current liability" value={money(O.current)} meta="Due < 12 months" />
        <StatCard label="Payments due in 30 days" value={money(O.due30)} meta={`${O.due30Count} leases`} />
        <StatCard label="Expiring in 12 months" value={`${O.expiring12} leases`} dot="bg-warning" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Section title="Liability roll-forward · financial year to date"><div className="rounded-panel border border-line p-5"><Waterfall title="Liability roll-forward, financial year to date" steps={O.rollForward} increaseIsBad={false} /></div></Section>
        <Section title="Liability by asset class">
          <ul className="flex flex-col gap-4 rounded-panel border border-line p-5">{O.byClass.map(([k, v]) => (
            <li key={k} className="flex flex-col gap-1.5"><span className="flex justify-between text-small"><span className="text-fg">{k}</span><span className="tabular-nums text-fg-body"><Money value={v} /> <span className="text-fg-muted">· {((v / total) * 100).toFixed(1)} %</span></span></span><ProgressBar value={v} max={total} label={k} tone="accent" /></li>
          ))}</ul>
        </Section>
      </div>
      <Section title={`${close ? close.period : label} close`} actions={<Button asChild variant="link" size="sm"><Link href="/leases/close">{close ? "Continue close →" : "Start close →"}</Link></Button>}>
        <ol className="flex flex-wrap items-center gap-2 rounded-panel border border-line p-4 text-small">
          {(close?.steps ?? [{ id: "not started", status: "todo" }]).map((st, i) => (
            <li key={st.id} className="flex items-center gap-2">{i > 0 && <span aria-hidden className="h-px w-6 bg-line-strong" />}<StatusPill tone={st.status === "done" ? "positive" : st.status === "warning" ? "warning" : st.status === "todo" ? "info" : "neutral"}>{st.id}{st.status === "done" && " ✓"}</StatusPill></li>
          ))}
        </ol>
      </Section>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Section title="Needs attention">
          <ul className="divide-y divide-line rounded-panel border border-line">{attention.map(([t, m, tone, st, age, href]) => (
            <li key={t}><Link href={href} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-surface/60"><span className="inline-flex size-8 items-center justify-center rounded-full bg-surface text-fg-muted"><Icon name="leases" size={14} /></span><span className="min-w-0 flex-1"><span className="block truncate text-small text-fg">{t}</span><span className="block text-micro text-fg-muted">{m}</span></span><StatusPill tone={tone}>{st}</StatusPill><span className="w-8 text-right font-mono text-micro text-fg-muted">{age}</span></Link></li>
          ))}{!attention.length && <li className="px-4 py-6 text-center text-small text-fg-muted">Nothing needs your attention.</li>}</ul>
        </Section>
        <Section title="Upcoming expiries">
          <ul className="divide-y divide-line rounded-panel border border-line">{O.expiries.map(([id, n, cp, end, liab]) => (
            <li key={id} className="flex flex-wrap items-center gap-3 px-4 py-3"><span className="min-w-0 flex-1"><span className="block text-small text-fg">{n}</span><span className="block text-micro text-fg-muted">{cp} · ends {date(end)} · <Money value={liab} /></span></span><Link href={`/leases/register/${id}/summary`} className="inline-flex items-center gap-1 text-micro text-link hover:underline">Review renewal<ArrowRight className="size-3" /></Link></li>
          ))}{!O.expiries.length && <li className="px-4 py-6 text-center text-small text-fg-muted">No leases end in the next 12 months.</li>}</ul>
        </Section>
      </div>
    </>
  );
}
