"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { IconButton } from "@/components/atoms/IconButton";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Switch } from "@/components/atoms/Switch";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Banner } from "@/components/molecules/Banner";
import { Field } from "@/components/molecules/Field";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { TimeSeries } from "@/components/organisms/TimeSeries";
import { toast } from "@/components/organisms/Toaster";
import { cn } from "@/lib/cn";
import { openPeriod, saveEntity, saveSetup } from "@/lib/actions/leases";
import { useLeaseData } from "@/components/organisms/leases/LeaseData";

type SetupStatus = "approved" | "pending" | "draft" | "not-started";
const PILL: Record<SetupStatus, ["positive" | "warning" | "neutral", string]> = { approved: ["positive", "Approved"], pending: ["warning", "Pending approval"], draft: ["neutral", "Draft"], "not-started": ["neutral", "Not started"] };
/** Accounts the lease engine posts to (journal lines reference these keys). */
export const GL_KEYS: [string, string][] = [
  ["rou_cost", "ROU asset — cost"], ["rou_accdep", "ROU asset — accumulated depreciation"], ["lease_liability", "Lease liability"], ["interest_expense", "Interest expense"],
  ["depreciation_expense", "Depreciation expense"], ["cash_payable", "Cash / payables clearing"], ["restoration_provision", "Restoration provision"], ["idc_clearing", "Initial direct costs clearing"],
  ["incentive_receivable", "Lease incentive receivable"], ["modification_gain_loss", "Modification gain / loss"], ["lease_expense", "Short-term / low-value lease expense"],
];
const CLASSES = [["property", "Property"], ["vehicles", "Vehicles"], ["equipment", "Equipment / IT"], ["atm", "Branch ATMs"]];
const today = () => new Date().toISOString().slice(0, 10);

/** LA-01 setup gate: entity, GL, periods, policies, rates. Setup versions are approved by a second person (engine-enforced). */
export function SetupGate({ initialStep = "entity" }: { initialStep?: string }) {
  const b = useLeaseData(), router = useRouter();
  const [busy, start] = useTransition();
  const st = b.state;
  const steps = b.setupSteps;
  const [cur, setCur] = useState(steps.some((s) => s.id === initialStep) ? initialStep : (steps.find((s) => s.status !== "approved")?.id ?? "entity"));
  const step = steps.find((s) => s.id === cur)!;
  const approved = steps.filter((s) => s.status === "approved").length;
  const ent = st.entity ?? {};
  const [entity, setEntity] = useState({ name: ent.name ?? "", currency: ent.currency ?? b.currency ?? "USD", country: ent.country ?? "Rwanda", fyStartMonth: ent.fyStartMonth ?? 1, bookName: ent.bookName ?? "IFRS 16 book" });
  const lastGl = (st.gl ?? []).at(-1)?.accounts ?? {};
  const [gl, setGl] = useState<Record<string, string>>(Object.fromEntries(GL_KEYS.map(([k]) => [k, String(lastGl[k] ?? "")])));
  const lastPol = (st.policies ?? []).at(-1) ?? {};
  const [pol, setPol] = useState({ dayCount: lastPol.dayCount ?? "periodic", shortTermClasses: (lastPol.shortTermClasses ?? []) as string[], lowValueElection: lastPol.lowValueElection ?? true, lowValueThreshold: String(lastPol.lowValueThreshold ?? "5000"), separateNonLeaseClasses: (lastPol.separateNonLeaseClasses ?? []) as string[], capitalisationThreshold: String(lastPol.capitalisationThreshold ?? "0") });
  const lastCurve = (st.curves ?? []).at(-1) ?? {};
  const [curve, setCurve] = useState<{ termYears: string; rate: string }[]>((lastCurve.points ?? [{ termYears: 1, rate: "0.08" }, { termYears: 3, rate: "0.10" }, { termYears: 5, rate: "0.11" }]).map((p: { termYears: number; rate: string }) => ({ termYears: String(p.termYears), rate: String(p.rate) })));
  const [source, setSource] = useState(String(lastCurve.source ?? ""));
  const [from, setFrom] = useState(today());
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const codes = Object.values(gl).filter(Boolean);
  const dupe = codes.find((c, i) => codes.indexOf(c) !== i);
  const curveOk = curve.length > 0 && curve.every((p) => Number(p.termYears) > 0 && Number(p.rate) > 0 && Number(p.rate) < 0.4);
  const blocked = (cur === "gl" && (Boolean(dupe) || codes.length < GL_KEYS.length)) || (cur === "rates" && !curveOk) || (cur === "entity" && entity.name.trim().length < 2);
  const done = (ok: string) => { toast.success(ok); router.refresh(); };
  const save = () => start(async () => {
    let r: { ok: boolean; error?: string };
    if (cur === "entity") r = await saveEntity({ ...entity, fyStartMonth: Number(entity.fyStartMonth) });
    else if (cur === "periods") r = await openPeriod(period);
    else if (cur === "gl") r = await saveSetup("gl", from, { accounts: gl });
    else if (cur === "policies") r = await saveSetup("policies", from, pol);
    else r = await saveSetup("curves", from, { source, points: curve.map((p) => ({ currency: entity.currency, termYears: Number(p.termYears), rate: p.rate })) });
    if (!r.ok) { toast.error(r.error ?? "Couldn't save."); return; }
    done(cur === "entity" || cur === "periods" ? `${step.label} saved` : `${step.label} submitted for approval`);
  });
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1"><h1 className="text-h2 tracking-[-0.03em]">Set up Lease Accounting</h1><p className="text-small text-fg-muted">Complete these five steps before adding leases. Policies, rates and GL changes are approved by a second person.</p></div>
        <Badge tone={approved === 5 ? "positive" : "neutral"}>{approved} of 5 approved</Badge>
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <ol className="flex flex-col gap-1">
          {steps.map((s, i) => (
            <li key={s.id}>
              <button type="button" aria-current={s.id === cur ? "step" : undefined} onClick={() => setCur(s.id)} className={cn("flex w-full items-center gap-3 rounded-card px-3 py-2.5 text-left", s.id === cur ? "bg-surface" : "hover:bg-surface/60")}>
                <span className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-micro", s.status === "approved" ? "bg-positive text-fg-inverse" : s.id === cur ? "bg-fg text-fg-inverse" : "border border-line-strong text-fg-muted")}>{s.status === "approved" ? <Check className="size-3.5" /> : i + 1}</span>
                <span className="flex-1 text-small text-fg">{s.label}</span>
                <StatusPill tone={PILL[s.status as SetupStatus][0]}>{PILL[s.status as SetupStatus][1]}</StatusPill>
              </button>
            </li>
          ))}
        </ol>
        <section className="flex flex-col gap-5 rounded-panel border border-line p-6">
          <h2 className="text-h4">{step.label}</h2>
          {step.status === "pending" && <Banner tone="warning">Waiting for a reviewer in the Inbox. You can&apos;t approve your own change.</Banner>}
          {cur === "entity" && <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Legal entity name" id="le-name" className="sm:col-span-2"><Input value={entity.name} maxLength={200} onChange={(e) => setEntity({ ...entity, name: e.target.value })} /></Field>
            <Field label="Country" id="le-country"><Input value={entity.country} maxLength={64} onChange={(e) => setEntity({ ...entity, country: e.target.value })} /></Field>
            <Field label="Financial year starts" id="le-fy"><Select value={String(entity.fyStartMonth)} onChange={(e) => setEntity({ ...entity, fyStartMonth: Number(e.target.value) })}>{["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</Select></Field>
            <Field label="Functional currency" id="le-fc"><Select value={entity.currency} onChange={(e) => setEntity({ ...entity, currency: e.target.value })}>{["USD", "RWF", "KES", "UGX", "TZS", "EUR"].map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="Ledger / book name" id="le-book"><Input value={entity.bookName} maxLength={100} onChange={(e) => setEntity({ ...entity, bookName: e.target.value })} /></Field>
            <Field label="Framework" id="le-fw" help="Lessee accounting under IFRS 16."><Select defaultValue="ifrs16" disabled><option value="ifrs16">IFRS 16</option></Select></Field>
          </div>}
          {cur === "gl" && <>
            <div className="relative overflow-x-auto rounded-card border border-line"><table className="w-full min-w-[520px] text-small"><caption className="sr-only">Account mapping</caption>
              <thead><tr className="border-b border-line text-fg-muted">{["Purpose", "GL account"].map((h) => <th key={h} scope="col" className="px-4 py-2 text-left font-normal">{h}</th>)}</tr></thead>
              <tbody>{GL_KEYS.map(([k, label]) => <tr key={k} className="border-b border-line last:border-0"><td className="px-4 py-2 text-fg-body">{label}</td><td className="px-4 py-2"><Input aria-label={`GL account for ${label}`} value={gl[k]} maxLength={40} invalid={Boolean(gl[k]) && gl[k] === dupe} onChange={(e) => setGl({ ...gl, [k]: e.target.value.trim() })} className="h-8 font-mono" /></td></tr>)}</tbody>
            </table></div>
            {dupe && <p className="text-micro text-negative">Account {dupe} is used for more than one purpose.</p>}
          </>}
          {cur === "periods" && <>
            <p className="text-small text-fg-body">Open the first accounting period. Leases post into open periods; closed periods are locked.</p>
            <Field label="First period to open" id="pe-first" className="max-w-xs"><Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} /></Field>
            {(st.periods ?? []).length > 0 && <p className="text-micro text-fg-muted">Open periods: {(st.periods as { key: string; status: string }[]).map((x) => `${x.key} (${x.status})`).join(", ")}</p>}
            <Banner tone="info">Locked periods cannot change. Reopening needs a reason and is logged.</Banner>
          </>}
          {cur === "policies" && <div className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-2"><legend className="mb-1 text-small text-fg-body">Short-term exemption (≤ 12 months) applies to</legend>
              <div className="flex flex-wrap gap-2">{CLASSES.map(([v, l]) => <Button key={v} size="sm" variant={pol.shortTermClasses.includes(v) ? "primary" : "secondary"} onClick={() => setPol({ ...pol, shortTermClasses: toggle(pol.shortTermClasses, v) })}>{l}</Button>)}</div></fieldset>
            <Switch checked={pol.lowValueElection} onCheckedChange={(v) => setPol({ ...pol, lowValueElection: v })} label="Apply the low-value exemption" />
            {pol.lowValueElection && <Field label={`Low-value threshold · ${entity.currency}`} id="po-th" className="max-w-xs"><Input numeric value={pol.lowValueThreshold} onChange={(e) => setPol({ ...pol, lowValueThreshold: e.target.value })} /></Field>}
            <fieldset className="flex flex-col gap-2"><legend className="mb-1 text-small text-fg-body">Separate non-lease components for</legend>
              <div className="flex flex-wrap gap-2">{CLASSES.map(([v, l]) => <Button key={v} size="sm" variant={pol.separateNonLeaseClasses.includes(v) ? "primary" : "secondary"} onClick={() => setPol({ ...pol, separateNonLeaseClasses: toggle(pol.separateNonLeaseClasses, v) })}>{l}</Button>)}</div></fieldset>
            <Field label={`Capitalisation threshold · ${entity.currency}`} id="po-cap" className="max-w-xs"><Input numeric value={pol.capitalisationThreshold} onChange={(e) => setPol({ ...pol, capitalisationThreshold: e.target.value })} /></Field>
            <div className="flex flex-col gap-1.5"><span className="text-small text-fg-body">Day-count convention</span><ToggleGroup label="Day count" value={pol.dayCount} onChange={(v) => setPol({ ...pol, dayCount: v })} options={[{ value: "periodic", label: "Periodic" }, { value: "act365", label: "Actual/365" }]} /></div>
          </div>}
          {cur === "rates" && <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="flex flex-col gap-3">
              <Field label="Source" id="rc-src" help="e.g. treasury memo reference"><Input value={source} maxLength={200} onChange={(e) => setSource(e.target.value)} /></Field>
              <table className="text-small tabular-nums"><caption className="sr-only">Rate curve</caption><thead><tr className="text-fg-muted"><th scope="col" className="py-1 text-left font-normal">Term (years)</th><th scope="col" className="py-1 text-left font-normal">Rate (decimal)</th><th /></tr></thead>
                <tbody>{curve.map((p, i) => <tr key={i} className="border-t border-line"><td className="py-1.5 pr-2"><Input aria-label="Term in years" numeric value={p.termYears} onChange={(e) => setCurve(curve.map((x, j) => (j === i ? { ...x, termYears: e.target.value } : x)))} className="h-8" /></td><td className="py-1.5 pr-2"><Input aria-label="Rate" numeric value={p.rate} onChange={(e) => setCurve(curve.map((x, j) => (j === i ? { ...x, rate: e.target.value } : x)))} className="h-8 font-mono" /></td><td><IconButton size="sm" label="Remove tenor" onClick={() => setCurve(curve.filter((_, j) => j !== i))}><Trash2 /></IconButton></td></tr>)}</tbody></table>
              <Button size="sm" variant="secondary" icon={<Plus />} className="w-fit" onClick={() => setCurve([...curve, { termYears: "", rate: "" }])}>Add tenor</Button>
              {!curveOk && <p className="text-micro text-negative">Each tenor needs years &gt; 0 and a rate between 0 and 0.40 (e.g. 0.095 = 9.5 %).</p>}
            </div>
            <TimeSeries title="Rate curve" data={curve.filter((p) => Number(p.termYears) > 0).sort((a, z) => Number(a.termYears) - Number(z.termYears)).map((p) => ({ term: `${p.termYears}y`, rate: Number(p.rate) * 100 }))} x="term" format={(v) => `${v.toFixed(2)} %`} series={[{ key: "rate", label: "IBR", color: "var(--chart-1)", value: "rate" }]} height={180} />
          </div>}
          {(cur === "gl" || cur === "policies" || cur === "rates") && <Field label="Effective from" id="eff" className="max-w-xs"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>}
          <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
            {step.status === "pending" ? <p className="text-small text-fg-muted">Submitted. A reviewer approves it in the Inbox.</p>
              : <Button loading={busy} disabled={blocked} disabledReason={blocked ? (cur === "gl" ? "Map every purpose to a unique account" : cur === "rates" ? "Fix the curve" : "Enter the entity name") : undefined} onClick={save}>
                  {cur === "entity" || cur === "periods" ? (step.status === "approved" ? "Save changes" : "Save") : step.status === "approved" ? "Submit a new version" : "Submit for approval"}</Button>}
          </div>
        </section>
      </div>
      {approved === 5 && <Banner tone="positive" action={<Button asChild size="sm"><Link href="/leases/new">New lease</Link></Button>}>Setup complete. You can add leases now.</Banner>}
    </div>
  );
}
