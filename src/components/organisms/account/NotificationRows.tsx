"use client";
import Link from "next/link";
import { AlertTriangle, BellOff, Check, CheckCircle2, FileText, UserPlus, XCircle } from "lucide-react";
import { Tooltip } from "@/components/molecules/Overlays";
import { StateView } from "@/components/organisms/StateView";
import { cn } from "@/lib/cn";
import type { Notification } from "@/types/domain";

export const HREF: Record<string, string> = { n1: "/ecl/runs/RUN-0141/summary", n2: "/leases/register/LSE-0087/summary", n3: "/admin/services", n4: "/ecl/runs/RUN-0136/summary", n5: "/admin/members" };
const icon = (n: Notification) => n.title.includes("failed") ? <XCircle className="size-4 text-negative" /> : n.kind === "access" ? <AlertTriangle className="size-4 text-warning" /> : n.kind === "workspace" ? <UserPlus className="size-4" /> : n.title.includes("approved") ? <CheckCircle2 className="size-4 text-positive" /> : <FileText className="size-4" />;

/** Shared rows for popover and page: unread dot, icon, title/meta; optional hover actions. */
export function NotificationRows({ items, onOpen, onRead, onMute }: { items: Notification[]; onOpen: (id: string) => void; onRead?: (id: string) => void; onMute?: (k: Notification["kind"]) => void }) {
  if (!items.length) return <StateView icon="check-circle" title="You're all caught up" description="Nothing new here." className="py-8" />;
  return (
    <ul className="divide-y divide-line">{items.map((n) => (
      <li key={n.id} className="group relative flex items-start gap-3 py-3">
        <span aria-hidden className={cn("mt-3 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-accent")} />
        <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface", n.read ? "text-fg-subtle" : "text-fg-muted")}>{icon(n)}</span>
        <Link href={n.href ?? HREF[n.id] ?? "/notifications"} onClick={() => onOpen(n.id)} className="min-w-0 flex-1 after:absolute after:inset-0">
          <span className={cn("block text-small", n.read ? "text-fg-muted" : "text-fg")}>{n.title}{!n.read && <span className="sr-only"> (unread)</span>}</span>
          <span className="block text-micro text-fg-muted">{n.meta}</span>
        </Link>
        {n.action && <span className="relative z-10 shrink-0 self-center rounded-full border border-line px-2.5 py-1 text-micro text-fg-body">{n.action}</span>}
        {(onRead || onMute) && <span className="relative z-10 flex shrink-0 gap-1 self-center opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          {onRead && !n.read && <Tooltip content="Mark read"><button type="button" aria-label={`Mark "${n.title}" read`} onClick={() => onRead(n.id)} className="inline-flex size-8 items-center justify-center rounded-full hover:bg-surface"><Check className="size-4" /></button></Tooltip>}
          {onMute && <Tooltip content="Mute this type"><button type="button" aria-label={`Mute ${n.kind} notifications`} onClick={() => onMute(n.kind)} className="inline-flex size-8 items-center justify-center rounded-full hover:bg-surface"><BellOff className="size-4" /></button></Tooltip>}
        </span>}
      </li>))}
    </ul>
  );
}
