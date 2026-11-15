"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { NumberInput } from "@/components/atoms/NumberInput";
import { RadioGroup } from "@/components/atoms/RadioGroup";
import { Select } from "@/components/atoms/Select";
import { Switch } from "@/components/atoms/Switch";
import { Textarea } from "@/components/atoms/Textarea";
import { Banner } from "@/components/molecules/Banner";
import { Field } from "@/components/molecules/Field";
import { Stepper } from "@/components/molecules/Stepper";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { Accordion } from "@/components/molecules/Accordion";
import { Sparkline } from "@/components/atoms/Sparkline";
import { TimeSeries } from "@/components/organisms/TimeSeries";
import { toast } from "@/components/organisms/Toaster";
import { calculate, termMonths, type Frequency } from "@/lib/lease";
import { money } from "@/lib/format";
import { addCounterparty, calculateLease, createLease, submitLease, updateLease } from "@/lib/actions/leases";
import { useLeaseData } from "@/components/organisms/leases/LeaseData";

export const LEASE_STEPS = ["contract", "terms", "payments", "rate", "judgements", "preview", "submit"] as const;
const LABEL = ["Contract", "Terms & dates", "Payments", "Rate", "Judgements", "Preview", "Submit"];
// Draft survives step-to-step navigation (each step is a route).
// The engine holds the lease once submitted; this in-memory draft only carries the form between steps.
let DRAFT: Record<string, unknown> | null = null;
let SUBMITTED = false;
const INIT = { name: "", counterparty: "", cls: "Property", location: "", ref: "", start: "", end: "", payment: null as number | null, frequency: "annual" as Frequency, timing: "arrears", idc: 0, incentives: 0, restoration: 0, rateMode: "curve", override: null as number | null, justification: "", renewal: false, dupDismissed: false, judgements: { identified: "yes", direct: "yes", renewal: "no", short: "no", low: "no" } as Record<string, string>, reviewer: "", note: "" };
const CLASS_KEY: Record<string, string> = { Property: "property", Vehicles: "vehicles", "IT equipment": "equipment", "Branch ATMs": "atm" };
/** Curve rate for a term: the shortest tenor that covers it (else the longest), as the engine does for curve-based rates. */
const curveRate = (curve: [number, number][], months: number) => { const s = [...curve].sort((a, b) => a[0] - b[0]); return (s.find(([y]) => y * 12 >= months) ?? s.at(-1))?.[1] ?? 0; };

/** LB-01/LB-02 new lease wizard with a live preview computed by the lease engine on every keystroke. */
export function NewLease({ step }: { step: (typeof LEASE_STEPS)[number] }) {
  const router = useRouter();
  const book = useLeaseData();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const idx = LEASE_STEPS.indexOf(step);
  const [v, setV] = useState(() => (DRAFT as typeof INIT | null) ?? INIT);
  const [submitted, setSubmittedState] = useState(SUBMITTED);
  const setSubmitted = (b: boolean) => { SUBMITTED = b; setSubmittedState(b); };
  const set = (p: Partial<typeof v>) => setV((x) => { const n = { ...x, ...p }; DRAFT = n; return n; });
  const datesOk = Boolean(v.start && v.end && termMonths(v.start, v.end) > 0);
  const rate = v.rateMode === "curve" ? curveRate(book.rateCurve, datesOk ? termMonths(v.start, v.end) : 12) : v.override ?? 0;
  const counterparties = (book.state.counterparties ?? []) as { id: string; name: string }[];
  const reviewers = book.members.filter((m) => m.id !== book.me && (m.role === "reviewer" || m.role === "administrator"));
  const calc = useMemo(() => (datesOk && v.payment ? calculate({ commencement: v.start, end: v.end, payment: v.payment, frequency: v.frequency, timing: v.timing as "arrears", rate, idc: v.idc, incentives: v.incentives, restoration: v.restoration }) : null), [v, rate, datesOk]);
  const dupOf = book.register.find((l) => l.counterparty && l.counterparty === v.counterparty && l.status !== "terminated" && (!v.location || l.name.toLowerCase() === v.name.trim().toLowerCase()));
  const dup = Boolean(dupOf) && !v.dupDismissed;
  const exempt = v.judgements.short === "yes" || v.judgements.low === "yes";
  const go = (n: number) => router.push(`/leases/new/${LEASE_STEPS[n]}`);
  const overrideOk = v.rateMode !== "manual" || ((v.override ?? 0) > 0 && v.justification.trim().length >= 10);
  const submit = async () => {
    if (!book.setupDone) { toast.error("Finish Lease Accounting setup first."); return; }
    const approver = reviewers.find((m) => m.id === v.reviewer) ?? reviewers[0];
    if (!approver) { toast.error("There's no reviewer to send this to. Ask an administrator to give someone the Lease reviewer role."); return; }
    setBusy(true);
    try {
      let cp = counterparties.find((c) => c.name.toLowerCase() === v.counterparty.trim().toLowerCase())?.id;
      if (!cp) { const c = await addCounterparty(v.counterparty.trim()); if (!c.ok) throw new Error(c.error); cp = c.data.id; }
      const made = await createLease({ name: v.name.trim(), assetClass: CLASS_KEY[v.cls] ?? "property", counterpartyId: cp, location: v.location, costCentre: v.ref });
      if (!made.ok) throw new Error(made.error);
      const terms = { commencementDate: v.start, endDate: v.end, manualLines: [], nonLeasePerPayment: "0", separateNonLease: false, prepaidBeforeCommencement: "0",
        initialDirectCosts: String(v.idc ?? 0), incentivesReceived: String(v.incentives ?? 0), restorationEstimate: String(v.restoration ?? 0),
        paymentRule: { amount: String(v.payment), frequency: v.frequency, timing: v.timing, escalation: { type: "none" }, rentFreeMonths: 0 } };
      const exemption = v.judgements.short === "yes" ? "short_term" : v.judgements.low === "yes" ? "low_value" : "none";
      const assessment = { identifiedAsset: v.judgements.identified === "yes", rightToControl: v.judgements.direct === "yes", exemption, exemptionRationale: exemption === "none" ? "" : "Per policy",
        options: [], purchaseOption: { exists: false, reasonablyCertain: null, rationale: "" }, termRationale: v.judgements.renewal === "yes" ? "Renewal reasonably certain" : "Contract term" };
      const up = await updateLease(made.data.id, { rev: made.data.rev, lease: { contractEndDate: v.end }, version: { terms, assessment,
        rate: v.rateMode === "manual" ? { value: String(v.override), source: "override", reason: v.justification.trim() } : { value: String(rate), source: "curve", reason: "" } } });
      if (!up.ok) throw new Error(up.error);
      const calc = await calculateLease(made.data.id, up.data.rev);
      if (!calc.ok) throw new Error(calc.error);
      const sub = await submitLease(made.data.id, calc.data.rev, approver.id, v.note);
      if (!sub.ok) throw new Error(sub.error);
      setCode((made.data as { code?: string }).code ?? null);
      setSubmitted(true); toast.success("Lease submitted", { description: `${approver.name} has been notified.` }); router.refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't submit the lease."); } finally { setBusy(false); }
  };

  if (submitted) return (
    <section role="status" className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-panel border border-line p-10 text-center animate-scale-in">
      <CheckCircle2 className="size-14 text-positive" /><h2 className="text-h3">{code ?? "Lease"} submitted for approval</h2><p className="text-small text-fg-muted">The reviewer has been notified.</p>
      <div className="flex flex-wrap justify-center gap-2">{code && <Button asChild><Link href={`/leases/register/${code}/summary`}>View lease</Link></Button>}<Button asChild variant="secondary"><Link href="/leases/new/contract" onClick={() => { DRAFT = null; SUBMITTED = false; }}>New lease</Link></Button><Button asChild variant="ghost"><Link href="/leases/register">Back to register</Link></Button></div>
    </section>
  );

  const preview = (
    <aside className="glass ring-inner flex h-fit flex-col gap-3 rounded-panel border border-line p-5 lg:sticky lg:top-24">
      <p className="label-mono">Live preview</p>
      <div><p className="text-micro text-fg-muted">Lease liability at commencement</p><p className="text-h3 text-fg tabular-nums">{calc ? `${book.currency} ${money(calc.liability)}` : "—"}</p></div>
      <dl className="grid grid-cols-2 gap-3 text-small"><div><dt className="text-micro text-fg-muted">ROU asset</dt><dd className="tabular-nums text-fg">{calc ? money(calc.rou) : "—"}</dd></div><div><dt className="text-micro text-fg-muted">Annual depreciation</dt><dd className="tabular-nums text-fg">{calc ? money(calc.annualDepreciation) : "—"}</dd></div><div><dt className="text-micro text-fg-muted">Term</dt><dd className="text-fg">{calc ? `${calc.months} months` : "—"}</dd></div><div><dt className="text-micro text-fg-muted">Rate</dt><dd className="text-fg">{(rate * 100).toFixed(2)} %{v.rateMode !== "curve" && <Badge tone="warning" className="ml-1">override</Badge>}</dd></div></dl>
      {calc && <Sparkline values={[calc.liability, ...calc.rows.map((r) => r.closing)]} className="h-10 w-full" />}
      <p className="font-mono text-[11px] text-fg-subtle">Preview · the engine recalculates on submit</p>
    </aside>
  );

  const footer = (
    <div className="glass sticky bottom-4 z-[var(--z-sticky)] flex flex-wrap items-center gap-2 rounded-full border border-line py-2 pl-5 pr-2">
      <span className="text-micro text-fg-muted">New lease · draft in this browser until submitted</span>
      <span className="ml-auto flex gap-2">
        {idx > 0 && <Button variant="ghost" icon={<ArrowLeft />} onClick={() => go(idx - 1)}>Back</Button>}
        {idx < 6 ? <Button right={<ArrowRight />} disabled={(idx === 0 && dup) || (idx === 1 && !datesOk) || (idx === 2 && !v.payment) || (idx === 3 && !overrideOk)} disabledReason={idx === 0 && dup ? "Review the possible duplicate first" : idx === 1 && !datesOk ? "End date must be after commencement" : idx === 2 && !v.payment ? "Enter the payment amount" : idx === 3 && !overrideOk ? "Add a rate and justification" : undefined} onClick={() => go(idx + 1)}>Continue</Button>
          : <Button loading={busy} disabled={!v.name.trim() || !v.counterparty.trim() || !datesOk || !v.payment} onClick={submit}>Submit for approval</Button>}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div><p className="text-small text-fg-muted">Lease Accounting / New lease</p><h1 className="text-h3">{v.name || "New lease"}</h1></div>
      <Stepper current={idx} steps={LABEL.map((label) => ({ label }))} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex min-w-0 flex-col gap-5 rounded-panel border border-line p-6">
          {step === "contract" && <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Lease name" id="nl-name" className="sm:col-span-2"><Input value={v.name} onChange={(e) => set({ name: e.target.value })} /></Field>
              <Field label="Entity" id="nl-ent"><Select value="entity" disabled><option value="entity">{book.state.entity?.name ?? "Set up the entity first"}</option></Select></Field>
              <Field label="Counterparty" id="nl-cp" help="Pick an existing lessor or type a new one"><Input list="nl-cps" value={v.counterparty} maxLength={200} onChange={(e) => set({ counterparty: e.target.value, dupDismissed: false })} /></Field>
              <datalist id="nl-cps">{counterparties.map((c) => <option key={c.id} value={c.name} />)}</datalist>
              <Field label="Asset class" id="nl-cls"><Select value={v.cls} onChange={(e) => set({ cls: e.target.value })}>{["Property", "Vehicles", "IT equipment", "Branch ATMs"].map((c) => <option key={c}>{c}</option>)}</Select></Field>
              <Field label="Cost centre / contract reference" id="nl-ref"><Input value={v.ref} maxLength={100} onChange={(e) => set({ ref: e.target.value })} /></Field>
              <Field label="Location" id="nl-loc" className="sm:col-span-2"><Input value={v.location} onChange={(e) => set({ location: e.target.value, dupDismissed: false })} /></Field>
            </div>
            <p className="flex items-center gap-2 rounded-card border border-line px-4 py-3 text-small text-fg-muted"><FileText className="size-4" />Attach the signed contract from the lease&apos;s Documents tab after submitting.</p>
            {dup && <Banner tone="warning" action={<>{dupOf && <Button asChild size="sm" variant="ghost"><Link href={`/leases/register/${dupOf.id}/summary`}>Compare</Link></Button>}<Button size="sm" variant="secondary" onClick={() => set({ dupDismissed: true })}>Not a duplicate</Button></>}>Possible duplicate: {dupOf?.id} ({dupOf?.name}) has the same counterparty. Review before continuing.</Banner>}
          </>}
          {step === "terms" && <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Commencement date" id="nl-start" help="YYYY-MM-DD"><Input type="date" value={v.start} onChange={(e) => set({ start: e.target.value })} /></Field>
              <Field label="End date" id="nl-end" error={!datesOk ? "End date must be after commencement." : undefined}><Input type="date" value={v.end} onChange={(e) => set({ end: e.target.value })} /></Field>
            </div>
            {datesOk && <Badge className="w-fit">Term {termMonths(v.start, v.end)} months</Badge>}
            <Switch checked={v.renewal} onCheckedChange={(c) => set({ renewal: c })} label="Renewal option" description="2 years · reasonably certain? Answered in Judgements." />
            <Switch label="Termination option" /><Switch label="Purchase option" />
          </>}
          {step === "payments" && <>
            <ToggleGroup label="Schedule type" value="fixed" onChange={() => toast("Irregular schedules are entered as a table (coming with the backend engine).")} options={[{ value: "fixed", label: "Fixed schedule" }, { value: "irregular", label: "Irregular schedule" }]} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`Amount · ${book.currency}`} id="nl-amt" error={!v.payment ? "Enter the payment amount." : undefined}><NumberInput kind="money" defaultValue={v.payment} onValueChange={(n) => set({ payment: n && n > 0 ? n : null })} /></Field>
              <Field label="Frequency" id="nl-freq"><Select value={v.frequency} onChange={(e) => set({ frequency: e.target.value as Frequency })}><option value="annual">Annual</option><option value="quarterly">Quarterly</option><option value="monthly">Monthly</option></Select></Field>
              <Field label="Initial direct costs" id="nl-idc"><NumberInput kind="money" defaultValue={v.idc} onValueChange={(n) => set({ idc: n ?? 0 })} /></Field>
              <Field label="Incentives received" id="nl-inc"><NumberInput kind="money" defaultValue={v.incentives} onValueChange={(n) => set({ incentives: n ?? 0 })} /></Field>
              <Field label="Restoration provision" id="nl-res"><NumberInput kind="money" defaultValue={v.restoration} onValueChange={(n) => set({ restoration: n ?? 0 })} /></Field>
            </div>
            <RadioGroup name="timing" value={v.timing} onValueChange={(t) => set({ timing: t })} options={[{ value: "arrears", label: "In arrears", description: "Paid at the end of each period" }, { value: "advance", label: "In advance", description: "Paid at the start of each period" }]} />
            {calc && <table className="w-fit text-small tabular-nums"><caption className="sr-only">Generated payments</caption><tbody>{calc.rows.map((r) => <tr key={r.year}><td className="pr-8 text-fg-body">{r.year}</td><td className="text-right">{money(r.payment)}</td></tr>)}<tr className="border-t border-line"><td className="pr-8 pt-1 text-fg">Total</td><td className="pt-1 text-right text-fg">{money(calc.rows.reduce((a, r) => a + r.payment, 0))}</td></tr></tbody></table>}
          </>}
          {step === "rate" && <>
            <RadioGroup name="rate" value={v.rateMode} onValueChange={(m) => set({ rateMode: m })} options={[{ value: "curve", label: "Use curve rate", description: book.rateCurve.length ? `Approved curve → ${(rate * 100).toFixed(2)} % for this term` : "No approved rate curve yet" }, { value: "implicit", label: "Rate implicit in the lease", description: "When the lessor's rate is known", disabled: true }, { value: "manual", label: "Manual rate", description: "Requires justification · highlighted for the reviewer" }]} />
            {v.rateMode === "manual" && <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
              <Field label="Rate" id="nl-rate" error={v.override != null && v.override > 0 && v.override < 0.01 ? `Did you mean ${(v.override * 10000).toFixed(0)} %?` : undefined}><NumberInput kind="percent" defaultValue={v.override} onValueChange={(n) => set({ override: n })} /></Field>
              <Field label="Justification" id="nl-just" required error={v.justification.trim().length < 10 ? "Explain why the curve rate isn't used." : undefined}><Textarea value={v.justification} maxLength={500} onChange={(e) => set({ justification: e.target.value })} /></Field>
            </div>}
          </>}
          {step === "judgements" && <>
            {[["identified", "Is there an identified asset?", "Floor 4 specified in clause 2.1"], ["direct", "Does Kivu Commercial Bank direct the use?", ""], ["renewal", "Is the renewal option reasonably certain to be exercised?", "No business plan beyond 2029"], ["short", "Short-term (≤ 12 months)?", ""], ["low", "Low value?", ""]].map(([k, q, note]) => (
              <div key={k} className="flex flex-wrap items-center gap-4 rounded-card border border-line p-4"><span className="flex-1 text-small text-fg">{q}{note && <span className="block text-micro text-fg-muted">{note}</span>}</span><ToggleGroup label={q} value={v.judgements[k]} onChange={(a) => set({ judgements: { ...v.judgements, [k]: a } })} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} /></div>
            ))}
            {exempt ? <Banner tone="info">Exempt — payments are expensed. No ROU asset or liability is recognised.</Banner> : v.judgements.identified === "yes" && v.judgements.direct === "yes" ? <Banner tone="positive">Recognise on balance sheet — IFRS 16 lessee model. Judgements are reviewed before approval.</Banner> : <Banner tone="warning">Not a lease under IFRS 16 — the contract may be a service.</Banner>}
          </>}
          {step === "preview" && calc && <>
            <div className="relative overflow-x-auto"><table className="w-full min-w-[640px] text-small tabular-nums"><caption className="sr-only">Lease schedule</caption>
              <thead><tr className="border-b border-line text-fg-muted">{["Period", "Opening", "Interest", "Payment", "Closing", "Depreciation", "ROU carrying"].map((h, i) => <th key={h} scope="col" className={`px-3 py-2 font-normal ${i ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
              <tbody>{calc.rows.map((r) => <tr key={r.year} className="border-b border-line"><td className="px-3 py-2">{r.year}</td>{[r.opening, r.interest, r.payment, r.closing, r.depreciation, r.rou].map((x, i) => <td key={i} className="px-3 text-right">{money(x)}</td>)}</tr>)}
                <tr><td className="px-3 py-2 text-fg">Total interest</td><td /><td className="px-3 text-right text-fg">{money(calc.totalInterest)}</td><td colSpan={4} /></tr></tbody></table></div>
            <p className="text-micro text-fg-muted">Last period absorbs rounding (0.01).</p>
            <TimeSeries title="Liability and ROU" height={180} data={[{ y: v.start.slice(0, 4), l: calc.liability, r: calc.rou }, ...calc.rows.map((r) => ({ y: String(r.year + 1), l: r.closing, r: r.rou }))]} x="y" format="compact" series={[{ key: "l", label: "Liability", color: "var(--chart-1)", value: "l" }, { key: "r", label: "ROU", color: "var(--chart-6)", value: "r" }]} />
            <p className="rounded-card border border-line px-4 py-3 font-mono text-micro text-fg-body">Dr ROU asset {money(calc.rou)} / Cr Lease liability {money(calc.liability)} · {v.start}</p>
            <Accordion type="single" items={[{ value: "pv", title: "How was this calculated?", content: <code className="block font-mono text-micro text-fg-body">PV = Σ payment ÷ (1 + {(rate * 100).toFixed(2)} %)^t over {calc.periods} periods ({v.timing}) = {money(calc.liability)}</code> }]} />
          </>}
          {step === "submit" && <>
            <ul className="flex flex-col gap-2">{["Contract details complete", ...(v.rateMode === "manual" ? ["Rate override justified"] : []), "Judgements answered", ...(v.dupDismissed ? ["Possible duplicate dismissed"] : [])].map((t) => <li key={t} className="flex items-center gap-2 text-small text-fg-body"><CheckCircle2 className="size-4 text-positive" />{t}</li>)}</ul>
            <Field label="Reviewer" id="nl-rev"><Select value={v.reviewer || reviewers[0]?.id || ""} onChange={(e) => set({ reviewer: e.target.value })}>{reviewers.length ? reviewers.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.title})</option>) : <option value="">No reviewer available</option>}</Select></Field>
            <Field label="Note for reviewer" id="nl-note" optional><Textarea maxLength={500} value={v.note} onChange={(e) => set({ note: e.target.value })} /></Field>
            <p className="text-micro text-fg-muted">You can&apos;t approve your own lease.</p>
          </>}
        </section>
        {preview}
      </div>
      {footer}
    </div>
  );
}
