"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { NumberInput } from "@/components/atoms/NumberInput";
import { Select } from "@/components/atoms/Select";
import { Switch } from "@/components/atoms/Switch";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Banner } from "@/components/molecules/Banner";
import { Field } from "@/components/molecules/Field";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { TimeSeries } from "@/components/organisms/TimeSeries";
import { toast } from "@/components/organisms/Toaster";
import { cn } from "@/lib/cn";
import { leaseData } from "@/data/mock/index";
import type { SetupStatus } from "@/data/mock/leases";

const PILL: Record<SetupStatus, ["positive" | "warning" | "neutral", string]> = { approved: ["positive", "Approved"], pending: ["warning", "Pending approval"], draft: ["neutral", "Draft"], "not-started": ["neutral", "Not started"] };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** LA-01 setup gate: five maker-checker steps (entity, GL, periods, policies, rates). */
export function SetupGate({ initialStep = "policies" }: { initialStep?: string }) {
  const [steps, setSteps] = useState(leaseData.setupSteps);
  const [cur, setCur] = useState(leaseData.setupSteps.some((s) => s.id === initialStep) ? initialStep : "policies");
  const [gl, setGl] = useState(leaseData.glMapping.map((r) => r[1]));
  const [lowValue, setLowValue] = useState(true), [shortTerm, setShortTerm] = useState(true), [nonLease, setNonLease] = useState(false), [dayCount, setDayCount] = useState("periodic"), [mode, setMode] = useState("lessee");
  const step = steps.find((s) => s.id === cur)!;
  const approved = steps.filter((s) => s.status === "approved").length;
  const dupe = gl.findIndex((g, i) => gl.indexOf(g) !== i);
  const submit = () => { setSteps((x) => x.map((s) => (s.id === cur ? { ...s, status: "pending" } : s))); toast.success(`${step.label} submitted for approval`, { description: "Jean Habimana will review it." }); };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1"><h1 className="text-h2 tracking-[-0.03em]">Set up Lease Accounting</h1><p className="text-small text-fg-muted">Complete these five steps before adding leases. Every change is approved by a second person.</p></div>
        <Badge tone={approved === 5 ? "positive" : "neutral"}>{approved} of 5 approved</Badge>
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <ol className="flex flex-col gap-1">
          {steps.map((s, i) => (
            <li key={s.id}>
              <button type="button" aria-current={s.id === cur ? "step" : undefined} onClick={() => setCur(s.id)} className={cn("flex w-full items-center gap-3 rounded-card px-3 py-2.5 text-left", s.id === cur ? "bg-surface" : "hover:bg-surface/60")}>
                <span className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-micro", s.status === "approved" ? "bg-positive text-fg-inverse" : s.id === cur ? "bg-fg text-fg-inverse" : "border border-line-strong text-fg-muted")}>{s.status === "approved" ? <Check className="size-3.5" /> : i + 1}</span>
                <span className="flex-1 text-small text-fg">{s.label}</span>
                <StatusPill tone={PILL[s.status][0]}>{PILL[s.status][1]}</StatusPill>
              </button>
            </li>
          ))}
        </ol>
        <section className="flex flex-col gap-5 rounded-panel border border-line p-6">
          <h2 className="text-h4">{step.label}</h2>
          {step.status === "pending" && <Banner tone="warning">Submitted by Eric Uwase · waiting for a reviewer. You can&apos;t approve your own change.</Banner>}
          {cur === "entity" && <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Legal entity name" id="le-name" className="sm:col-span-2"><Input defaultValue="Kivu Commercial Bank Plc" /></Field>
            <Field label="Country" id="le-country"><Select defaultValue="Rwanda"><option>Rwanda</option><option>Kenya</option></Select></Field>
            <Field label="Financial year end" id="le-fye"><Select defaultValue="31 December"><option>31 December</option><option>30 June</option></Select></Field>
            <Field label="Functional currency" id="le-fc"><Select defaultValue="USD"><option>USD</option><option>RWF</option></Select></Field>
            <Field label="Presentation currency" id="le-pc"><Select defaultValue="USD"><option>USD</option><option>RWF</option></Select></Field>
            <Field label="Framework" id="le-fw" help="Other frameworks are coming soon."><Select defaultValue="ifrs16"><option value="ifrs16">IFRS 16 (2019 edition)</option></Select></Field>
            <div className="flex flex-col gap-1.5"><span className="text-small text-fg-body">Lessee / lessor</span><ToggleGroup label="Lessee or lessor" value={mode} onChange={setMode} options={[{ value: "lessee", label: "Lessee" }, { value: "lessor", label: "Lessor (soon)" }]} /></div>
          </div>}
          {cur === "gl" && <>
            <div className="relative overflow-x-auto rounded-card border border-line"><table className="w-full min-w-[520px] text-small"><caption className="sr-only">Account mapping</caption>
              <thead><tr className="border-b border-line text-fg-muted">{["Purpose", "GL account", "Name"].map((h) => <th key={h} scope="col" className="px-4 py-2 text-left font-normal">{h}</th>)}</tr></thead>
              <tbody>{leaseData.glMapping.map(([p, , n], i) => <tr key={p} className="border-b border-line last:border-0"><td className="px-4 py-2 text-fg-body">{p}</td><td className="px-4 py-2"><Input aria-label={`GL account for ${p}`} value={gl[i]} invalid={i === dupe} onChange={(e) => setGl((g) => g.map((x, j) => (j === i ? e.target.value : x)))} className="h-8 font-mono" />{i === dupe && <p className="mt-1 text-micro text-negative">Account {gl[i]} is already used for {leaseData.glMapping[gl.indexOf(gl[i])][0]}</p>}</td><td className="px-4 py-2 text-fg-muted">{n}</td></tr>)}</tbody>
            </table></div>
            <Button variant="link" size="sm" className="self-start" onClick={() => toast("Chart of accounts import opens here")}>Import chart of accounts (CSV)</Button>
          </>}
          {cur === "periods" && <>
            <ol className="flex flex-wrap gap-2">{MONTHS.map((m, i) => <li key={m} className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-micro", i < 9 ? "border-line text-fg-muted" : i === 9 ? "border-positive/50 bg-positive-tint text-fg" : "border-line text-fg-subtle")}>{i < 9 && <Lock className="size-3" />}{m}{i === 9 && " · Open"}</li>)}</ol>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="First period to open" id="pe-first"><Select defaultValue="Oct 2026"><option>Oct 2026</option></Select></Field><Field label="Opening balances as of" id="pe-ob"><Input defaultValue="30 Sep 2026" /></Field></div>
            <Banner tone="info">Locked periods cannot change. Reopening needs a reason and is logged.</Banner>
          </>}
          {cur === "policies" && <div className="flex flex-col gap-4">
            <Switch checked={shortTerm} onCheckedChange={setShortTerm} label="Apply short-term exemption (≤ 12 months)" description="Expense the payments; no ROU or liability." />
            <Switch checked={lowValue} onCheckedChange={setLowValue} label="Apply low-value exemption" />
            {lowValue && <Field label="Low-value threshold · USD" id="po-th" className="max-w-xs"><NumberInput kind="money" defaultValue={5000} /></Field>}
            <Switch checked={nonLease} onCheckedChange={setNonLease} label="Separate non-lease components" />
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Depreciation method" id="po-dep"><Select defaultValue="sl"><option value="sl">Straight-line</option></Select></Field><Field label="Rounding" id="po-r"><Select defaultValue="2"><option value="2">2 decimals, last period absorbs residual</option></Select></Field></div>
            <div className="flex flex-col gap-1.5"><span className="text-small text-fg-body">Day-count convention</span><ToggleGroup label="Day count" value={dayCount} onChange={setDayCount} options={[{ value: "periodic", label: "Periodic" }, { value: "act365", label: "Actual/365" }]} /></div>
          </div>}
          {cur === "rates" && <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="flex flex-col gap-3"><p className="text-small text-fg">USD incremental borrowing rate — Oct 2026</p>
              <table className="text-small tabular-nums"><caption className="sr-only">Rate curve</caption><thead><tr className="text-fg-muted"><th scope="col" className="py-1 text-left font-normal">Term</th><th scope="col" className="py-1 text-right font-normal">Rate</th></tr></thead><tbody>{leaseData.rateCurve.map(([y, r]) => <tr key={y} className="border-t border-line"><td className="py-1.5">{y} yr{y > 1 ? "s" : ""}</td><td className="py-1.5 text-right">{(r * 100).toFixed(2)} %</td></tr>)}</tbody></table>
              <p className="text-micro text-fg-muted">Effective from 1 Oct 2026</p>
              {step.status === "pending" && <div className="rounded-card border border-line p-3 text-micro"><p className="mb-1 text-fg">3 values changed</p>{[["3 yrs", "9.25 %", "9.50 %"], ["5 yrs", "9.80 %", "10.00 %"], ["7 yrs", "10.10 %", "10.40 %"]].map(([t, a, b]) => <p key={t} className="font-mono"><span className="text-fg-muted">{t} </span><span className="text-fg-subtle line-through">{a}</span> → <span className="text-fg">{b}</span></p>)}</div>}
            </div>
            <TimeSeries title="Rate curve" data={leaseData.rateCurve.map(([y, r]) => ({ term: `${y}y`, rate: r * 100 }))} x="term" format={(v) => `${v.toFixed(1)} %`} series={[{ key: "rate", label: "IBR", color: "var(--chart-1)", value: "rate" }]} height={180} />
          </div>}
          <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
            {step.status === "pending" ? <Button variant="ghost" onClick={() => { setSteps((x) => x.map((s) => (s.id === cur ? { ...s, status: "draft" } : s))); toast("Submission withdrawn"); }}>Withdraw submission</Button>
              : step.status === "approved" ? <p className="text-small text-fg-muted">Approved. Changes create a new version for approval.</p>
              : <><Button variant="ghost" onClick={() => toast.success("Draft saved")}>Save draft</Button><Button disabled={cur === "gl" && dupe >= 0} disabledReason={cur === "gl" && dupe >= 0 ? "Fix the duplicate account first" : undefined} onClick={submit}>Submit for approval</Button></>}
          </div>
        </section>
      </div>
      {approved === 5 && <Banner tone="positive" action={<Button asChild size="sm"><Link href="/leases/new">New lease</Link></Button>}>Setup complete. You can add leases now.</Banner>}
    </div>
  );
}
