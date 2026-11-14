import { Avatar } from "@/components/atoms/Avatar";
import type { AuditEvent } from "@/types/domain";

/** Vertical audit trail: time, avatar, sentence, object id. */
export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  return (
    <ol className="relative flex flex-col gap-5 border-l border-line pl-6">
      {events.map((e) => (
        <li key={e.at + e.action} className="relative flex flex-col gap-1 text-small sm:flex-row sm:items-start sm:gap-3">
          <span aria-hidden className="absolute -left-[29px] top-1.5 size-2.5 rounded-full border-2 border-canvas bg-fg-muted" />
          <time dateTime={e.at} className="shrink-0 pt-0.5 font-mono text-micro text-fg-muted sm:w-32">{e.at.slice(0, 16).replace("T", " ")}</time>
          <Avatar initials={e.initials} size="sm" className="hidden sm:inline-flex" />
          <span className="min-w-0 flex-1 text-fg-body"><span className="text-fg">{e.actor}</span> {e.action.charAt(0).toLowerCase() + e.action.slice(1)} <span className="font-mono text-micro text-fg">{e.object}</span></span>
        </li>
      ))}
    </ol>
  );
}
