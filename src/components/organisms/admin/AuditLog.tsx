"use client";
import { Fragment, useState } from "react";
import { ChevronRight, Download, Search } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { MetaChip } from "@/components/atoms/Chip";
import { Input } from "@/components/atoms/Input";
import { FilterBar, type FilterValues } from "@/components/organisms/FilterBar";
import { StateView } from "@/components/organisms/StateView";
import { cn } from "@/lib/cn";
import { download, toCsv } from "@/lib/csv";
import type { AuditEvent } from "@/types/domain";

type Row = AuditEvent & { staff?: boolean };
const ts = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "UTC" }).replace(",", "");
const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h.toString(16).padStart(8, "0"); };

/** CA8 workspace audit log: filter, search, expand for before/after detail, CSV export. */
export function AuditLog({ events, initialQuery = "" }: { events: Row[]; initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery);
  const [f, setF] = useState<FilterValues>({});
  const [open, setOpen] = useState<string | null>(events[3]?.at ?? null);
  const uniq = (k: keyof Row) => [...new Set(events.map((e) => String(e[k])))].map((v) => ({ value: v, label: v, count: events.filter((e) => String(e[k]) === v).length }));
  const list = events.filter((e) => (e.actor + e.action + e.object).toLowerCase().includes(q.toLowerCase()) && (["actor", "service", "action"] as const).every((k) => !f[k]?.length || f[k].includes(e[k])));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <MetaChip>1 Oct – 11 Nov 2026</MetaChip>
        <FilterBar value={f} onChange={setF} filters={[{ key: "actor", label: "Person", options: uniq("actor") }, { key: "service", label: "Service", options: uniq("service") }, { key: "action", label: "Action", options: uniq("action") }]} />
        <label className="relative w-full sm:w-56"><span className="sr-only">Search audit log</span><Search className="pointer-events-none absolute left-3 z-10 top-1/2 size-4 -translate-y-1/2 text-fg-muted" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="rounded-full pl-9" /></label>
        <Button variant="secondary" className="ml-auto" icon={<Download />} onClick={() => download("audit-log-2026-11.csv", toCsv([["Timestamp (UTC)", "Actor", "Action", "Object", "Service"], ...list.map((e) => [e.at, e.actor, e.action, e.object, e.service])]))}>Export CSV</Button>
      </div>
      {list.length === 0 ? <StateView icon="audit" title="No events match" description="Try a wider date range or clear the filters." /> : (
        <div className="relative overflow-x-auto rounded-panel border border-line">
          <table className="w-full min-w-[860px] text-small"><caption className="sr-only">Audit events</caption>
            <thead><tr className="border-b border-line text-fg-muted"><th scope="col" className="w-8" /><th scope="col" className="px-3 py-2.5 text-left font-normal">Timestamp · UTC</th>{["Actor", "Action", "Object", "Service", "IP"].map((h) => <th key={h} scope="col" className="px-3 py-2.5 text-left font-normal">{h}</th>)}</tr></thead>
            <tbody>{list.map((e) => { const o = open === e.at; return (
              <Fragment key={e.at}>
                <tr className="cursor-pointer border-b border-line hover:bg-surface/50" onClick={() => setOpen(o ? null : e.at)}>
                  <td className="pl-3"><button type="button" aria-expanded={o} aria-label={`Details for ${e.action}`} className="inline-flex size-6 items-center justify-center rounded-full hover:bg-surface"><ChevronRight className={cn("size-4 text-fg-muted transition-transform", o && "rotate-90")} /></button></td>
                  <td className="px-3 py-3 font-mono text-micro text-fg-body">{ts(e.at)}</td>
                  <td className="px-3"><span className="flex items-center gap-2"><Avatar initials={e.initials} size="xs" /><span className="text-fg">{e.actor}</span>{e.staff && <Badge tone="info" mono>STAFF</Badge>}</span></td>
                  <td className="px-3 text-fg-body">{e.action}</td>
                  <td className="px-3"><span className="rounded-full bg-surface px-2 py-0.5 font-mono text-micro text-fg">{e.object}</span></td>
                  <td className="px-3 text-fg-muted">{e.service}</td>
                  <td className="px-3 font-mono text-micro text-fg-muted">{hash(e.at).slice(0, 4)}…{hash(e.actor).slice(-3)}</td>
                </tr>
                {o && <tr className="border-b border-line"><td colSpan={7} className="px-4 pb-4"><pre className="overflow-x-auto rounded-card bg-raised p-4 font-mono text-micro leading-relaxed text-fg-body">{JSON.stringify({ request_id: `req_${hash(e.at + e.object)}`, action: e.action, object: e.object, ...(e.object.includes("→") ? { before: e.object.split(": ")[1]?.split(" → ")[0], after: e.object.split(" → ")[1] } : {}), user_agent: "Chrome 131 · Windows 11", ip: `${hash(e.at).slice(0, 4)}…${hash(e.actor).slice(-3)} (hashed)` }, null, 2)}</pre></td></tr>}
              </Fragment>); })}</tbody>
          </table>
        </div>
      )}
      <p className="text-micro text-fg-muted">Showing {list.length} of 1,284 events · Retained for 7 years</p>
    </div>
  );
}
