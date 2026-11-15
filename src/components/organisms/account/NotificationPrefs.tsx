"use client";
import { Fragment, useState } from "react";
import { Lock } from "lucide-react";
import { Select } from "@/components/atoms/Select";
import { Switch } from "@/components/atoms/Switch";
import { Tooltip } from "@/components/molecules/Overlays";
import { saveNotificationPrefs } from "@/lib/actions/notifications";
import { toast } from "@/components/organisms/Toaster";
import { DEFAULTS, EVENT_GROUPS, isLocked, type EventRow } from "@/lib/notify-events";

type Row = EventRow;
const GROUPS = EVENT_GROUPS;
const locked = (_g: string, r: Row, ch: "app" | "email") => isLocked(r[0], ch);

/** NA2 preference matrix: in-app and email per event; locked cells explain why. */
export function NotificationPrefs({ saved, digest }: { saved: Record<string, boolean>; digest: string }) {
  // Defaults from the design, overridden by what this person saved.
  const [v, setV] = useState<Record<string, boolean>>(() => ({ ...DEFAULTS, ...saved }));
  const cell = (g: string, r: Row, ch: "app" | "email") => {
    const id = `${r[0]}:${ch}`, label = `${r[1]} · ${ch === "app" ? "in app" : "email"}`;
    if (locked(g, r, ch)) return <Tooltip content={r[4] ?? "Required"}><span className="inline-flex items-center gap-1.5 text-micro text-fg-muted"><Lock className="size-3.5" />On</span></Tooltip>;
    return <Switch aria-label={label} checked={v[id]} onCheckedChange={async (on) => { setV((x) => ({ ...x, [id]: on })); const r = await saveNotificationPrefs({ cell: id, on }); if (!r.ok) { setV((x) => ({ ...x, [id]: !on })); toast.error(r.error); } else toast.success(`${label}: ${on ? "on" : "off"}`); }} />;
  };
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="relative overflow-x-auto rounded-panel border border-line"><table className="w-full min-w-[520px] text-small"><caption className="sr-only">Notification preferences</caption>
        <thead><tr className="border-b border-line text-fg-muted"><th scope="col" className="px-4 py-2.5 text-left font-normal">Event</th><th scope="col" className="w-24 px-4 py-2.5 text-left font-normal">In app</th><th scope="col" className="w-24 px-4 py-2.5 text-left font-normal">Email</th></tr></thead>
        <tbody>{GROUPS.map(([g, rows]) => <Fragment key={g}><tr><th scope="rowgroup" colSpan={3} className="bg-raised px-4 py-2 text-left font-mono text-micro font-normal uppercase tracking-wider text-fg-muted">{g}</th></tr>
          {rows.map((r) => <tr key={r[0]} className="border-t border-line"><th scope="row" className="px-4 py-3 text-left font-normal"><span className="block text-fg">{r[1]}</span>{r[4] && <span className="block text-micro text-fg-muted">{r[4]}</span>}</th><td className="px-4">{cell(g, r, "app")}</td><td className="px-4">{cell(g, r, "email")}</td></tr>)}</Fragment>)}</tbody></table></div>
      <label className="flex flex-col gap-1.5 text-small text-fg-body">Email digest<Select defaultValue={digest} wrapperClassName="w-60" onChange={async (e) => { const text = e.target.selectedOptions[0].text; const r = await saveNotificationPrefs({ digest: e.target.value as "off" | "daily" | "weekly" }); if (r.ok) toast.success(`Digest: ${text}`); else toast.error(r.error); }}><option value="off">Off</option><option value="daily">Daily 08:00</option><option value="weekly">Weekly Monday</option></Select><span className="text-micro text-fg-muted">Bundles everything not marked urgent into one email.</span></label>
    </div>
  );
}
