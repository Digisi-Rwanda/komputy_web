import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Money, Delta } from "@/components/atoms/Numbers";
import { StatusPill } from "@/components/atoms/StatusPill";
import { HeroMetric, StatCard } from "@/components/molecules/StatCard";
import { ProgressBar } from "@/components/molecules/Progress";
import { Section } from "@/components/organisms/PageHeader";
import { Waterfall } from "@/components/organisms/Waterfall";
import { date, money } from "@/lib/format";
import { leaseData } from "@/data/mock/index";

const O = leaseData.overview;
const ATTENTION = [
  ["LSE-0142 Nyarutarama branch renewal", "Submitted by Eric Uwase", "info", "Awaiting approval", "2 h", "/leases/inbox"],
  ["Rate curve Oct 2026", "Setup change", "info", "Awaiting approval", "1 d", "/leases/inbox"],
  ["LSE-0087 Kigali Heights — Floor 4", "Option decision due 15 Nov 2026", "warning", "Due soon", "4 d", "/leases/register/LSE-0087/summary"],
  ["Import IMP-0031", "7 rows with errors", "negative", "Needs fixing", "1 d", "/leases/imports?step=validate"],
] as const;

/** LA-02 overview. */
export function LeasesOverview() {
  const total = O.byClass.reduce((a, [, v]) => a + v, 0);
  return (
    <>
      <HeroMetric label="Total lease liability · 31 Oct 2026" currency="USD" value={<Money value={O.liability} />} delta={<Delta value={O.deltaVsSep} suffix=" vs Sep" goodWhenUp />} sub={`${O.active} active leases · ${O.entities} entities`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="ROU assets" value={money(O.rou)} meta="USD" />
        <StatCard label="Current liability" value={money(O.current)} meta="Due < 12 months" />
        <StatCard label="Payments due in 30 days" value={money(O.due30)} meta={`${O.due30Count} leases`} />
        <StatCard label="Expiring in 12 months" value={`${O.expiring12} leases`} dot="bg-warning" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Section title="Liability roll-forward · YTD 2026"><div className="rounded-panel border border-line p-5"><Waterfall title="Liability roll-forward YTD 2026" steps={O.rollForward} increaseIsBad={false} /></div></Section>
        <Section title="Liability by asset class">
          <ul className="flex flex-col gap-4 rounded-panel border border-line p-5">{O.byClass.map(([k, v]) => (
            <li key={k} className="flex flex-col gap-1.5"><span className="flex justify-between text-small"><span className="text-fg">{k}</span><span className="tabular-nums text-fg-body"><Money value={v} /> <span className="text-fg-muted">· {((v / total) * 100).toFixed(1)} %</span></span></span><ProgressBar value={v} max={total} label={k} tone="accent" /></li>
          ))}</ul>
        </Section>
      </div>
      <Section title="October close" actions={<Button asChild variant="link" size="sm"><Link href="/leases/close">Continue close →</Link></Button>}>
        <ol className="flex flex-wrap items-center gap-2 rounded-panel border border-line p-4 text-small">
          {[["Started", "done"], ["Issues 2", "warn"], ["Journals", "next"], ["Payments", ""], ["Review", ""], ["Lock", ""]].map(([l, s], i) => (
            <li key={l} className="flex items-center gap-2">{i > 0 && <span aria-hidden className="h-px w-6 bg-line-strong" />}<StatusPill tone={s === "done" ? "positive" : s === "warn" ? "warning" : s === "next" ? "info" : "neutral"}>{l}{s === "done" && " ✓"}</StatusPill></li>
          ))}
          <li className="ml-auto flex -space-x-2">{["AM", "EU", "JH"].map((x) => <Avatar key={x} initials={x} size="sm" className="ring-2 ring-canvas" />)}</li>
        </ol>
      </Section>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Section title="Needs attention">
          <ul className="divide-y divide-line rounded-panel border border-line">{ATTENTION.map(([t, m, tone, st, age, href]) => (
            <li key={t}><Link href={href} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-surface/60"><span className="inline-flex size-8 items-center justify-center rounded-full bg-surface text-fg-muted"><Icon name="leases" size={14} /></span><span className="min-w-0 flex-1"><span className="block truncate text-small text-fg">{t}</span><span className="block text-micro text-fg-muted">{m}</span></span><StatusPill tone={tone}>{st}</StatusPill><span className="w-8 text-right font-mono text-micro text-fg-muted">{age}</span></Link></li>
          ))}</ul>
        </Section>
        <Section title="Upcoming expiries">
          <ul className="divide-y divide-line rounded-panel border border-line">{O.expiries.map(([id, n, cp, end, liab]) => (
            <li key={id} className="flex flex-wrap items-center gap-3 px-4 py-3"><span className="min-w-0 flex-1"><span className="block text-small text-fg">{n}</span><span className="block text-micro text-fg-muted">{cp} · ends {date(end)} · <Money value={liab} /></span></span><Link href={`/leases/register/${id}/summary`} className="inline-flex items-center gap-1 text-micro text-link hover:underline">Review renewal<ArrowRight className="size-3" /></Link></li>
          ))}</ul>
        </Section>
      </div>
    </>
  );
}
