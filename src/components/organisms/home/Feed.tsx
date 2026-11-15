import Link from "next/link";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { UPDATES } from "@/data/updates";
import { SERVICES } from "@/lib/services";
import { date } from "@/lib/format";
import type { AuditEvent } from "@/types/domain";

/** Recent activity (last events): compact rows with avatar and mono time. */
export function RecentActivity({ events }: { events: AuditEvent[] }) {
  return (
    <ul className="flex flex-col divide-y divide-line">
      {events.map((e) => (
        <li key={e.at + e.action} className="flex items-start gap-3 py-3">
          <Avatar initials={e.initials} size="sm" />
          <p className="min-w-0 flex-1 text-small text-fg-body"><span className="text-fg">{e.actor}</span> {e.action.charAt(0).toLowerCase() + e.action.slice(1)} <span className="font-mono text-micro text-fg">{e.object}</span></p>
          <time dateTime={e.at} className="shrink-0 font-mono text-micro text-fg-muted">{e.at.slice(5, 16).replace("T", " ")}</time>
        </li>
      ))}
    </ul>
  );
}

/** What's new: the two latest release notes. */
export function WhatsNew() {
  return (
    <ul className="flex flex-col gap-3">
      {UPDATES.slice(0, 2).map((u) => (
        <li key={u.id}><Link href={`/updates#${u.id}`} className="flex flex-col gap-1 rounded-card border border-line p-4 transition-colors hover:border-line-strong"><span className="flex items-center gap-2 text-small text-fg">{u.version} · {u.title}<Badge tone="info">New</Badge></span><span className="text-micro text-fg-muted">{date(u.date)} · {u.summary}</span></Link></li>
      ))}
    </ul>
  );
}

/** HM2 coming-soon strip. */
export function ComingSoon() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-small text-fg-muted">
      <span className="mr-2">Coming soon</span>
      {SERVICES.filter((s) => !s.live).map((s) => <Link key={s.id} href={`/services/${s.id}`} className="rounded-full border border-line px-3 py-1 text-micro opacity-60 transition-opacity hover:opacity-100">{s.name} · Join waitlist</Link>)}
    </div>
  );
}
