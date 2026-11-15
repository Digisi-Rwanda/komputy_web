"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Lock, X } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { IconButton } from "@/components/atoms/IconButton";
import { Icon } from "@/components/atoms/Icon";
import { Input } from "@/components/atoms/Input";
import { NumberInput } from "@/components/atoms/NumberInput";
import { Select } from "@/components/atoms/Select";
import { Switch } from "@/components/atoms/Switch";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Banner } from "@/components/molecules/Banner";
import { Field, FormSection } from "@/components/molecules/Field";
import { Tooltip } from "@/components/molecules/Overlays";
import { DataTable, type ColumnDef } from "@/components/organisms/DataTable";
import { Sheet } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { compact, date } from "@/lib/format";
import { saveCollateral, saveSegment, saveThresholds } from "@/lib/actions/ecl";
import { SERVICE_PAGES, type LiveServicePage } from "@/data/services";
import { SaveBar } from "@/components/molecules/SaveBar";
import { showCode } from "@/lib/code";

export interface Segment { id?: string; name: string; active: boolean; loans: number; source: "manual" | "data"; firstSeen?: string; updated: string }
export interface CollateralType { id?: string; name: string; haircut: number; months: number; usedUsd: number; active: boolean }
export type { ThresholdRow } from "@/lib/ecl-setup";
export interface Threshold { id: string; key: string; label: string; description: string; value: number; def: number; unit: "months" | "count" | "percent"; group: string }


const Intro = ({ children }: { children: React.ReactNode }) => <p className="max-w-3xl text-small text-fg-muted">{children}</p>;

/** E5 segments: table + edit drawer with rename warning. Changes batch until "Save changes". */
export function SegmentsSetup({ initial, canEdit = true }: { initial: Segment[]; canEdit?: boolean }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [edit, setEdit] = useState<Segment | null>(null);
  const [draft, setDraft] = useState<Segment | null>(null);
  const rows = initial;
  const open = (s: Segment | null) => { setEdit(s); setDraft(s ?? { name: "", active: true, loans: 0, source: "manual", updated: new Date().toISOString().slice(0, 10) }); };
  const nameErr = !draft ? undefined : (draft.name.trim().length < 2 ? "Enter a name (2+ characters)." : rows.some((r) => r !== edit && r.name.toLowerCase() === draft.name.trim().toLowerCase()) ? "A segment with this name exists." : undefined);
  const save = () => start(async () => {
    const r = await saveSegment({ id: edit?.id, name: draft!.name.trim(), active: draft!.active });
    if (!r.ok) { toast.error(r.error); return; }
    toast.success(edit ? "Segment saved" : "Segment added", { description: "Applies to new runs. Past runs are not affected." }); setDraft(null); router.refresh();
  });
  const cols: ColumnDef<Segment, unknown>[] = [
    { id: "name", header: "Name", accessorFn: (s) => s.name, cell: ({ row: { original: s } }) => <span className="text-fg">{s.name}</span> },
    { id: "status", header: "Status", accessorFn: (s) => s.active, cell: ({ row: { original: s } }) => <StatusPill tone={s.active ? "positive" : "neutral"}>{s.active ? "Active" : "Inactive"}</StatusPill> },
    { id: "loans", header: "Used in runs", accessorFn: (s) => s.loans, meta: { align: "right" }, cell: ({ row: { original: s } }) => s.loans.toLocaleString("en-US") },
    { id: "source", header: "Source", accessorFn: (s) => s.source, cell: ({ row: { original: s } }) => s.source === "data" ? <Badge tone="info">From data</Badge> : <span className="text-fg-muted">Manual</span> },
    { id: "updated", header: "Added", accessorFn: (s) => s.updated, cell: ({ row: { original: s } }) => <span className="text-micro text-fg-muted">{date(s.updated)}</span> },
    { id: "edit", header: () => <span className="sr-only">Edit</span>, enableSorting: false, cell: ({ row: { original: s } }) => canEdit ? <span className="flex justify-end"><Button size="sm" variant="ghost" onClick={() => open(s)}>Edit</Button></span> : null },
  ];
  return (
    <div className="flex flex-col gap-5">
      <Intro>Segments group loans for PD transition matrices. Names must match the SEGMENT column in your PD file. Segments found in your data are added automatically.</Intro>
      {canEdit && <div className="flex justify-end"><Button variant="secondary" icon={<Icon name="plus" />} onClick={() => open(null)}>Add segment</Button></div>}
      <DataTable caption="Segments" data={rows} columns={cols} getRowId={(s) => s.id ?? s.name} />
      <Sheet open={draft !== null} onOpenChange={(v) => !v && setDraft(null)} title={edit ? `Edit segment · ${edit.name}` : "Add segment"}
        footer={<><Button variant="ghost" onClick={() => setDraft(null)}>Discard</Button><Button loading={busy} disabled={Boolean(nameErr)} onClick={save}>Save</Button></>}>
        {draft && (
          <div className="flex flex-col gap-5">
            <Field label="Name" id="seg-name" error={nameErr}><Input value={draft.name} maxLength={100} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
            {edit && <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} label="Active" description="Inactive segments are ignored in new runs." />}
            {edit && draft.name !== edit.name && <Banner tone="warning">Renaming changes how future PD files are matched. Past runs are not affected.</Banner>}
          </div>
        )}
      </Sheet>
    </div>
  );
}

/** E6 collateral types with inline edit; haircut entered as percent with a guard for fractions ("0.5" → did you mean 50 %?). */
export function CollateralSetup({ initial, canEdit = true }: { initial: CollateralType[]; canEdit?: boolean }) {
  const router = useRouter();
  const rows = initial;
  const [adding, setAdding] = useState(false), [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [h, setH] = useState(""), [m, setM] = useState("");
  const pct = Number(h);
  const guard = h !== "" && pct > 0 && pct < 1 ? `Did you mean ${Math.round(pct * 100)} %?` : undefined;
  const invalid = h === "" || Number.isNaN(pct) || pct < 0 || pct > 100 || m === "" || Number(m) < 0 || !Number.isInteger(Number(m));
  const start = (c: CollateralType) => { setEditing(c.id ?? c.name); setH(String(+(c.haircut * 100).toFixed(2))); setM(String(c.months)); };
  const save = async () => {
    const c = rows.find((x) => (x.id ?? x.name) === editing);
    const r = await saveCollateral({ id: c?.id, name: adding ? name.trim() : c!.name, haircutPct: pct, months: Number(m) });
    if (!r.ok) { toast.error(r.error); return; }
    toast.success(adding ? `${name.trim()} added` : `${c!.name} updated`); setEditing(null); setAdding(false); setName(""); router.refresh();
  };
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex min-w-0 flex-col gap-4">
        <Intro>Haircut and time to realise discount each collateral type in LGD. Column names must match the collateral sheet.</Intro>
        {canEdit && !adding && <div className="flex justify-end"><Button variant="secondary" icon={<Icon name="plus" />} onClick={() => { setAdding(true); setEditing("__new"); setH("0"); setM("12"); }}>Add collateral type</Button></div>}
        <div className="relative overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[640px] text-small">
            <caption className="sr-only">Collateral types</caption>
            <thead><tr className="border-b border-line text-fg-muted">{["Collateral type", "Haircut", "Time to realise", "Used in last run", "Status", ""].map((x, i) => <th key={i} scope="col" className={`h-10 px-4 font-normal ${i > 0 && i < 4 ? "text-right" : "text-left"}`}>{x || <span className="sr-only">Actions</span>}</th>)}</tr></thead>
            <tbody>
              {[...rows, ...(adding ? [{ id: "__new", name: "", haircut: 0, months: 0, usedUsd: 0, active: true }] : [])].map((c) => editing === (c.id ?? c.name) ? (
                <tr key={c.name} className="border-b border-line bg-raised">
                  <td className="px-4 py-3 text-fg">{c.id === "__new" ? <Input aria-label="Collateral type name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="e.g. Property" /> : c.name}</td>
                  <td className="px-4 py-3"><div className="ml-auto w-28"><Input aria-label="Haircut percent" numeric value={h} onChange={(e) => setH(e.target.value)} trailing="%" invalid={Boolean(guard)} />{guard && <button type="button" onClick={() => setH(String(Math.round(pct * 100)))} className="mt-1 text-micro text-warning underline">{guard}</button>}</div></td>
                  <td className="px-4 py-3"><div className="ml-auto w-28"><Input aria-label="Months to realise" numeric value={m} onChange={(e) => setM(e.target.value)} trailing="mo" /></div></td>
                  <td className="px-4 py-3 text-right text-fg-muted">None</td>
                  <td className="px-4 py-3"><StatusPill tone="positive">Active</StatusPill></td>
                  <td className="px-4 py-3"><span className="flex justify-end gap-1"><IconButton size="sm" variant="secondary" label="Save" disabled={invalid || (c.id === "__new" && name.trim().length < 2)} onClick={() => void save()}><Check /></IconButton><IconButton size="sm" label="Cancel" onClick={() => { setEditing(null); setAdding(false); }}><X /></IconButton></span></td>
                </tr>
              ) : (
                <tr key={c.name} className="border-b border-line last:border-0">
                  <td className="h-row px-4 text-fg">{c.name}</td>
                  <td className="px-4 text-right tabular-nums">{Math.round(c.haircut * 100)} %</td>
                  <td className="px-4 text-right tabular-nums">{c.months} months</td>
                  <td className="px-4 text-right tabular-nums text-fg-body">{c.usedUsd ? compact(c.usedUsd) : "None"}</td>
                  <td className="px-4"><StatusPill tone={c.active ? "positive" : "neutral"}>{c.active ? "Active" : "Inactive"}</StatusPill></td>
                  <td className="px-4 text-right">{canEdit && <Button size="sm" variant="ghost" onClick={() => start(c)}>Edit</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <aside className="flex h-fit flex-col gap-3 rounded-panel border border-line p-5">
        <p className="text-small text-fg">How it&apos;s used</p>
        <code className="rounded-md bg-surface p-3 font-mono text-micro leading-relaxed text-fg-body">Discounted = Allocated × (1 − haircut) × (1 + EIR)^(−years)</code>
        <p className="text-micro text-fg-muted">Years = time to realise ÷ 12. Discounted collateral reduces LGD.</p>
      </aside>
    </div>
  );
}

const fmtT = (t: Threshold, v: number) => (t.unit === "percent" ? `${Math.round(v * 100)} %` : t.unit === "months" ? `${v} months` : v.toLocaleString("en-US"));

/** E7 validation thresholds: per-rule input with default chip, Modified pill, Reset; sticky save bar with audit line. */
export function ThresholdsSetup({ initial, canEdit = true }: { initial: Threshold[]; canEdit?: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [vals, setVals] = useState(initial);
  const changes = vals.filter((v, i) => v.value !== saved[i].value).length;
  const groups = [...new Set(vals.map((t) => t.group))];
  return (
    <div className="flex flex-col gap-5">
      <Intro>These rules decide when PD data passes validation. Changes apply to new validations only.</Intro>
      {groups.map((g) => (
        <section key={g} className="rounded-panel border border-line">
          <h2 className="border-b border-line px-5 py-3 text-small text-fg">{g}</h2>
          <ul className="divide-y divide-line">
            {vals.filter((t) => t.group === g).map((t) => {
              const i = vals.indexOf(t), modified = t.value !== t.def;
              return (
                <li key={t.id} className="grid items-center gap-3 px-5 py-4 md:grid-cols-[1fr_160px_auto]">
                  <div><p className="text-small text-fg"><span className="mr-2 font-mono text-micro text-fg-muted">{showCode(t.id)}</span>{t.label}{modified && <Badge tone="warning" className="ml-2">Modified</Badge>}</p><p className="text-micro text-fg-muted">{t.description}</p></div>
                  <NumberInput key={`${t.id}-${t.value}`} aria-label={t.label} kind={t.unit === "percent" ? "percent" : "plain"} decimals={t.unit === "percent" ? 1 : 0} defaultValue={t.value} disabled={!canEdit} trailing={t.unit === "months" ? "mo" : undefined}
                    onValueChange={(v) => v != null && v >= 0 && setVals((a) => a.map((x, j) => (j === i ? { ...x, value: v } : x)))} />
                  <span className="flex items-center gap-2"><Badge>Default {fmtT(t, t.def)}</Badge><Button size="sm" variant="ghost" disabled={!modified} onClick={() => setVals((a) => a.map((x, j) => (j === i ? { ...x, value: x.def } : x)))}>Reset</Button></span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {canEdit && <SaveBar changes={changes} saveLabel="Save thresholds" note="Changes are audited." onDiscard={() => setVals(saved)} onSave={async () => {
        const r = await saveThresholds(Object.fromEntries(vals.map((t) => [t.key, t.value])));
        if (!r.ok) { toast.error(r.error); return; }
        setSaved(vals); toast.success("Thresholds saved", { description: "Applies to new validations." });
      }} />}
    </div>
  );
}

/** E8 templates & defaults. Engine pin is admin-only. */
export function TemplatesSetup({ admin = true }: { admin?: boolean }) {
  const files = (SERVICE_PAGES.ecl as LiveServicePage).inputs;
  const init = { currency: "USD", reviewer: "Jean Habimana" };
  const [v, setV] = useState(init);
  const changes = Object.keys(init).filter((k) => v[k as keyof typeof v] !== init[k as keyof typeof init]).length;
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-h4">Templates</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {files.map((f) => (
            <div key={f.name} className="flex flex-col gap-3 rounded-panel border border-line p-5">
              <Icon name="sheet" className="text-positive" size={22} />
              <p className="text-small text-fg">{f.name.replace("workbook", "template")}</p>
              <p className="text-micro text-fg-muted">{f.columns.filter((c) => c.required).length} required columns</p>
              <div className="mt-auto flex flex-wrap items-center gap-3"><Button asChild size="sm" variant="secondary" icon={<Icon name="download" />}><a href={f.template} download>Download</a></Button><Link href="/services/ecl#inputs" className="text-micro text-link hover:underline">View column guide</Link></div>
              <p className="font-mono text-[11px] text-fg-subtle">Updated for engine v1.3.0</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-panel border border-line px-6">
        <FormSection title="Defaults" description="Prefilled on every new run.">
          <Field label="Default currency" id="def-cur"><Select value={v.currency} onChange={(e) => setV({ ...v, currency: e.target.value })}>{["USD", "RWF", "KES", "UGX", "EUR"].map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <div className="flex flex-col gap-1.5">
            <span className="text-small text-fg-body">Engine version</span>
            <Tooltip content={admin ? undefined : "Only administrators can change the engine pin"}>
              <span className="flex h-control items-center gap-2 rounded-input border border-line bg-surface px-3 text-small text-fg-body"><Lock aria-hidden className="size-4 text-fg-muted" /><span className="font-mono">v1.3.0</span> · pinned by workspace</span>
            </Tooltip>
            <span className="text-micro text-fg-muted">New engine versions are opt in. Pinned runs stay reproducible.</span>
          </div>
          <Field label="Default reviewer" id="def-rev"><Select value={v.reviewer} onChange={(e) => setV({ ...v, reviewer: e.target.value })}>{["Jean Habimana", "Aline Mugisha"].map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Switch disabled checked={false} label="Self-approval" description="Allowed only for single user workspaces." />
        </FormSection>
      </section>
      <SaveBar changes={changes} onDiscard={() => setV(init)} onSave={() => toast.success("Defaults saved")} />
    </div>
  );
}
