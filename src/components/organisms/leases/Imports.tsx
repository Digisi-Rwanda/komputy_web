"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, Download, XCircle } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Select } from "@/components/atoms/Select";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Banner } from "@/components/molecules/Banner";
import { FileDropzone } from "@/components/molecules/FileDropzone";
import { ProgressBar } from "@/components/molecules/Progress";
import { Stepper } from "@/components/molecules/Stepper";
import { toast } from "@/components/organisms/Toaster";
import { getImport, importAction, setImportMapping, uploadImport, type ImportBatch } from "@/lib/actions/leases";
import { useLeaseData } from "@/components/organisms/leases/LeaseData";
import { showCode } from "@/lib/code";

// Engine import template (apps/leases/imports.py COLUMNS): key, label, required.
const FIELDS: [string, string, boolean][] = [
  ["lease_ref", "Lease reference", true], ["name", "Lease name", true], ["asset_class", "Asset class", true], ["lessor", "Lessor", true], ["location", "Location", false],
  ["currency", "Currency", true], ["commencement_date", "Commencement date", true], ["end_date", "End date", true], ["payment_amount", "Payment amount", true],
  ["frequency", "Frequency", true], ["timing", "Timing", true], ["rent_free_months", "Rent free months", false], ["escalation_pct", "Escalation %", false],
  ["escalation_every_months", "Escalation every (months)", false], ["discount_rate_pct", "Discount rate %", false], ["initial_direct_costs", "Initial direct costs", false],
  ["incentives", "Incentives received", false], ["restoration_estimate", "Restoration estimate", false], ["exemption", "Exemption", false],
];
const STEP: Record<string, number> = { uploaded: 1, mapping: 1, validating: 2, validated: 3, needs_fixing: 2, committing: 4, committed: 4, cancelled: 0 };
const BUSY = new Set(["validating", "committing"]);

/** LC-02 imports: upload → map columns → validate (engine job) → accept warnings → commit (engine job) → submit for approval. */
export function Imports() {
  const b = useLeaseData(), router = useRouter();
  const [busy, start] = useTransition();
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [map, setMap] = useState<Record<string, string>>({});
  const reviewers = b.members.filter((m) => m.id !== b.me && (m.role === "reviewer" || m.role === "administrator"));
  const open = (x: ImportBatch) => { setBatch(x); setMap(x.mapping ?? {}); };
  // Poll while the engine job runs (validation/commit progress is committed per chunk).
  useEffect(() => {
    if (!batch || !BUSY.has(batch.status)) return;
    const t = setInterval(async () => { const r = await getImport(batch.id); if (r.ok) { setBatch(r.data); if (!BUSY.has(r.data.status)) router.refresh(); } }, 1500);
    return () => clearInterval(t);
  }, [batch, router]);
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => start(async () => {
    const r = await fn();
    if (!r.ok) { toast.error(r.error ?? "The engine refused this."); return; }
    toast.success(ok);
    const fresh = batch && (await getImport(batch.id));
    if (fresh?.ok) open(fresh.data);
    router.refresh();
  });
  const rows = batch?.rows ?? [];
  const errors = rows.filter((r) => r.issues.some((i) => i.severity === "error")), warnings = rows.filter((r) => !r.issues.some((i) => i.severity === "error") && r.issues.length);
  const missing = FIELDS.filter(([k, , req]) => req && !map[k]).map(([, l]) => l);
  const used = Object.values(map).filter(Boolean), dup = used.find((h, i) => used.indexOf(h) !== i);

  if (!batch) return (
    <div className="flex flex-col gap-6">
      <FileDropzone title="Drop a lease file here" hint=".xlsx or .csv · up to 10,000 rows" accept=".xlsx,.csv" maxMb={20} onFile={(f) => start(async () => {
        const fd = new FormData(); fd.set("file", f);
        const r = await uploadImport(fd);
        if (!r.ok) { toast.error(r.error); return; }
        toast.success(`${f.name} uploaded`); open(r.data);
      })} />
      <p className="text-micro text-fg-muted"><Link href="/api/leases/imports/template" prefetch={false} className="text-link hover:underline">Download import template (CSV)</Link></p>
      <section className="flex flex-col gap-2"><h2 className="text-h4">Recent imports</h2>
        <ul className="divide-y divide-line rounded-panel border border-line">{b.imports.map(([id, f, n, st, by, at]) => <li key={id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-small"><span className="font-mono text-micro text-fg">{showCode(id)}</span><span className="flex-1 text-fg-body">{f}{n ? ` · ${n} rows` : ""}</span><StatusPill tone={st === "committed" ? "positive" : st === "needs_fixing" ? "negative" : "neutral"}>{st.replace("_", " ")}</StatusPill><span className="text-micro text-fg-muted">{by} · {at}</span><Button size="sm" variant="ghost" loading={busy} onClick={() => start(async () => { const r = await getImport(id); if (r.ok) open(r.data); else toast.error(r.error); })}>Open</Button></li>)}
          {!b.imports.length && <li className="px-4 py-6 text-center text-small text-fg-muted">No imports yet.</li>}</ul>
      </section>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3"><Button variant="ghost" size="sm" onClick={() => setBatch(null)}>← All imports</Button><span className="font-mono text-micro text-fg">{showCode(batch.id)}</span><span className="text-small text-fg-body">{batch.fileName}</span><StatusPill tone={batch.status === "committed" ? "positive" : batch.status === "needs_fixing" ? "negative" : "info"}>{batch.status.replace("_", " ")}</StatusPill></div>
      <Stepper current={STEP[batch.status] ?? 1} steps={["Upload", "Map columns", "Validate", "Review", "Commit"].map((label) => ({ label }))} />
      {BUSY.has(batch.status) && <section aria-live="polite" className="flex flex-col gap-2 rounded-panel border border-line p-5"><p className="text-small text-fg">{batch.status === "validating" ? "Validating rows…" : "Creating leases…"}</p><ProgressBar value={batch.progress ?? 0} max={100} label="Progress" showValue /><p className="text-micro text-fg-muted">Runs in the background. You can leave this page.</p></section>}

      {(batch.status === "uploaded" || batch.status === "mapping" || batch.status === "needs_fixing" || batch.status === "validated") && <section className="flex flex-col gap-3">
        <h2 className="text-h4">Map columns</h2>
        <div className="relative overflow-x-auto rounded-panel border border-line"><table className="w-full min-w-[560px] text-small"><caption className="sr-only">Column mapping</caption>
          <thead><tr className="border-b border-line text-fg-muted">{["Komputy field", "Your column"].map((h) => <th key={h} scope="col" className="px-4 py-2 text-left font-normal">{h}</th>)}</tr></thead>
          <tbody>{FIELDS.map(([k, label, req]) => <tr key={k} className="border-b border-line last:border-0"><td className="px-4 py-2 text-fg">{label}{req && <span className="text-negative"> *</span>}</td><td className="px-4 py-2"><Select aria-label={`Column for ${label}`} value={map[k] ?? ""} invalid={Boolean(map[k]) && map[k] === dup} onChange={(e) => setMap((m) => ({ ...m, [k]: e.target.value }))} wrapperClassName="w-64"><option value="">Not in file</option>{batch.headers.map((h) => <option key={h} value={h}>{h}</option>)}</Select></td></tr>)}</tbody></table></div>
        {dup && <p role="alert" className="text-small text-negative">Column “{dup}” is mapped twice.</p>}
        {missing.length > 0 && <p className="text-small text-fg-muted">Required: {missing.join(", ")}</p>}
        <Button className="w-fit" loading={busy} disabled={missing.length > 0 || Boolean(dup)} disabledReason={missing.length ? "Map the required fields" : dup ? "A column is mapped twice" : undefined} onClick={() => act(() => setImportMapping(batch.id, map), "Validation started")}>Save mapping and validate</Button>
      </section>}

      {(batch.status === "validated" || batch.status === "needs_fixing") && <section className="flex flex-col gap-3">
        <p className="flex flex-wrap gap-2"><Badge tone="positive">{rows.length - errors.length - warnings.length} valid</Badge><Badge tone="warning">{warnings.length} with warnings</Badge><Badge tone="negative">{errors.length} with errors</Badge></p>
        <ul className="max-h-80 divide-y divide-line overflow-auto rounded-panel border border-line">{[...errors, ...warnings].slice(0, 200).map((r) => <li key={r.row} className="flex items-start gap-3 px-4 py-3 text-small">{r.issues.some((i) => i.severity === "error") ? <XCircle className="mt-0.5 size-4 shrink-0 text-negative" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-warning" />}<span className="w-16 shrink-0 font-mono text-micro text-fg-muted">Row {r.row}</span><span className="flex-1 text-fg-body">{r.issues.map((i) => `${i.column ? `${i.column}: ` : ""}${i.message}`).join(" · ")}</span></li>)}
          {!errors.length && !warnings.length && <li className="px-4 py-4 text-small text-fg-muted">Every row passed.</li>}</ul>
        <div className="flex flex-wrap gap-2">
          {(errors.length > 0 || warnings.length > 0) && <Button asChild variant="secondary" icon={<Download />}><a href={`/api/leases/imports/${batch.id}`}>Download issues (CSV)</a></Button>}
          {warnings.length > 0 && !batch.warningsAccepted && <Button variant="secondary" loading={busy} onClick={() => act(() => importAction(batch.id, "accept-warnings"), "Warnings accepted")}>Accept warnings</Button>}
          <Button loading={busy} disabled={rows.length === errors.length || (warnings.length > 0 && !batch.warningsAccepted)} disabledReason={rows.length === errors.length ? "No valid rows to import" : warnings.length > 0 && !batch.warningsAccepted ? "Accept the warnings first" : undefined}
            onClick={() => act(() => importAction(batch.id, "commit"), "Import started")}>Create {rows.length - errors.length} leases as drafts{errors.length ? ` (skip ${errors.length})` : ""}</Button>
          <Button variant="ghost" loading={busy} onClick={() => act(() => importAction(batch.id, "cancel"), "Import cancelled")}>Cancel import</Button>
        </div>
      </section>}

      {batch.status === "committed" && <section className="flex flex-col items-center gap-4 rounded-panel border border-line p-8 text-center">
        <CheckCircle2 className="size-12 text-positive" /><p className="text-h4 text-fg">{rows.filter((r) => r.leaseId).length} drafts created{rows.some((r) => r.outcome === "failed") ? ` · ${rows.filter((r) => r.outcome === "failed").length} failed` : ""}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {rows.some((r) => r.outcome === "failed") && <Button variant="secondary" loading={busy} onClick={() => act(() => importAction(batch.id, "retry"), "Retrying failed rows")}>Retry failed rows</Button>}
          {reviewers[0] ? <Button loading={busy} onClick={() => act(() => importAction(batch.id, "submit", reviewers[0].id), `Submitted to ${reviewers[0].name}`)}>Submit all for approval</Button> : <Banner tone="warning">No reviewer available to approve these leases.</Banner>}
          <Link href="/leases/register" className="self-center text-small text-link hover:underline">View in register</Link>
        </div>
      </section>}
    </div>
  );
}
