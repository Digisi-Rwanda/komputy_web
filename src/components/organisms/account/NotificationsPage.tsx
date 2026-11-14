"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Switch } from "@/components/atoms/Switch";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { toast } from "@/components/organisms/Toaster";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationRows } from "@/components/organisms/account/NotificationRows";

const group = (iso: string) => { const d = Math.floor((Date.parse(new Date().toISOString().slice(0, 10)) - Date.parse(iso.slice(0, 10))) / 864e5); return d <= 0 ? "Today" : d === 1 ? "Yesterday" : "Earlier"; };

/** NA1.2 full list grouped Today / Yesterday / Earlier with filters, mark read and mute. */
export function NotificationsPage() {
  const n = useNotifications();
  const [kind, setKind] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const list = n.items.filter((x) => (kind === "all" || x.kind === kind) && (!unreadOnly || !x.read) && !n.muted.includes(x.kind));
  const groups = ["Today", "Yesterday", "Earlier"].map((g) => [g, list.filter((x) => group(x.at) === g)] as const).filter(([, l]) => l.length);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup label="Filter" value={kind} onChange={setKind} options={[{ value: "all", label: "All" }, { value: "runs", label: "Runs" }, { value: "leases", label: "Leases" }, { value: "access", label: "Access" }, { value: "workspace", label: "Workspace" }]} />
        <Switch checked={unreadOnly} onCheckedChange={setUnreadOnly} label="Unread only" />
        <span className="ml-auto flex gap-2"><Button size="sm" variant="secondary" disabled={!n.unread} onClick={() => { n.markAllRead(); toast.success("All marked read"); }}>Mark all read</Button><Button asChild size="sm" variant="ghost"><Link href="/account/notifications">Preferences</Link></Button></span>
      </div>
      {n.muted.length > 0 && <p className="text-micro text-fg-muted">Muted: {n.muted.join(", ")} · {n.muted.map((k) => <button key={k} type="button" className="mr-2 text-link hover:underline" onClick={() => n.toggleMute(k)}>Unmute {k}</button>)}</p>}
      {groups.length === 0 ? <NotificationRows items={[]} onOpen={() => {}} /> : groups.map(([g, l]) => (
        <section key={g} className="flex flex-col"><h2 className="font-mono text-micro uppercase tracking-wider text-fg-muted">{g}</h2>
          <div className="rounded-panel border border-line px-4 mt-2"><NotificationRows items={[...l]} onOpen={n.markRead} onRead={n.markRead} onMute={(k) => { n.toggleMute(k); toast(`Muted ${k} notifications`, { action: { label: "Undo", onClick: () => n.toggleMute(k) } }); }} /></div>
        </section>))}
    </div>
  );
}
