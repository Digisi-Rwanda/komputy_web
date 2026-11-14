"use client";
import Link from "next/link";
import { useState } from "react";
import { Bell } from "lucide-react";
import { Popover } from "@/components/molecules/Overlays";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationRows } from "@/components/organisms/account/NotificationRows";

/** NA1.1 bell popover: filter, mark all read, rows link to their object, "View all". */
export function NotificationBell({ className }: { className: string }) {
  const n = useNotifications();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("all");
  const list = n.items.filter((x) => (kind === "all" || x.kind === kind) && !n.muted.includes(x.kind));
  return (
    <Popover open={open} onOpenChange={setOpen} align="end" className="w-[min(420px,calc(100vw-16px))] p-0"
      trigger={<button type="button" aria-label={`Notifications, ${n.unread} unread`} className={`${className} relative`}><Bell className="size-4" />{n.unread > 0 && <span aria-hidden className="absolute right-1.5 top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-negative px-1 text-[10px] leading-4 text-white">{n.unread}</span>}</button>}>
      <div className="flex items-center justify-between px-4 pb-2 pt-3"><h2 className="text-small text-fg">Notifications</h2><button type="button" disabled={!n.unread} onClick={n.markAllRead} className="text-micro text-link hover:underline disabled:text-fg-subtle disabled:no-underline">Mark all read</button></div>
      <div className="px-3 pb-2"><ToggleGroup label="Filter notifications" value={kind} onChange={setKind} options={[{ value: "all", label: "All" }, { value: "runs", label: "Runs" }, { value: "leases", label: "Leases" }, { value: "access", label: "Access" }]} /></div>
      <div className="max-h-[360px] overflow-y-auto px-4"><NotificationRows items={list} onOpen={(id) => { n.markRead(id); setOpen(false); }} /></div>
      <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-line px-4 py-3 text-small text-link hover:underline">View all notifications →</Link>
    </Popover>
  );
}
