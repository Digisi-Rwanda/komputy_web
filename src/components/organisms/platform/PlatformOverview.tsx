import Link from "next/link";
import { LiveDot } from "@/components/atoms/LiveDot";
import { StatCard } from "@/components/molecules/StatCard";
import { TrialActions } from "@/components/organisms/platform/TrialActions";
import { day } from "@/components/organisms/platform/shared";
import type { platformOverview } from "@/server/dal/platform";
import type { Probe } from "@/server/health";

type Data = Awaited<ReturnType<typeof platformOverview>>;

/** PA1: counts and metadata only. */
export function HealthList({ probes }: { probes: Probe[] }) {
  return <>{probes.map((h) => <p key={h.name} className="flex items-center justify-between gap-3 text-small"><span className="text-fg-body">{h.name}</span><span className={`flex items-center gap-2 ${h.ok ? "text-fg" : "text-negative"}`}>{h.ok ? <LiveDot /> : <span className="size-2 rounded-full bg-negative" />}{h.value}</span></p>)}</>;
}

export function PlatformOverview({ data, health }: { data: Data; health: React.ReactNode }) {
  const max = Math.max(1, ...data.adoption.map((a) => a[1]));
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.stats.map(([l, v, m, d]) => <StatCard key={l} label={l} value={v} meta={m || undefined} dot={d || undefined} />)}</div>
      <section className="flex flex-col gap-4 rounded-panel border border-line p-5"><h2 className="text-h4">Service adoption</h2>
        {data.adoption.map(([n, c, s]) => <div key={n} className="flex flex-col gap-1.5"><span className="flex justify-between text-small"><span className="text-fg">{n}</span><span className="font-mono text-fg-body">{c} workspaces</span></span><span className="h-2 rounded-full bg-surface"><span className="block h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${(c / max) * 100}%` }} /></span><span className="text-micro text-fg-muted">{s}</span></div>)}
        <p className="border-t border-line pt-3 text-micro text-fg-muted">Waitlist: {data.waitlist.length ? data.waitlist.map(([n, c]) => `${n} ${c}`).join(" · ") : "no sign-ups yet"}</p>
      </section>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="flex flex-col gap-3"><h2 className="text-h4">Trials ending soon</h2>
          {data.trials.length === 0 ? <p className="rounded-panel border border-line px-4 py-6 text-center text-small text-fg-muted">No trials end in the next 7 days.</p> : (
          <ul className="divide-y divide-line rounded-panel border border-line">{data.trials.map((w) => { const svc = w.services.find((s) => s[1] === "trial")?.[0]; const u = w.usage.find((x) => x[0] === (svc === "ECL" ? "runs" : "leases")); return (
            <li key={w.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-small">
              <span className="min-w-0 flex-1"><Link href={`/platform/workspaces/${w.id}/summary`} className="text-fg hover:underline">{w.name}</Link><span className="block text-micro text-fg-muted">{svc} · ends {day(w.trialEnds!)}{u && ` · limit ${u[2]} ${u[0]}`}</span></span>
              <TrialActions ws={w.name} tenantId={w.id} service={svc === "ECL" ? "ecl" : "leases"} />
            </li>); })}</ul>)}
        </section>
        <section className="flex h-fit flex-col gap-2 rounded-panel border border-line p-5"><div className="flex items-center justify-between"><h2 className="text-h4">System health</h2><Link href="/platform/health" className="text-micro text-link hover:underline">Details →</Link></div>
          {health}
        </section>
      </div>
    </div>
  );
}
