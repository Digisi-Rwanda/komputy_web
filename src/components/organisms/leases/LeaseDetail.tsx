"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Download, Eye, FileText, Lock, Upload } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { IconButton } from "@/components/atoms/IconButton";
import { Money } from "@/components/atoms/Numbers";
import { StatusPill } from "@/components/atoms/StatusPill";
import { MetaChip } from "@/components/atoms/Chip";
import { Banner } from "@/components/molecules/Banner";
import { DropdownMenu } from "@/components/molecules/Overlays";
import { HeroMetric, KeyValue, StatCard } from "@/components/molecules/StatCard";
import { SegmentedTabs, ToggleGroup } from "@/components/molecules/Tabs";
import { AuditTimeline } from "@/components/organisms/AuditTimeline";
import { PageHeader } from "@/components/organisms/PageHeader";
import { Sheet } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { TimeSeries } from "@/components/organisms/TimeSeries";
import { download, toCsv } from "@/lib/csv";
import { calculate } from "@/lib/lease";
import { date, money } from "@/lib/format";
import { leaseData } from "@/data/mock/index";
import type { Lease } from "@/types/domain";
import { AddEvent } from "@/components/organisms/leases/AddEvent";
import { LEASE_STATUS } from "@/components/organisms/leases/Register";

const TABS = [["summary", "Summary"], ["schedule", "Schedule"], ["journals", "Journals"], ["events", "Events & versions"], ["documents", "Documents"], ["audit", "Audit"]] as const;

/** LB-03/LB-04 lease detail with tabs; schedule recomputed by the engine from the lease terms. */
export function LeaseDetail({ lease, tab }: { lease: Lease; tab: string }) {
  const terms = useMemo(() => (lease.start && lease.end && lease.rate && !lease.exempt ? { commencement: lease.start, end: lease.end, payment: lease.id === "LSE-0087" ? 10000 : Math.round(((lease.liability ?? 0) * lease.rate) / (1 - (1 + lease.rate) ** -Math.max(1, Number(lease.end.slice(0, 4)) - Number(lease.start.slice(0, 4)) + 1))), frequency: "annual" as const, timing: "arrears" as const, rate: lease.rate } : null), [lease]);
  const calc = useMemo(() => (terms ? calculate(terms) : null), [terms]);
  const [view, setView] = useState("annual");
  const [pending, setPending] = useState<string | null>(null);
  const [doc, setDoc] = useState<string | null>(null);
  const isFirst = lease.id === "LSE-0087";
  const exportSchedule = () => calc && download(`${lease.id}-schedule.csv`, toCsv([["Year", "Opening", "Interest", "Payment", "Closing", "Depreciation", "ROU carrying"], ...calc.rows.map((r) => [r.year, r.opening, r.interest, r.payment, r.closing, r.depreciation, r.rou])]));
  return (
    <>
      <PageHeader crumbs={[{ label: "Lease Accounting", href: "/leases" }, { label: "Register", href: "/leases/register" }, { label: lease.id }]} title={lease.name}
        status={<StatusPill tone={LEASE_STATUS[lease.status][0]}>{LEASE_STATUS[lease.status][1]}</StatusPill>}
        meta={<><MetaChip>{lease.id}</MetaChip><MetaChip>IFRS 16</MetaChip>{isFirst && <MetaChip>{pending ? "v2 · v3 pending" : "v2"}</MetaChip>}</>}
        description={`${lease.counterparty} · ${lease.assetClass} · ${lease.entity}`}
        actions={<>
          <Button variant="secondary" icon={<Download />} disabled={!calc} onClick={exportSchedule}>Export schedule</Button>
          {calc && <AddEvent lease={lease} closingBefore={calc.rows.at(-2)?.closing ?? calc.liability} onSubmitted={(t) => setPending(t)} />}
          <DropdownMenu trigger={<IconButton label="More actions" variant="secondary"><Icon name="more" /></IconButton>} items={[{ label: "Duplicate", onSelect: () => toast("Draft duplicated") }, { label: "Withdraw", disabled: lease.status !== "submitted", onSelect: () => toast("Submission withdrawn") }, { label: "Terminate", danger: true, separatorBefore: true, onSelect: () => toast("Opens Add event · Full termination") }]} />
        </>}
        tabs={<SegmentedTabs label="Lease sections" active={`/leases/register/${lease.id}/${tab}`} items={TABS.map(([t, l]) => ({ label: l, href: `/leases/register/${lease.id}/${t}`, count: t === "events" ? (isFirst ? 2 : 1) : t === "documents" ? (isFirst ? 3 : 0) || undefined : undefined }))} />} />

      {pending && <Banner tone="warning" action={<><Button size="sm" variant="secondary" onClick={() => { setPending(null); toast("Returned to Eric Uwase"); }}>Return</Button><Button size="sm" onClick={() => { setPending(null); toast.success("Extension approved — schedule v3 created"); }}>Approve</Button></>}>{pending} awaiting approval · submitted by Eric Uwase</Banner>}
      {lease.exempt && <Banner tone="info">Exempt ({lease.exempt}) — payments are expensed; no schedule or journals on the balance sheet.</Banner>}

      {tab === "summary" && <>
        <HeroMetric label="Lease liability · 31 Oct 2026" currency="USD" value={<Money value={lease.liability ?? 0} />} sub={lease.start && lease.start > "2026-10-31" ? `Commences ${date(lease.start)}` : lease.end ? `Ends ${date(lease.end)}` : undefined} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="ROU asset" value={money(lease.rouAsset ?? 0)} />
          <StatCard label="Rate" value={lease.rate ? `${(lease.rate * 100).toFixed(2)} %` : "—"} meta={isFirst ? "Override · justified" : "Curve rate"} />
          <StatCard label="Term" value={calc ? `${calc.months} months` : "—"} meta={lease.end ? `Ends ${date(lease.end)}` : undefined} />
          <StatCard label="Next payment" value={calc ? money(calc.rows[0].payment) : "—"} meta={calc ? `31 Dec ${calc.rows[0].year}` : undefined} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-panel border border-line p-5"><h3 className="mb-4 text-h4">Contract</h3><KeyValue columns={2} items={[["Counterparty", lease.counterparty], ["Contract ref", isFirst ? "KHP-2026-114" : "—"], ["Location", isFirst ? "KN 4 Ave, Kigali" : "—"], ["Signed", isFirst ? "15 Nov 2026" : "—"], ["Options", isFirst ? "Renewal 2 yrs · not reasonably certain" : "None"]]} /></section>
          <section className="rounded-panel border border-line p-5"><h3 className="mb-4 text-h4">Approval</h3><KeyValue columns={1} items={[["Submitted", `${lease.createdBy} · 16 Nov 2026 14:02`], ["Approved", lease.status === "submitted" ? "Pending" : "Jean Habimana · 17 Nov 2026 09:41"], ["Comment", isFirst ? "Override rate verified against TM-2026-31." : "—"]]} /></section>
        </div>
      </>}

      {tab === "schedule" && (calc ? <>
        <div className="flex flex-wrap items-center gap-3"><ToggleGroup label="Schedule view" value={view} onChange={setView} options={[{ value: "annual", label: "Annual" }, { value: "monthly", label: "Monthly" }]} /></div>
        <div className="rounded-panel border border-line p-5"><TimeSeries title="Liability and ROU" height={180} format="compact" x="y" data={[{ y: String(calc.rows[0].year), l: calc.liability, r: calc.rou }, ...calc.rows.map((r) => ({ y: String(r.year + 1), l: r.closing, r: r.rou }))]} series={[{ key: "l", label: "Liability", color: "var(--chart-1)", value: "l" }, { key: "r", label: "ROU", color: "var(--chart-6)", value: "r" }]} /></div>
        {view === "monthly" ? <Banner tone="info">Monthly view spreads each annual payment period across months. Payments are annual in arrears for this lease, so interest accrues monthly and is paid each 31 Dec.</Banner> : null}
        <div className="relative overflow-x-auto rounded-panel border border-line"><table className="w-full min-w-[680px] text-small tabular-nums"><caption className="sr-only">Amortisation schedule</caption>
          <thead className="sticky top-0 bg-canvas"><tr className="border-b border-line text-fg-muted">{["Period", "Opening", "Interest", "Payment", "Closing", "Depreciation", "ROU carrying"].map((h, i) => <th key={h} scope="col" className={`px-4 py-2 font-normal ${i ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
          <tbody>{calc.rows.map((r, i) => <tr key={r.year} className={`border-b border-line ${i === 0 ? "bg-info-tint/40 shadow-[inset_2px_0_0_var(--accent)]" : ""}`}><td className="px-4 py-2.5">{r.year}</td>{[r.opening, r.interest, r.payment, r.closing, r.depreciation, r.rou].map((x, j) => <td key={j} className="px-4 text-right">{money(x)}</td>)}</tr>)}
            <tr><td className="px-4 py-2.5 text-fg">Total interest</td><td /><td className="px-4 text-right text-fg">{money(calc.totalInterest)}</td><td colSpan={4} /></tr></tbody></table></div>
        {calc.rows.length > 1 && <div className="rounded-panel border border-line p-5"><p className="mb-3 text-small text-fg">Current / non-current split at 31 Dec {calc.rows[0].year}</p><div className="flex h-2 overflow-hidden rounded-full"><span className="bg-accent" style={{ width: `${((calc.rows[0].closing - calc.rows[1].closing) / calc.rows[0].closing) * 100}%` }} /><span className="flex-1 bg-surface-active" /></div><p className="mt-2 text-micro text-fg-muted">Current {money(calc.rows[0].closing - calc.rows[1].closing)} · Non-current {money(calc.rows[1].closing)}</p></div>}
        <p className="font-mono text-micro text-fg-muted">Calculated by leases-1.0.0 · last period absorbs rounding</p>
      </> : <Banner tone="info">No schedule — {lease.status === "draft" ? "the draft isn't complete yet" : "exempt lease"}.</Banner>)}

      {tab === "journals" && (calc ? <>
        <div className="relative overflow-x-auto rounded-panel border border-line"><table className="w-full min-w-[680px] text-small tabular-nums"><caption className="sr-only">Journal entries</caption>
          <thead><tr className="border-b border-line text-fg-muted">{["Date", "Account", "Debit", "Credit", "Batch", "Status"].map((h, i) => <th key={h} scope="col" className={`px-4 py-2 font-normal ${i === 2 || i === 3 ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
          <tbody>{[[`1 Jan ${calc.rows[0].year}`, "1610-100 ROU asset", calc.rou, 0, "posted"], [`1 Jan ${calc.rows[0].year}`, "2410-200 Lease liability", 0, calc.liability, "posted"], [`31 Dec ${calc.rows[0].year}`, "7110-300 Interest expense", calc.rows[0].interest, 0, "scheduled"], [`31 Dec ${calc.rows[0].year}`, "2410-200 Lease liability", 0, calc.rows[0].interest, "scheduled"], [`31 Dec ${calc.rows[0].year}`, "2410-200 Lease liability", calc.rows[0].payment, 0, "scheduled"], [`31 Dec ${calc.rows[0].year}`, "2010-500 Cash clearing", 0, calc.rows[0].payment, "scheduled"], [`31 Dec ${calc.rows[0].year}`, "6420-100 Depreciation", calc.rows[0].depreciation, 0, "scheduled"], [`31 Dec ${calc.rows[0].year}`, "1610-900 Accumulated depreciation", 0, calc.rows[0].depreciation, "scheduled"]].map(([d, a, dr, cr, st], i) => (
            <tr key={i} className="border-b border-line last:border-0"><td className="px-4 py-2.5">{d}</td><td className="px-4 font-mono text-micro">{a}</td><td className="px-4 text-right">{dr ? money(dr as number) : "—"}</td><td className="px-4 text-right">{cr ? money(cr as number) : "—"}</td><td className="px-4 font-mono text-micro">JB-{calc.rows[0].year}-{i < 2 ? "01" : "12"}</td><td className="px-4"><StatusPill tone={st === "posted" ? "positive" : "neutral"}>{st === "posted" ? "Posted" : "Scheduled"}</StatusPill></td></tr>))}</tbody></table></div>
        <Badge tone="positive" className="w-fit">Debits = Credits ✓</Badge>
      </> : <Banner tone="info">No journals for this lease.</Banner>)}

      {tab === "events" && <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ol className="relative flex flex-col gap-5 border-l border-line pl-6">
          {pending && <li className="relative rounded-card border border-warning/40 bg-warning-tint p-3 text-small text-fg"><span className="absolute -left-[31px] top-4 size-2.5 rounded-full bg-warning" />{pending} · awaiting approval</li>}
          {(isFirst ? leaseData.leaseEvents : leaseData.leaseEvents.slice(1)).map((e) => <li key={e.v} className="relative"><span className="absolute -left-[29px] top-1.5 size-2.5 rounded-full bg-fg-muted" /><p className="text-small text-fg"><Badge className="mr-2">{e.v}</Badge>{e.title}</p><p className="font-mono text-micro text-fg-muted">{date(e.at.slice(0, 10))} · {e.by}</p></li>)}
        </ol>
        {isFirst && <section className="rounded-panel border border-line p-5"><h3 className="mb-3 text-h4">Compare versions</h3><dl className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 text-small tabular-nums"><span className="text-micro text-fg-muted" /><span className="text-micro text-fg-muted">v1</span><span className="text-micro text-fg-muted">v2</span>
          <dt className="text-fg-body">Rate</dt><dd className="text-fg-subtle line-through">9.50 %</dd><dd className="text-fg">10.00 %</dd>
          <dt className="text-fg-body">Liability</dt><dd className="text-fg-subtle line-through">25,174.10</dd><dd className="text-fg">24,868.52</dd></dl></section>}
      </div>}

      {tab === "documents" && <div className="flex flex-col gap-4">
        <button type="button" onClick={() => toast("Choose a PDF, XLSX or DOCX up to 10 MB")} className="flex items-center justify-center gap-2 rounded-panel border border-dashed border-line-strong p-6 text-small text-fg-muted hover:text-fg"><Upload className="size-4" />Drag and drop files here, or browse · PDF, XLSX, DOCX up to 10 MB</button>
        <ul className="divide-y divide-line rounded-panel border border-line">{(isFirst ? leaseData.leaseDocs : []).map(([n, s, by]) => <li key={n} className="flex flex-wrap items-center gap-3 px-5 py-3"><FileText aria-hidden className="size-4 text-fg-muted" /><span className="min-w-0 flex-1"><span className="block text-small text-fg">{n}</span><span className="block text-micro text-fg-muted">{s} · uploaded by {by}</span></span><Button size="sm" variant="ghost" icon={<Eye />} onClick={() => setDoc(n)}>Preview</Button><Button size="sm" variant="ghost" icon={<Download />} onClick={() => toast.success(`${n} downloaded`)}>Download</Button></li>)}
          {!isFirst && <li className="px-5 py-6 text-center text-small text-fg-muted">No documents yet.</li>}</ul>
        <Sheet open={doc !== null} onOpenChange={(o) => !o && setDoc(null)} title={doc ?? ""}><div className="flex aspect-[1/1.4] flex-col gap-2 rounded-md bg-white p-6">{Array.from({ length: 14 }, (_, i) => <span key={i} className="h-2 rounded bg-neutral-300" style={{ width: `${60 + ((i * 17) % 40)}%` }} />)}</div><p className="mt-3 text-center font-mono text-micro text-fg-muted">1 / 6</p></Sheet>
      </div>}

      {tab === "audit" && <AuditTimeline events={isFirst ? leaseData.leaseAudit : leaseData.leaseAudit.slice(-1).map((e) => ({ ...e, object: lease.id }))} />}

      {lease.status === "approved" && tab === "summary" && <p className="flex items-center gap-2 text-micro text-fg-muted"><Lock className="size-3.5" />Approved leases change only through events, which create a new version. <CheckCircle2 className="size-3.5 text-positive" /></p>}
      <Link href="/leases/register" className="w-fit text-small text-link hover:underline">← Back to register</Link>
    </>
  );
}
