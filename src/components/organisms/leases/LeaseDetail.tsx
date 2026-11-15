"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { CheckCircle2, Download, FileText, Lock, Upload } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Money } from "@/components/atoms/Numbers";
import { StatusPill } from "@/components/atoms/StatusPill";
import { MetaChip } from "@/components/atoms/Chip";
import { Banner } from "@/components/molecules/Banner";
import { HeroMetric, KeyValue, StatCard } from "@/components/molecules/StatCard";
import { SegmentedTabs, ToggleGroup } from "@/components/molecules/Tabs";
import { AuditTimeline } from "@/components/organisms/AuditTimeline";
import { PageHeader } from "@/components/organisms/PageHeader";
import { toast } from "@/components/organisms/Toaster";
import { TimeSeries } from "@/components/organisms/TimeSeries";
import { download, toCsv } from "@/lib/csv";
import { bytes, date, money, month } from "@/lib/format";
import { uploadLeaseDocument, withdrawLease } from "@/lib/actions/leases";
import { useLeaseData } from "@/components/organisms/leases/LeaseData";
import type { Lease } from "@/types/domain";
import type { LeaseView } from "@/server/dal/leases";
import { AddEvent } from "@/components/organisms/leases/AddEvent";
import { LEASE_STATUS } from "@/components/organisms/leases/Register";
import { showCode } from "@/lib/code";

const TABS = [["summary", "Summary"], ["schedule", "Schedule"], ["journals", "Journals"], ["events", "Events & versions"], ["documents", "Documents"], ["audit", "Audit"]] as const;
const n = (v: unknown) => Number(v ?? 0);

/** LB-03/LB-04 lease detail: everything from the engine's books for the approved chain (schedule, journals, versions). */
export function LeaseDetail({ lease, tab, view }: { lease: Lease; tab: string; view: LeaseView | null }) {
  const b = useLeaseData(), router = useRouter();
  const [busy, start] = useTransition();
  const [period, setPeriod] = useState("annual");
  const file = useRef<HTMLInputElement>(null);
  const L = view?.lease ?? {};
  const versions: { n: number; status: string; event: string; effectiveDate: string; reason: string; createdBy: string; createdAt: string; decidedBy?: string; decidedAt?: string; rate?: { value?: string; source?: string }; comments?: { text: string; by: string; at: string }[] }[] = L.versions ?? [];
  const current = versions.filter((v) => v.status === "approved").at(-1) ?? versions.at(-1);
  const pending = versions.find((v) => v.status === "in_review" || v.status === "draft" || v.status === "returned");
  const docs: { id: string; name: string; size: number; uploadedBy: string; uploadedAt: string; kind: string }[] = L.docs ?? [];
  const rows = (period === "annual" ? view?.annual : view?.monthly) ?? [];
  const first = view?.monthly?.[0], nextPay = view?.monthly?.find((r) => r.month > b.period && n(r.payments) > 0);
  const who = (id?: string) => b.members.find((m) => m.id === id)?.name ?? "Someone";
  const audit = b.details[lease.id]?.audit ?? [];
  const exportSchedule = () => download(`${lease.id}-schedule.csv`, toCsv([["Period", "Liability opening", "Interest", "Payments", "Liability closing", "Depreciation", "ROU closing"], ...rows.map((r) => [String(r.month), String(r.liabOpening), String(r.interest), String(r.payments), String(r.liabClosing), String(r.depreciation), String(r.rouClosing)])]));
  const upload = (f: File) => start(async () => {
    const fd = new FormData(); fd.set("file", f); fd.set("kind", "contract");
    const r = await uploadLeaseDocument(L.id, fd);
    if (!r.ok) { toast.error(r.error); return; }
    toast.success(`${f.name} uploaded`); router.refresh();
  });
  const canEvent = Boolean(view?.monthly?.length) && !view?.exempt && !pending && lease.status !== "terminated";

  return (
    <>
      <PageHeader crumbs={[{ label: "Lease Accounting", href: "/leases" }, { label: "Register", href: "/leases/register" }, { label: lease.id }]} title={lease.name}
        status={<StatusPill tone={LEASE_STATUS[lease.status][0]}>{LEASE_STATUS[lease.status][1]}</StatusPill>}
        meta={<><MetaChip>{showCode(lease.id)}</MetaChip><MetaChip>IFRS 16</MetaChip>{current && <MetaChip>v{current.n}{pending && pending !== current ? ` · v${pending.n} pending` : ""}</MetaChip>}</>}
        description={`${lease.counterparty} · ${lease.assetClass} · ${lease.entity}`}
        actions={<>
          <Button variant="secondary" icon={<Download />} disabled={!rows.length} onClick={exportSchedule}>Export schedule</Button>
          {canEvent && <AddEvent leaseId={L.id} rev={L.rev} currency={L.currency ?? b.currency} />}
          {pending?.status === "in_review" && pending.createdBy === b.me && <Button variant="ghost" loading={busy} onClick={() => start(async () => { const r = await withdrawLease(L.id, L.rev); if (!r.ok) toast.error(r.error); else { toast.success("Submission withdrawn"); router.refresh(); } })}>Withdraw</Button>}
        </>}
        tabs={<SegmentedTabs label="Lease sections" active={`/leases/register/${lease.id}/${tab}`} items={TABS.map(([t, l]) => ({ label: l, href: `/leases/register/${lease.id}/${t}`, count: t === "events" ? versions.length || undefined : t === "documents" ? docs.length || undefined : undefined }))} />} />

      {pending && pending !== current && <Banner tone="warning" action={<Button asChild size="sm" variant="secondary"><Link href="/leases/inbox">Open inbox</Link></Button>}>v{pending.n} ({pending.event}) is {pending.status.replace("_", " ")}{pending.status === "in_review" ? ". A reviewer approves it in the Inbox" : ""}.</Banner>}
      {view?.exempt && <Banner tone="info">Exempt ({lease.exempt ?? "short-term / low-value"}): payments are expensed; no ROU asset or liability on the balance sheet.</Banner>}

      {tab === "summary" && <>
        <HeroMetric label={`Lease liability · ${month(b.period)}`} currency={L.currency ?? b.currency} value={<Money value={lease.liability ?? 0} />} sub={lease.start && lease.start > `${b.period}-31` ? `Commences ${date(lease.start)}` : lease.end ? `Ends ${date(lease.end)}` : undefined} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="ROU asset" value={money(lease.rouAsset ?? 0)} />
          <StatCard label="Rate" value={lease.rate ? `${(lease.rate * 100).toFixed(2)} %` : "Not set"} meta={current?.rate?.source === "override" ? "Override · justified" : "Curve rate"} />
          <StatCard label="Term" value={view?.monthly?.length ? `${view.monthly.length} months` : "Not set"} meta={lease.end ? `Ends ${date(lease.end)}` : undefined} />
          <StatCard label="Next payment" value={nextPay ? money(n(nextPay.payments)) : "None"} meta={nextPay ? `${nextPay.month}` : undefined} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-panel border border-line p-5"><h3 className="mb-4 text-h4">Contract</h3><KeyValue columns={2} items={[["Counterparty", view?.counterparty ?? lease.counterparty], ["Cost centre / ref", L.costCentre || "Not set"], ["Location", L.location || "Not set"], ["Commencement", lease.start ? date(lease.start) : "Not set"], ["Initial liability", first ? money(n(first.liabOpening) + n(first.additions)) : "Not calculated"]]} /></section>
          <section className="rounded-panel border border-line p-5"><h3 className="mb-4 text-h4">Approval</h3><KeyValue columns={1} items={[["Prepared", current ? `${who(current.createdBy)} · ${current.createdAt ? date(current.createdAt) : ""}` : "Not yet"], ["Decision", current?.decidedBy ? `${who(current.decidedBy)} · ${current.decidedAt ? date(current.decidedAt) : ""}` : "Pending"], ["Comment", current?.comments?.at(-1)?.text ?? "None"]]} /></section>
        </div>
      </>}

      {tab === "schedule" && (rows.length ? <>
        <div className="flex flex-wrap items-center gap-3"><ToggleGroup label="Schedule view" value={period} onChange={setPeriod} options={[{ value: "annual", label: "Annual (FY)" }, { value: "monthly", label: "Monthly" }]} /></div>
        <div className="rounded-panel border border-line p-5"><TimeSeries title="Liability and ROU" height={180} format="compact" x="y" data={(view?.annual ?? []).map((r) => ({ y: String(r.month), l: n(r.liabClosing), r: n(r.rouClosing) }))} series={[{ key: "l", label: "Liability", color: "var(--chart-1)", value: "l" }, { key: "r", label: "ROU", color: "var(--chart-6)", value: "r" }]} /></div>
        <div className="relative max-h-[60vh] overflow-auto rounded-panel border border-line"><table className="w-full min-w-[760px] text-small tabular-nums"><caption className="sr-only">Amortisation schedule</caption>
          <thead className="sticky top-0 bg-canvas"><tr className="border-b border-line text-fg-muted">{["Period", "Opening", "Interest", "Payments", "Closing", "Depreciation", "ROU carrying"].map((h, i) => <th key={h} scope="col" className={`px-4 py-2 font-normal ${i ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r) => <tr key={String(r.month)} className={`border-b border-line ${r.hasEvent ? "bg-warning-tint/40" : ""}`}><td className="px-4 py-2">{String(r.month)}{r.hasEvent && <Badge tone="warning" className="ml-2">event</Badge>}</td>{[r.liabOpening, r.interest, r.payments, r.liabClosing, r.depreciation, r.rouClosing].map((x, j) => <td key={j} className="px-4 text-right">{money(n(x))}</td>)}</tr>)}</tbody></table></div>
        <p className="font-mono text-micro text-fg-muted">Calculated by {view?.engineVersion ?? "the engine"} · {view?.computedAt ? date(view.computedAt) : ""} · last period absorbs rounding</p>
      </> : <Banner tone="info">No schedule yet: {lease.status === "draft" || lease.status === "submitted" ? "it's created when the lease is approved" : "exempt lease"}.</Banner>)}

      {tab === "journals" && ((view?.journals ?? []).length ? <>
        <div className="relative max-h-[60vh] overflow-auto rounded-panel border border-line"><table className="w-full min-w-[680px] text-small tabular-nums"><caption className="sr-only">Journal entries</caption>
          <thead className="sticky top-0 bg-canvas"><tr className="border-b border-line text-fg-muted">{["Date", "Entry", "Account", "Debit", "Credit"].map((h, i) => <th key={h} scope="col" className={`px-4 py-2 font-normal ${i > 2 ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
          <tbody>{(view!.journals as { date: string; memo: string; kind: string; account: string; debit: string; credit: string }[]).map((l, i, all) => {
            const first = i === 0 || all[i - 1].date !== l.date || all[i - 1].kind !== l.kind;
            return <tr key={i} className={`border-b border-line last:border-0 ${first ? "" : "text-fg-body"}`}><td className="px-4 py-2">{first ? l.date : ""}</td><td className="px-4 text-fg-body">{first ? l.memo : ""}</td><td className="px-4 font-mono text-micro">{l.account}</td><td className="px-4 text-right">{n(l.debit) ? money(n(l.debit)) : ""}</td><td className="px-4 text-right">{n(l.credit) ? money(n(l.credit)) : ""}</td></tr>;
          })}</tbody></table></div>
        <Badge tone="positive" className="w-fit">Every entry balances (engine checked)</Badge>
      </> : <Banner tone="info">No journals for this lease yet.</Banner>)}

      {tab === "events" && <ol className="relative flex flex-col gap-5 border-l border-line pl-6">
        {[...versions].reverse().map((v) => <li key={v.n} className="relative"><span className={`absolute -left-[29px] top-1.5 size-2.5 rounded-full ${v.status === "approved" ? "bg-positive" : "bg-warning"}`} />
          <p className="text-small text-fg"><Badge className="mr-2">v{v.n}</Badge>{v.n === 1 ? "Initial recognition" : `Event · ${v.event}`} · {v.status.replace("_", " ")}{v.effectiveDate && v.n > 1 ? ` · effective ${date(v.effectiveDate)}` : ""}</p>
          <p className="font-mono text-micro text-fg-muted">{who(v.createdBy)} · {v.createdAt ? date(v.createdAt) : ""}{v.decidedBy ? ` · decided by ${who(v.decidedBy)}` : ""}</p>
          {v.reason && <p className="text-micro text-fg-muted">“{v.reason}”</p>}</li>)}
        {!versions.length && <li className="text-small text-fg-muted">No versions.</li>}
      </ol>}

      {tab === "documents" && <div className="flex flex-col gap-4">
        <input ref={file} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="sr-only" aria-label="Upload document" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f); }} />
        <button type="button" disabled={busy} onClick={() => file.current?.click()} className="flex items-center justify-center gap-2 rounded-panel border border-dashed border-line-strong p-6 text-small text-fg-muted hover:text-fg"><Upload className="size-4" />{busy ? "Uploading…" : "Upload a document · PDF or image up to 25 MB"}</button>
        <ul className="divide-y divide-line rounded-panel border border-line">{docs.map((d) => <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3"><FileText aria-hidden className="size-4 text-fg-muted" /><span className="min-w-0 flex-1"><span className="block text-small text-fg">{d.name}</span><span className="block text-micro text-fg-muted">{bytes(d.size)} · uploaded by {who(d.uploadedBy)} · {d.uploadedAt?.slice(0, 10)}</span></span><Button asChild size="sm" variant="ghost" icon={<Download />}><a href={`/api/leases/${L.id}/documents/${d.id}`}>Download</a></Button></li>)}
          {!docs.length && <li className="px-5 py-6 text-center text-small text-fg-muted">No documents yet.</li>}</ul>
      </div>}

      {tab === "audit" && <AuditTimeline events={audit} />}

      {lease.status === "approved" && tab === "summary" && <p className="flex items-center gap-2 text-micro text-fg-muted"><Lock className="size-3.5" />Approved leases change only through events, which create a new version. <CheckCircle2 className="size-3.5 text-positive" /></p>}
      <Link href="/leases/register" className="w-fit text-small text-link hover:underline">← Back to register</Link>
    </>
  );
}
