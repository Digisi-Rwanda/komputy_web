"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { IconButton } from "@/components/atoms/IconButton";
import { Icon } from "@/components/atoms/Icon";
import { Input } from "@/components/atoms/Input";
import { Money } from "@/components/atoms/Numbers";
import { MonoId } from "@/components/atoms/MonoId";
import { RunStatusPill, RUN_STATUS } from "@/components/atoms/StatusPill";
import { DropdownMenu } from "@/components/molecules/Overlays";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { DataTable, TwoLine, type ColumnDef } from "@/components/organisms/DataTable";
import { FilterBar, type FilterValues } from "@/components/organisms/FilterBar";
import { States } from "@/components/organisms/StateView";
import { toast } from "@/components/organisms/Toaster";
import { date, money } from "@/lib/format";
import { download, toCsv } from "@/lib/csv";
import type { Run } from "@/types/domain";

const STEP_SLUG = ["setup", "pd", "lgd", "ead", "review", "compute", "sign-off"];
const ago = (iso: string, now = Date.parse("2026-11-12T10:00:00Z")) => { const h = Math.round((now - Date.parse(iso)) / 36e5); return h < 24 ? `${Math.max(1, h)} h ago` : date(iso.slice(0, 10)); };
const exportRuns = (rows: Run[]) => download(`komputy-runs-${rows.length}.csv`, toCsv([["Run", "Name", "Reporting date", "Status", "Loans", "Total ECL USD", "Engine", "Created by"], ...rows.map((r) => [r.id, r.name, r.reportingDate, RUN_STATUS[r.status][1], r.loans, r.totalEcl ? r.totalEcl.toFixed(2) : "", r.engine, r.createdBy])]));

/** E3/E4 runs list: search, filters (status, year, creator), density, columns, export, bulk bar, row menu, failed-row details. */
export function RunsTable({ runs, loading }: { runs: Run[]; loading?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<FilterValues>({});
  const [density, setDensity] = useState("comfortable");
  const [open, setOpen] = useState<string[]>(runs.filter((r) => r.status === "failed").map((r) => r.id));

  const rows = useMemo(() => runs.filter((r) =>
    (!q || `${r.id} ${r.name} ${r.createdBy}`.toLowerCase().includes(q.toLowerCase())) &&
    (!filters.status?.length || filters.status.includes(r.status)) &&
    (!filters.year?.length || filters.year.includes(r.reportingDate.slice(0, 4))) &&
    (!filters.creator?.length || filters.creator.includes(r.createdBy))), [runs, q, filters]);

  const count = (k: keyof Run, v: string) => runs.filter((r) => String(r[k]) === v).length;
  const filterDefs = [
    { key: "status", label: "Status", options: (Object.keys(RUN_STATUS) as Run["status"][]).filter((s) => count("status", s)).map((s) => ({ value: s, label: RUN_STATUS[s][1], count: count("status", s) })) },
    { key: "year", label: "Reporting date", options: [...new Set(runs.map((r) => r.reportingDate.slice(0, 4)))].map((y) => ({ value: y, label: y, count: runs.filter((r) => r.reportingDate.startsWith(y)).length })) },
    { key: "creator", label: "Created by", options: [...new Set(runs.map((r) => r.createdBy))].map((c) => ({ value: c, label: c, count: count("createdBy", c) })) },
  ];

  const href = (r: Run) => (r.status === "computing" ? `/ecl/runs/new/compute?run=${r.id}` : r.step && r.status !== "failed" ? `/ecl/runs/new/${STEP_SLUG[r.step - 1]}?run=${r.id}` : `/ecl/runs/${r.id}/summary`);
  const columns: ColumnDef<Run, unknown>[] = [
    { id: "run", header: "Run", accessorFn: (r) => r.id, meta: { label: "Run" }, cell: ({ row: { original: r } }) => <Link href={href(r)} className="hover:underline"><TwoLine lead={<Icon name="ecl" />} title={<><MonoId>{r.id.slice(-6)}</MonoId> <span className="text-fg">{r.name}</span></>} meta={r.createdBy} /></Link> },
    { id: "date", header: "Reporting date", accessorFn: (r) => r.reportingDate, meta: { label: "Reporting date" }, cell: ({ row: { original: r } }) => date(r.reportingDate) },
    { id: "status", header: "Status", accessorFn: (r) => r.status, meta: { label: "Status" }, cell: ({ row: { original: r } }) => <span className="inline-flex items-center gap-2"><RunStatusPill status={r.status} />{r.step && r.status !== "failed" && <span className="text-micro text-fg-muted">Step {r.step}/7</span>}</span> },
    { id: "loans", header: "Loans", accessorFn: (r) => r.loans, meta: { align: "right", label: "Loans" }, cell: ({ row: { original: r } }) => r.loans.toLocaleString("en-US") },
    { id: "ecl", header: "Total ECL · USD", accessorFn: (r) => r.totalEcl, meta: { align: "right", label: "Total ECL" }, cell: ({ row: { original: r } }) => (r.totalEcl ? <Money value={r.totalEcl} /> : <span className="text-fg-muted">-</span>) },
    { id: "engine", header: "Engine", accessorFn: (r) => r.engine, meta: { label: "Engine" }, cell: ({ row: { original: r } }) => <MonoId>{r.engine}</MonoId> },
    { id: "updated", header: "Updated", accessorFn: (r) => r.updatedAt, meta: { label: "Updated" }, cell: ({ row: { original: r } }) => <span className="text-micro text-fg-muted">{ago(r.updatedAt)}</span> },
    { id: "actions", header: () => <span className="sr-only">Actions</span>, enableSorting: false, enableHiding: false, cell: ({ row: { original: r } }) => (
      <span className="flex justify-end gap-1">
        {r.status === "failed" && <IconButton size="sm" label={open.includes(r.id) ? "Hide failure details" : "Show failure details"} onClick={() => setOpen((o) => (o.includes(r.id) ? o.filter((x) => x !== r.id) : [...o, r.id]))}><ChevronDown className={open.includes(r.id) ? "rotate-180" : undefined} /></IconButton>}
        <DropdownMenu trigger={<IconButton size="sm" label={`Actions for ${r.id}`}><Icon name="more" /></IconButton>} items={[
          { label: "Open", onSelect: () => router.push(href(r)) },
          { label: "Duplicate as new run", onSelect: () => router.push(`/ecl/runs/new?from=${r.id}`) },
          { label: "Rerun", onSelect: () => router.push(`/ecl/runs/new?from=${r.id}&rerun=1`), disabled: r.status === "draft" },
          { label: "Compare with…", onSelect: () => router.push(`/ecl/compare?a=${r.id}`), disabled: !r.totalEcl },
          r.status === "draft" ? { label: "Delete draft", danger: true, separatorBefore: true, onSelect: () => toast(`Draft ${r.id} deleted`) } : { label: "Archive", separatorBefore: true, onSelect: () => toast(`${r.id} archived`), disabled: r.status === "archived" },
        ]} />
      </span>
    ) },
  ];

  if (!loading && runs.length === 0) return <States.NoRuns />;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input wrapperClassName="w-full sm:w-64" leading={<Search />} placeholder="Search runs" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search runs" />
        <FilterBar filters={filterDefs} value={filters} onChange={setFilters} />
        <div className="ml-auto flex items-center gap-2">
          <ToggleGroup label="Row density" value={density} onChange={setDensity} options={[{ value: "comfortable", label: "Comfortable" }, { value: "compact", label: "Compact" }]} />
          <Button variant="secondary" size="sm" icon={<Icon name="download" />} onClick={() => exportRuns(rows)}>Export</Button>
        </div>
      </div>
      {!loading && rows.length === 0 ? <States.Filtered onClear={() => { setFilters({}); setQ(""); }} /> : (
        <DataTable caption="ECL runs" data={rows} columns={columns} getRowId={(r) => r.id} loading={loading} selectable columnPicker pageSize={8} density={density as "compact"}
          expanded={(r) => r.failure && open.includes(r.id) ? (
            <div className="flex flex-wrap items-center gap-4">
              <AlertTriangle aria-hidden className="size-4 text-negative" />
              <p className="min-w-0 flex-1 text-small text-fg">{r.failure.message} <span className="block font-mono text-micro text-fg-muted">Ref {r.failure.ref}</span></p>
              <Button size="sm" variant="secondary" onClick={() => router.push("/ecl/runs/new/ead")}>Edit inputs</Button>
              <Button size="sm" onClick={() => toast.success(`${r.id} queued to retry`)}>Retry</Button>
            </div>
          ) : null}
          selectionActions={(sel, clear) => (
            <>
              <Button size="sm" variant="secondary" disabled={sel.length !== 2} disabledReason={sel.length !== 2 ? "Select exactly two runs to compare" : undefined} onClick={() => router.push(`/ecl/compare?a=${sel[0].id}&b=${sel[1].id}`)}>Compare</Button>
              <Button size="sm" variant="secondary" onClick={() => { exportRuns(sel); clear(); }}>Export</Button>
              <Button size="sm" variant="secondary" onClick={() => { toast(`${sel.length} runs archived`); clear(); }}>Archive</Button>
            </>
          )} />
      )}
      <p className="text-micro text-fg-muted">{rows.length} of {runs.length} runs · total shown {money(rows.reduce((a, r) => a + r.totalEcl, 0))} USD</p>
    </div>
  );
}
