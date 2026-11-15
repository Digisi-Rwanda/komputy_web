"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Money, PD } from "@/components/atoms/Numbers";
import { StagePill } from "@/components/atoms/StatusPill";
import { Breadcrumb } from "@/components/molecules/Breadcrumb";
import { DataTable, TwoLine, type ColumnDef } from "@/components/organisms/DataTable";
import { FilterBar, type FilterValues } from "@/components/organisms/FilterBar";
import { States } from "@/components/organisms/StateView";
import { download, toCsv } from "@/lib/csv";
import type { LoanRow } from "@/types/domain";

/** R2 loan-level results: portfolio › segment, filters (stage, segment, capped), search, CSV export, open loan. */
/** Loan results. `rows` is the first page from the engine (keyset-paginated); `total` the full count for the run. */
export function LoanTable({ rows, runId, total }: { rows: LoanRow[]; runId: string; total?: number }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState<FilterValues>({});
  const seg = f.segment?.length === 1 ? f.segment[0] : undefined;
  const list = useMemo(() => rows.filter((r) => (!q || `${r.id} ${r.customer}`.toLowerCase().includes(q.toLowerCase())) && (!f.segment?.length || f.segment.includes(r.segment)) && (!f.stage?.length || f.stage.includes(String(r.stage))) && (!f.flag?.length || (f.flag.includes("capped") && r.capped))), [rows, q, f]);
  const cols: ColumnDef<LoanRow, unknown>[] = [
    { id: "loan", header: "Loan", accessorFn: (r) => r.id, cell: ({ row: { original: r } }) => <TwoLine title={<span className="font-mono text-micro">{r.id}</span>} meta={r.customer} /> },
    { id: "stage", header: "Stage", accessorFn: (r) => r.stage, cell: ({ row: { original: r } }) => <StagePill stage={r.stage} /> },
    { id: "out", header: "Outstanding", accessorFn: (r) => r.outstanding, meta: { align: "right" }, cell: ({ row: { original: r } }) => <Money value={r.outstanding} /> },
    { id: "ead", header: "EAD", accessorFn: (r) => r.ead, meta: { align: "right" }, cell: ({ row: { original: r } }) => <Money value={r.ead} /> },
    { id: "pd", header: "PD (lifetime)", accessorFn: (r) => r.pd, meta: { align: "right" }, cell: ({ row: { original: r } }) => <PD value={r.pd} /> },
    { id: "lgd", header: "LGD", accessorFn: (r) => r.lgd, meta: { align: "right" }, cell: ({ row: { original: r } }) => `${(r.lgd * 100).toFixed(1)} %` },
    { id: "ecl", header: "ECL", accessorFn: (r) => r.ecl, meta: { align: "right" }, cell: ({ row: { original: r } }) => <span className="text-fg"><Money value={r.ecl} /></span> },
    { id: "flags", header: "Flags", enableSorting: false, cell: ({ row: { original: r } }) => (r.capped ? <Badge tone="warning">Capped</Badge> : <span className="text-fg-subtle">None</span>) },
    { id: "open", header: () => <span className="sr-only">Open</span>, enableSorting: false, cell: ({ row: { original: r } }) => <Link href={`/ecl/results?segment=${r.segment}&loan=${r.id}&run=${runId}`} aria-label={`Open loan ${r.id}`} className="inline-flex items-center gap-1 text-micro text-link hover:underline">Open<ArrowRight className="size-3" /></Link> },
  ];
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb items={[{ label: "Portfolio", href: `/ecl/runs/${runId}/results` }, ...(seg ? [{ label: seg }] : [])]} />
      {total != null && total > rows.length && <p className="text-micro text-fg-muted">Showing the first {rows.length.toLocaleString("en-US")} of {total.toLocaleString("en-US")} loans. Download the loan detail workbook from Outputs for all of them.</p>}
      <div className="flex flex-wrap items-center gap-2">
        <FilterBar value={f} onChange={setF} filters={[
          { key: "stage", label: "Stage", options: [1, 2, 3].map((s) => ({ value: String(s), label: `Stage ${s}` })) },
          { key: "segment", label: "Segment", options: [...new Set(rows.map((r) => r.segment))].sort().map((s) => ({ value: s, label: s })) },
          { key: "flag", label: "Flags", options: [{ value: "capped", label: "Capped" }] },
        ]} />
        <Input wrapperClassName="w-full sm:w-56 sm:ml-auto" leading={<Search />} placeholder="Find loan" aria-label="Find loan" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button size="sm" variant="secondary" onClick={() => download(`${runId}-loans.csv`, toCsv([["Loan", "Customer", "Segment", "Stage", "Outstanding", "EAD", "PD 12m", "LGD", "ECL", "Capped"], ...list.map((r) => [r.id, r.customer, r.segment, r.stage, r.outstanding, r.ead, r.pd, r.lgd, r.ecl, r.capped ? "yes" : ""])]))}>Export CSV</Button>
      </div>
      {list.length ? <DataTable caption="Loan results" data={list} columns={cols} getRowId={(r) => r.id} pageSize={10} /> : <States.Filtered onClear={() => { setF({}); setQ(""); }} />}
      <p className="text-micro text-fg-muted">Showing {list.length.toLocaleString("en-US")} of {(total ?? rows.length).toLocaleString("en-US")} loans. Every loan is in Loan detail.xlsx (Outputs).</p>
    </div>
  );
}
