"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { StatusPill } from "@/components/atoms/StatusPill";
import { ProgressBar } from "@/components/molecules/Progress";
import { StatCard } from "@/components/molecules/StatCard";
import { Timestamp } from "@/components/molecules/Timestamp";
import { toast } from "@/components/organisms/Toaster";
import { remindMfa, resendInvite } from "@/lib/actions/members";
import type { adminOverview } from "@/server/dal/workspace-admin";

type Overview = Awaited<ReturnType<typeof adminOverview>>;

/** CA1: state first, then what to act on. Only row actions are interactive. */
export function AdminOverview({ data }: { data: Overview }) {
  const router = useRouter();
  const { stats, cards, attention, audit } = data;
  const run = async (p: Promise<{ ok: boolean; error?: string }>, ok: string) => { const r = await p; if (!r.ok) toast.error(r.error ?? "Couldn't do that."); else { toast.success(ok); router.refresh(); } };
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Members" value={String(stats.members)} meta={stats.invites ? `${stats.invites} pending invite${stats.invites > 1 ? "s" : ""}` : "No pending invites"} />
        <StatCard label="Services" value={`${stats.services.length} active`} meta={stats.services.map((s) => `${s.id === "ecl" ? "ECL" : "Leases"}${s.state === "Trial" ? " (trial)" : ""}`).join(" · ") || "None yet"} />
        <StatCard label="MFA coverage" value={`${stats.mfaPct} %`} dot={stats.noMfa ? "bg-warning" : "bg-positive"} meta={stats.noMfa ? `${stats.noMfa} member${stats.noMfa > 1 ? "s" : ""} without MFA` : "Everyone protected"} />
        <StatCard label="Requests" value={`${stats.requests} open`} meta="From members" />
      </div>
      <section className="flex flex-col gap-3"><h2 className="text-h4">Usage this period</h2>
        {cards.length === 0 ? <p className="text-small text-fg-muted">No services yet. <Link href="/admin/services" className="text-link hover:underline">Request access →</Link></p> : (
        <ul className="divide-y divide-line rounded-panel border border-line">
          {cards.map((s) => { const [label, used, max] = s.meters[0]; return (
            <li key={s.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] md:items-center">
              <span className="flex items-center gap-3"><span className="inline-flex size-9 items-center justify-center rounded-full bg-surface text-fg-muted"><Icon name={s.id === "ecl" ? "ecl" : "leases"} /></span><span className="text-small text-fg">{s.name.replace(/ \(.*\)/, "")}</span><StatusPill tone={s.tone}>{s.state}</StatusPill></span>
              <span className="flex flex-col gap-1.5"><span className="flex justify-between text-micro text-fg-muted"><span>{label}</span><span className="font-mono">{used} / {max}</span></span><ProgressBar value={used} max={max || 1} label={label} tone={max && used / max >= 0.8 ? "warning" : undefined} /></span>
              <span className="text-micro text-fg-muted">{s.dates}{s.state === "Trial" && <> · <Link href="/admin/services" className="text-link hover:underline">Request access →</Link></>}</span>
            </li>); })}
        </ul>)}
      </section>
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-3"><h2 className="text-h4">Needs your attention</h2>
          {attention.length === 0 ? <p className="rounded-panel border border-line px-4 py-6 text-center text-small text-fg-muted">Nothing needs your attention.</p> : (
          <ul className="divide-y divide-line rounded-panel border border-line">{attention.map((a) => (
            <li key={a.title} className="flex items-center gap-3 px-4 py-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-fg-muted"><Icon name={a.icon} /></span>
              <span className="min-w-0 flex-1"><span className="block text-small text-fg">{a.title}</span><span className="block text-micro text-fg-muted">{a.meta}</span></span>
              {a.href ? <Button asChild size="sm" variant="secondary"><Link href={a.href}>{a.action}</Link></Button>
                : <Button size="sm" variant="secondary" onClick={() => a.membershipIds ? run(remindMfa({ membershipIds: a.membershipIds }), "MFA reminder sent") : run(resendInvite({ invitationId: a.invitationId! }), "Invite resent · expires in 7 days")}>{a.action}</Button>}
            </li>))}</ul>)}
        </section>
        <section className="flex flex-col gap-3"><div className="flex items-center justify-between"><h2 className="text-h4">Recent admin activity</h2><Link href="/admin/audit-log" className="text-small text-link hover:underline">Audit log →</Link></div>
          <ul className="divide-y divide-line rounded-panel border border-line">{audit.map((e) => (
            <li key={e.at + e.action} className="flex items-center gap-3 px-4 py-3 text-small"><Avatar initials={e.initials} size="sm" /><span className="min-w-0 flex-1 truncate text-fg-body"><span className="text-fg">{e.actor}</span> {e.action.toLowerCase()} <span className="font-mono text-micro">{e.object}</span></span><span className="text-micro text-fg-muted"><Timestamp iso={e.at} /></span></li>))}</ul>
        </section>
      </div>
    </div>
  );
}
