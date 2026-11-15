"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Money } from "@/components/atoms/Numbers";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Switch } from "@/components/atoms/Switch";
import { Popover } from "@/components/molecules/Overlays";
import { SegmentedTabs, ToggleGroup } from "@/components/molecules/Tabs";
import { DataTable, TwoLine, type ColumnDef } from "@/components/organisms/DataTable";
import { FilterBar, type FilterValues } from "@/components/organisms/FilterBar";
import { States } from "@/components/organisms/StateView";
import { toast } from "@/components/organisms/Toaster";
import { download, toCsv } from "@/lib/csv";
import { date, money } from "@/lib/format";
import type { Lease, LeaseStatus } from "@/types/domain";
import type { Tone } from "@/types/ui";

export const LEASE_STATUS: Record<LeaseStatus, [Tone, string]> = { draft: ["neutral", "Draft"], submitted: ["info", "Submitted"], approved: ["positive", "Approved"], modified: ["info", "Modified"], expiring: ["warning", "Expiring"], terminated: ["neutral", "Terminated"] };
const VIEWS: [string, string, (l: Lease) => boolean][] = [["all", "All", () => true], ["active", "Active", (l) => ["approved", "modified", "expiring"].includes(l.status)], ["drafts", "Drafts", (l) => l.status === "draft"], ["submitted", "Submitted", (l) => l.status === "submitted"], ["expiring", "Expiring", (l) => l.status === "expiring"]];

/** LA-03 register: saved views, search, filters, density, columns, export, bulk bar, filtered total, save view. */
export function Register({ leases, view }: { leases: Lease[]; view: string }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState<FilterValues>({});
  const [density, setDensity] = useState("comfortable");
  const [saved, setSaved] = useState<string[]>([]);
  const [vName, setVName] = useState("Property expiring 2027");
  const rows = useMemo(() => leases.filter(VIEWS.find((v) => v[0] === view)?.[2] ?? (() => true)).filter((l) => (!q || `${l.id} ${l.name} ${l.counterparty} ${l.assetClass}`.toLowerCase().includes(q.toLowerCase())) && (!f.cls?.length || f.cls.includes(l.assetClass)) && (!f.status?.length || f.status.includes(l.status))), [leases, view, q, f]);
  const total = rows.reduce((a, l) => a + (l.liability ?? 0), 0);
  const cols: ColumnDef<Lease, unknown>[] = [
    { id: "lease", header: "Lease", accessorFn: (l) => l.name, cell: ({ row: { original: l } }) => <Link href={`/leases/register/${l.id}/summary`} className="hover:underline"><TwoLine title={l.name} meta={<span className="font-mono">{l.id}</span>} /></Link> },
    { id: "cp", header: "Counterparty", accessorFn: (l) => l.counterparty, cell: ({ row: { original: l } }) => <span className="text-fg-body">{l.counterparty}</span> },
    { id: "cls", header: "Asset class", accessorFn: (l) => l.assetClass, cell: ({ row: { original: l } }) => l.exempt ? <Badge>Exempt (low value)</Badge> : l.assetClass },
    { id: "start", header: "Commencement", accessorFn: (l) => l.start ?? "", cell: ({ row: { original: l } }) => (l.start ? date(l.start) : "-") },
    { id: "end", header: "End", accessorFn: (l) => l.end ?? "", cell: ({ row: { original: l } }) => (l.end ? date(l.end) : "-") },
    { id: "liab", header: "Liability", accessorFn: (l) => l.liability ?? 0, meta: { align: "right" }, cell: ({ row: { original: l } }) => (l.liability != null ? <Money value={l.liability} /> : "-") },
    { id: "status", header: "Status", accessorFn: (l) => l.status, cell: ({ row: { original: l } }) => <StatusPill tone={LEASE_STATUS[l.status][0]}>{LEASE_STATUS[l.status][1]}</StatusPill> },
  ];
  const exportRows = (list: Lease[]) => download("lease-register.csv", toCsv([["Lease ID", "Name", "Counterparty", "Asset class", "Commencement", "End", "Liability", "Status"], ...list.map((l) => [l.id, l.name, l.counterparty, l.assetClass, l.start ?? "", l.end ?? "", l.liability ?? "", LEASE_STATUS[l.status][1]])]));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedTabs label="Saved views" active={`/leases/register?view=${view}`} items={[...VIEWS.map(([id, label, p]) => ({ label, href: `/leases/register?view=${id}`, count: leases.filter(p).length })), ...saved.map((s) => ({ label: s, href: `/leases/register?view=all` }))]} />
        <Popover align="start" className="w-72" trigger={<Button variant="ghost" size="sm">+ Save view</Button>}>
          <div className="flex flex-col gap-3 p-2"><label className="flex flex-col gap-1.5 text-small text-fg-body">View name<Input value={vName} onChange={(e) => setVName(e.target.value)} /></label><Switch label="Share with workspace" defaultChecked /><Button size="sm" disabled={!vName.trim()} onClick={() => { setSaved((s) => [...s, vName.trim()]); toast.success(`View “${vName.trim()}” saved`); }}>Save view</Button></div>
        </Popover>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input wrapperClassName="w-full sm:w-72" leading={<Search />} placeholder="Search ID, counterparty, asset…" aria-label="Search leases" value={q} onChange={(e) => setQ(e.target.value)} />
        <FilterBar value={f} onChange={setF} filters={[{ key: "cls", label: "Asset class", options: ["Property", "Vehicles", "IT equipment", "Branch ATMs"].map((v) => ({ value: v, label: v })) }, { key: "status", label: "Status", options: (Object.keys(LEASE_STATUS) as LeaseStatus[]).map((s) => ({ value: s, label: LEASE_STATUS[s][1] })) }]} />
        <div className="ml-auto flex items-center gap-2"><ToggleGroup label="Density" value={density} onChange={setDensity} options={[{ value: "comfortable", label: "Comfortable" }, { value: "compact", label: "Compact" }]} /><Button size="sm" variant="secondary" onClick={() => exportRows(rows)}>Export</Button></div>
      </div>
      {rows.length ? (
        <DataTable caption="Lease register" data={rows} columns={cols} getRowId={(l) => l.id} selectable columnPicker pageSize={10} density={density as "compact"}
          selectionActions={(sel, clear) => <><Button size="sm" variant="secondary" onClick={() => { exportRows(sel); clear(); }}>Export</Button><Button size="sm" variant="secondary" disabled={!sel.every((l) => l.status === "draft")} disabledReason={sel.every((l) => l.status === "draft") ? undefined : "Only drafts can be submitted"} onClick={() => { toast.success(`${sel.length} leases submitted`); clear(); }}>Submit</Button></>} />
      ) : <States.Filtered onClear={() => { setF({}); setQ(""); }} />}
      <p className="text-right text-small text-fg-muted">Total liability (filtered) <span className="tabular-nums text-fg">{money(total)}</span></p>
    </div>
  );
}
