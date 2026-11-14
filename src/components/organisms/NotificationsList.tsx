import { cn } from "@/lib/cn";
import { Button } from "@/components/atoms/Button";
import type { Notification } from "@/types/domain";

const dot: Record<Notification["kind"], string> = { runs: "bg-accent", leases: "bg-accent", access: "bg-warning", workspace: "bg-fg-muted", security: "bg-negative" };

/** Notification rows: unread dot, title, meta, optional action. */
export function NotificationsList({ items }: { items: Notification[] }) {
  return (
    <ul className="flex flex-col divide-y divide-line">
      {items.map((n) => (
        <li key={n.id} className="flex items-start gap-3 py-3">
          <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-surface-active" : dot[n.kind])} />
          <div className="min-w-0 flex-1">
            <p className={cn("text-small", n.read ? "text-fg-muted" : "text-fg")}>{n.title}{!n.read && <span className="sr-only"> (unread)</span>}</p>
            <p className="text-micro text-fg-muted">{n.meta}</p>
          </div>
          {n.action && <Button variant="outline" size="sm">{n.action}</Button>}
        </li>
      ))}
    </ul>
  );
}
