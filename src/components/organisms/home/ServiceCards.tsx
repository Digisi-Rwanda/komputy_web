import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Icon } from "@/components/atoms/Icon";
import { ServiceStatePill } from "@/components/atoms/StatusPill";
import { Delta } from "@/components/atoms/Numbers";
import { ProgressBar } from "@/components/molecules/Progress";
import { compact } from "@/lib/format";
import type { Entitlement, Run } from "@/types/domain";

const card = "flex min-w-0 flex-col gap-4 rounded-panel border border-line p-6";
const Meter = ({ e }: { e: Entitlement }) => e.quota ? (
  <div className="flex flex-col gap-1.5 text-micro text-fg-muted"><span className="flex justify-between"><span>{e.state === "trial" ? "Trial " : ""}{e.quota.unit}</span><span className="font-mono tabular-nums text-fg-body">{e.quota.used} / {e.quota.limit}</span></span><ProgressBar value={e.quota.used} max={e.quota.limit} label={e.quota.unit} /></div>
) : null;

/** HM1/HM2 ECL card: latest signed-off total, delta, stage bar, quota, New run. */
export function EclCard({ e, run, sample }: { e: Entitlement; run?: Run; sample?: boolean }) {
  return (
    <section aria-labelledby="ecl-card" className={card}>
      <header className="flex items-center gap-3"><span className="inline-flex size-9 items-center justify-center rounded-card bg-surface"><Icon name="ecl" /></span><h2 id="ecl-card" className="flex-1 text-h4">Expected Credit Loss</h2><ServiceStatePill state={e.state} /></header>
      {run ? (
        <>
          <p className="text-small text-fg-muted">Latest signed-off run · <span className="font-mono">{run.id}</span>{sample && <Badge mono tone="info" className="ml-2">Sample</Badge>}</p>
          <p className="flex flex-wrap items-baseline gap-3"><span className="text-h2 tracking-[-0.03em] text-fg tabular-nums">USD {compact(run.totalEcl)}</span><Delta value={run.deltaVsPrior} suffix=" vs Aug" /></p>
          <div role="img" aria-label={run.stages.map((s) => `Stage ${s.stage} ${(s.share * 100).toFixed(0)}%`).join(", ")} className="flex h-2 overflow-hidden rounded-full">
            {run.stages.map((s) => <span key={s.stage} className={`bg-stage-${s.stage}`} style={{ width: `${s.share * 100}%` }} />)}
          </div>
        </>
      ) : <p className="py-6 text-small text-fg-muted">No runs yet.</p>}
      <Meter e={e} />
      <div className="mt-auto flex flex-wrap items-center gap-4"><Button asChild><Link href="/ecl/runs/new">New run</Link></Button><Link href="/ecl/results" className="text-small text-link hover:underline">Open results →</Link></div>
    </section>
  );
}

/** HM1 Leases card: liability, ROU, close progress, quota, Continue close. */
export function LeasesCard({ e, summary }: { e: Entitlement; summary?: { liability: number; rou: number; close: { label: string; step: number; of: number } } }) {
  return (
    <section aria-labelledby="leases-card" className={card}>
      <header className="flex items-center gap-3"><span className="inline-flex size-9 items-center justify-center rounded-card bg-surface"><Icon name="leases" /></span><h2 id="leases-card" className="flex-1 text-h4">Lease Accounting</h2><ServiceStatePill state={e.state} /></header>
      {summary ? (
        <>
          <dl className="grid grid-cols-2 gap-4">
            <div><dt className="text-micro text-fg-muted">Total lease liability</dt><dd className="text-h3 text-fg tabular-nums">USD {compact(summary.liability)}</dd></div>
            <div><dt className="text-micro text-fg-muted">ROU assets</dt><dd className="text-h3 text-fg tabular-nums">USD {compact(summary.rou)}</dd></div>
          </dl>
          <Badge className="w-fit">{summary.close.label} · step {summary.close.step} of {summary.close.of}</Badge>
        </>
      ) : <p className="py-6 text-small text-fg-muted">No leases yet.</p>}
      <Meter e={e} />
      <div className="mt-auto"><Button asChild variant="secondary"><Link href="/leases/close">Continue close</Link></Button></div>
    </section>
  );
}

/** HM2 compact upsell card for a service the workspace doesn't have. */
export function LockedCard({ id, name, standard, line }: { id: string; name: string; standard: string; line: string }) {
  return (
    <section className={`${card} justify-between`}>
      <header className="flex items-center gap-3"><span className="inline-flex size-9 items-center justify-center rounded-card bg-surface text-fg-muted"><Lock className="size-4" /></span><h2 className="flex-1 text-h4">{name} <span className="text-fg-muted">· {standard}</span></h2></header>
      <p className="text-small text-fg-muted">{line}</p>
      <div className="flex flex-wrap gap-2"><Button asChild size="sm"><Link href={`/locked/${id}`}>Start 14-day trial</Link></Button><Button asChild size="sm" variant="ghost"><Link href={`/services/${id}`}>Learn more</Link></Button></div>
    </section>
  );
}
