import Link from "next/link";
import { Icon, type IconName } from "@/components/atoms/Icon";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Button } from "@/components/atoms/Button";
import type { AttentionItem } from "@/types/domain";

const ICON: Record<AttentionItem["service"], IconName> = { ecl: "ecl", leases: "leases", workspace: "users" };

/** HM1 unified inbox: table on desktop, stacked rows on phones (no horizontal scroll). One click to act. */
export function Attention({ items }: { items: AttentionItem[] }) {
  if (!items.length) return <p className="rounded-panel border border-line p-6 text-center text-small text-fg-muted">Nothing needs your attention. Nice.</p>;
  return (
    <ul className="divide-y divide-line rounded-panel border border-line">
      {items.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-fg-muted"><Icon name={ICON[a.service]} /></span>
          <Link href={a.href} className="min-w-0 flex-1 basis-48 hover:underline"><span className="block truncate text-small text-fg">{a.title}</span><span className="block truncate text-micro text-fg-muted">{a.meta}</span></Link>
          <StatusPill tone={a.status[0]}>{a.status[1]}</StatusPill>
          <span className="w-10 shrink-0 text-right font-mono text-micro text-fg-muted">{a.age}</span>
          <Button asChild size="sm" variant={a.action === "Review" ? "primary" : "secondary"}><Link href={a.href}>{a.action}</Link></Button>
        </li>
      ))}
    </ul>
  );
}
