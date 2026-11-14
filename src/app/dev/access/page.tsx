import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Clock } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Logo } from "@/components/atoms/Logo";
import { Banner } from "@/components/molecules/Banner";
import { ProgressCircle, ProgressBar } from "@/components/molecules/Progress";
import { AccessNotice, ReadOnly } from "@/components/organisms/access/AccessNotice";
import { GraceChip, QuotaGate } from "@/components/organisms/access/Quota";
import { StateMachine } from "@/components/organisms/access/StateMachine";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Access states", robots: { index: false } };

const marker = { none: <Lock className="size-2.5" />, requested: <Clock className="size-2.5" />, trial: "bg-warning", ended: "bg-fg-muted", active: null, suspended: "bg-negative", expired: "bg-fg-muted", quota: "bg-warning" } as const;
const Rows = () => <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => <div key={i} className="flex justify-between rounded-md border border-line px-3 py-2 text-micro text-fg-body"><span>RUN-014{2 - i}</span><span className="tabular-nums">12,846,210.55</span></div>)}</div>;

function Frame({ n, title, m, children }: { n: number; title: string; m: keyof typeof marker; children: React.ReactNode }) {
  const mk = marker[m];
  return (
    <section aria-label={title} className="flex overflow-hidden rounded-panel border border-line">
      <div className="flex w-16 shrink-0 flex-col items-center gap-3 border-r border-line bg-sidebar py-4">
        <span className="relative inline-flex size-9 items-center justify-center rounded-card bg-surface text-fg"><Icon name="ecl" />
          {mk && (typeof mk === "string" ? <span className={cn("absolute right-1 top-1 size-1.5 rounded-full", mk)} /> : <span className="absolute -bottom-1 -right-1 rounded-full bg-raised p-0.5 text-fg-muted">{mk}</span>)}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <p className="label-mono">{n} · {title}</p>
        <p className="text-small text-fg">Expected Credit Loss</p>
        {children}
      </div>
    </section>
  );
}

// AC4 board: one service across all eight access states, plus the state machine.
export default function AccessStatesPage() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-site flex-col gap-8 px-4 py-10 lg:px-6">
      <header className="flex items-center gap-4"><Logo /><span className="label-mono">AC4 · access states</span></header>
      <div className="grid gap-4 md:grid-cols-2">
        <Frame n={1} title="None" m="none"><p className="text-small text-fg-muted">Expected Credit Loss isn&apos;t active.</p><div className="flex gap-2"><Button asChild size="sm"><Link href="/locked/ecl">Start 14-day trial</Link></Button><Button size="sm" variant="secondary">Request access</Button></div></Frame>
        <Frame n={2} title="Requested" m="requested"><AccessNotice state="requested" info={{ requestedAt: "11 Nov 2026", ref: "REQ-0193" }} /></Frame>
        <Frame n={3} title="Trial" m="trial"><Banner tone="warning">Trial · 3 of 5 runs left · 9 days</Banner><div className="flex items-center gap-4"><ProgressCircle value={3} max={5} size={56} label="Trial runs left" tone="warning"><span className="font-mono text-micro text-fg">3/5</span></ProgressCircle><Rows /></div></Frame>
        <Frame n={4} title="Trial ended" m="ended"><AccessNotice state="trial-expired" info={{ trialEndedAt: "2 Nov 2026" }} /><ReadOnly><Rows /></ReadOnly></Frame>
        <Frame n={5} title="Active" m="active"><div className="flex items-start gap-4"><div className="flex-1"><Rows /></div><div className="w-40 rounded-card border border-line p-3 text-micro text-fg-muted">Runs this quarter<p className="mb-2 font-mono text-fg">18 / 40</p><ProgressBar value={18} max={40} label="Runs this quarter" /></div></div></Frame>
        <Frame n={6} title="Suspended" m="suspended"><AccessNotice state="suspended" info={{ reason: "contract ended 31 Oct 2026" }} /><ReadOnly><Rows /></ReadOnly></Frame>
        <Frame n={7} title="Expired" m="expired"><AccessNotice state="expired" info={{ expiredAt: "31 Oct 2026", archiveAt: "29 Jan 2027" }} /><ReadOnly><Rows /></ReadOnly></Frame>
        <Frame n={8} title="Quota reached" m="quota"><div className="flex items-start justify-between gap-4"><div className="flex flex-col gap-2 text-micro text-fg-muted">Runs this quarter<span className="font-mono text-fg">40 / 40</span><span className="flex items-center gap-2">RUN-0143 <GraceChip /></span></div><QuotaGate used={40} limit={40}><Button>New run</Button></QuotaGate></div></Frame>
      </div>
      <StateMachine />
    </main>
  );
}
