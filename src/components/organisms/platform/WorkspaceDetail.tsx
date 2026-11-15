"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { MetaChip } from "@/components/atoms/Chip";
import { Icon } from "@/components/atoms/Icon";
import { IconButton } from "@/components/atoms/IconButton";
import { Select } from "@/components/atoms/Select";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Textarea } from "@/components/atoms/Textarea";
import { Banner } from "@/components/molecules/Banner";
import { DropdownMenu } from "@/components/molecules/Overlays";
import { KeyValue } from "@/components/molecules/StatCard";
import { SegmentedTabs } from "@/components/molecules/Tabs";
import { Modal } from "@/components/organisms/Modal";
import { PageHeader } from "@/components/organisms/PageHeader";
import { toast } from "@/components/organisms/Toaster";
import { EntitlementDrawer, type EntKind } from "@/components/organisms/platform/EntitlementDrawer";
import { day, STATE, SvcPill } from "@/components/organisms/platform/shared";
import { addWorkspaceNote, endMySupport, requestSupport, resetUserMfa, setAccountManager, setWorkspaceStatus } from "@/lib/actions/platform";
import type { platformWorkspaceDetail } from "@/server/dal/platform";
import type { ActionResult } from "@/server/mutate";
import type { Lead, PWorkspace, ServiceState } from "@/types/domain";

type Detail = Awaited<ReturnType<typeof platformWorkspaceDetail>>;
const LABEL: Record<string, string> = { summary: "Summary", services: "Services", members: "Members", usage: "Usage", requests: "Requests", "support-access": "Support access", audit: "Audit" };
const ACTIONS: [EntKind, string][] = [["trial", "Grant trial"], ["extend", "Extend"], ["units", "Add units"], ["activate", "Activate"], ["suspend", "Suspend"], ["expire", "Expire"]];
const initials = (n: string) => n.split(/[\s.]+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

/** PA3 workspace detail (7 tabs) + PA4 drawers + PA9 staff side of support access. Metadata only, never client data. */
export function WorkspaceDetail({ ws, tab, tabs, detail, leads, staff, me }: { ws: PWorkspace; tab: string; tabs: readonly string[]; detail: Detail; leads: Lead[]; staff: { id: string; name: string }[]; me: string }) {
  const router = useRouter();
  const run = async <T,>(call: Promise<ActionResult<T>>, ok: string) => { const r = await call; if (!r.ok) { toast.error(r.fieldErrors ? Object.values(r.fieldErrors)[0] : r.error); return false; } toast.success(ok); router.refresh(); return true; };
  const base = `/platform/workspaces/${ws.id}`;
  const [suspend, setSuspend] = useState(false), [why, setWhy] = useState("");
  const suspended = detail.tenant.status === "suspended";
  const svcs: ["ECL" | "Leases", ServiceState][] = (["ECL", "Leases"] as const).map((s) => [s, (ws.services.find(([n]) => n === s)?.[1] ?? "locked") as ServiceState]);
  return (
    <>
      <PageHeader crumbs={[{ label: "Workspaces", href: "/platform/workspaces" }, { label: ws.name }]} title={ws.name} status={<span className="flex flex-wrap gap-1.5">{ws.services.map(([s, st]) => <SvcPill key={s} svc={s} state={st} />)}</span>}
        meta={<MetaChip>{detail.tenant.slug.toUpperCase()}</MetaChip>}
        actions={<><Button asChild variant="secondary"><Link href={`${base}/support-access`}>Open support request</Link></Button><DropdownMenu trigger={<IconButton label="More" variant="secondary"><Icon name="more" /></IconButton>} items={[{ label: "Copy workspace ID", onSelect: () => { void navigator.clipboard?.writeText(ws.id); toast.success("Copied"); } }, { label: `Email owner (${ws.email})`, onSelect: () => { void navigator.clipboard?.writeText(ws.email); toast.success("Owner email copied"); } }, { label: detail.tenant.status === "suspended" ? "Reactivate workspace…" : "Suspend workspace…", danger: detail.tenant.status !== "suspended", separatorBefore: true, disabled: detail.tenant.status === "closing", onSelect: () => setSuspend(true) }]} /></>}
        tabs={<SegmentedTabs active={`${base}/${tab}`} items={tabs.map((t) => ({ label: LABEL[t], href: `${base}/${t}` }))} />} />
      <Modal open={suspend} onOpenChange={(o) => { setSuspend(o); if (!o) setWhy(""); }} size="sm" title={suspended ? `Reactivate ${ws.name}?` : `Suspend ${ws.name}?`}
        description={suspended ? "Members can sign in and work again. The owner is emailed." : "Every member is locked out until you reactivate. Data is kept. The owner is emailed."}
        footer={<Button variant={suspended ? "primary" : "danger"} disabled={why.trim().length < 3} disabledReason={why.trim().length < 3 ? "A reason is required" : undefined} onClick={async () => { if (await run(setWorkspaceStatus({ tenantId: ws.id, suspend: !suspended, reason: why.trim() }), suspended ? `${ws.name} reactivated · logged` : `${ws.name} suspended · logged`)) { setSuspend(false); setWhy(""); } }}>{suspended ? "Reactivate" : "Suspend workspace"}</Button>}>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Reason (required, logged)<Textarea value={why} onChange={(e) => setWhy(e.target.value)} maxLength={500} /></label>
      </Modal>
      {tab === "summary" && <Summary ws={ws} detail={detail} staff={staff} run={run} />}
      {tab === "services" && <section className="flex flex-col gap-3">
        <ul className="divide-y divide-line rounded-panel border border-line">{svcs.map(([s, st], i) => {
          const key = s === "ECL" ? "ecl" : "leases", lim = ws.usage.find(([u]) => u === (key === "ecl" ? "runs" : "leases"));
          return (
          <li key={s} className="flex flex-col gap-3 px-5 py-4">
            <div className="flex flex-wrap items-center gap-3"><span className="text-small text-fg">{s === "ECL" ? "Expected Credit Loss" : "Lease Accounting"}</span><StatusPill tone={STATE[st][0]}>{st === "locked" ? "Not enabled" : STATE[st][1]}</StatusPill>{ws.trialEnds && st === "trial" && <span className="font-mono text-micro text-fg-muted">ends {day(ws.trialEnds)}</span>}
              {lim && <span className="font-mono text-micro text-fg-muted">limit {lim[2]} {lim[0]}</span>}</div>
            <div className="flex flex-wrap gap-2">{ACTIONS.filter(([k]) => (k === "extend" ? st === "trial" : k === "trial" ? ["locked", "requested", "trial-expired", "expired"].includes(st) : k === "units" ? st === "active" : k === "activate" ? st !== "active" : ["active", "trial"].includes(st))).map(([k, l]) => (
              <EntitlementDrawer key={k + i} kind={k} ws={ws.name} tenantId={ws.id} service={key} trigger={<Button size="sm" variant={k === "suspend" || k === "expire" ? "outline" : k === "activate" ? "primary" : "secondary"}>{l}</Button>} />))}</div>
          </li>); })}</ul>
        <p className="text-micro text-fg-muted">Every change is logged and emailed to the workspace owner. Sales staff can propose; platform admins apply.</p>
      </section>}
      {tab === "members" && <div className="relative overflow-x-auto rounded-panel border border-line"><table className="w-full min-w-[760px] text-small"><caption className="sr-only">Members (metadata only)</caption>
        <thead><tr className="border-b border-line text-fg-muted">{["Name", "Role", "MFA", "Last login", ""].map((h, i) => <th key={i} scope="col" className="px-4 py-2.5 text-left font-normal">{h}</th>)}</tr></thead>
        <tbody>{detail.members.map((m) => <tr key={m.id} className="border-b border-line last:border-0"><td className="px-4 py-3"><span className="flex items-center gap-3"><Avatar initials={initials(m.name)} size="sm" /><span><span className="block text-fg">{m.name}</span><span className="block text-micro text-fg-muted">{m.email}{!m.verified && " · unverified"}</span></span></span></td><td className="px-4 capitalize text-fg-body">{m.role}{!m.active && " · disabled"}</td><td className="px-4">{m.mfa ? "On" : <StatusPill tone="warning">Off</StatusPill>}</td><td className="px-4 text-fg-muted">{m.last}</td>
          <td className="px-4 text-right">{m.mfa && <ResetMfa userId={m.id} name={m.name} run={run} />}</td></tr>)}</tbody></table></div>}
      {tab === "usage" && <div className="grid gap-6 lg:grid-cols-2"><KeyValue columns={1} items={[["Members", String(detail.members.length)], ["Members with MFA", String(detail.members.filter((m) => m.mfa).length)], ...ws.usage.map(([u, , lim]) => [`${u} limit`, String(lim)] as [string, string]), ["Last activity", ws.last]]} className="h-fit rounded-panel border border-line p-5" />
        {/* shortcut: run / lease counts and storage come from the engine usage endpoints (plan Phase 5). */}
        <p className="h-fit rounded-panel border border-line p-5 text-small text-fg-muted">Run, lease and storage usage appear here once the engine connection is live. Staff only ever see counts, never client figures.</p></div>}
      {tab === "requests" && <ul className="divide-y divide-line rounded-panel border border-line">{leads.map((l) => <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-small"><span className="font-mono text-micro text-fg-muted">{l.code}</span><span className="flex-1 text-fg">{l.type} · {l.services.join(", ")}{l.size && ` · ${l.size}`}</span><StatusPill tone={l.stage === "won" ? "positive" : l.stage === "lost" ? "neutral" : "info"}>{l.stage[0].toUpperCase() + l.stage.slice(1)}</StatusPill><span className="text-micro text-fg-muted">{l.age}</span></li>)}
        {!leads.length && <li className="px-4 py-6 text-center text-small text-fg-muted">No requests from this workspace.</li>}</ul>}
      {tab === "support-access" && <SupportAccess ws={ws} policy={detail.tenant.supportPolicy} mine={detail.sessions.filter((s) => s.staffId === me)} run={run} />}
      {tab === "audit" && <ul className="divide-y divide-line rounded-panel border border-line">{detail.audit.length ? detail.audit.map((a, i) => <li key={i} className="flex flex-wrap items-center gap-3 px-4 py-3 text-small"><span className="w-28 font-mono text-micro text-fg-muted">{day(a.at)}</span><span className="text-fg">{a.actor}</span><span className="flex-1 text-fg-body">{a.action.replace(/_/g, " ")}{a.detail && ` · ${a.detail}`}</span>{a.reason && <span className="text-micro text-fg-muted">“{a.reason}”</span>}</li>) : <li className="px-4 py-6 text-center text-small text-fg-muted">No platform actions on this workspace yet.</li>}</ul>}
    </>
  );
}

type Run = <T>(call: Promise<ActionResult<T>>, ok: string) => Promise<boolean>;

function ResetMfa({ userId, name, run }: { userId: string; name: string; run: Run }) {
  const [open, setOpen] = useState(false), [note, setNote] = useState("");
  return (
    <Modal open={open} onOpenChange={setOpen} size="sm" title={`Reset MFA for ${name}?`} description="They'll set up a new authenticator at next sign-in. All their sessions end now." trigger={<Button size="sm" variant="ghost">Reset MFA…</Button>}
      footer={<Button variant="danger" disabled={note.trim().length < 10} disabledReason={note.trim().length < 10 ? "Describe how you verified the person" : undefined} onClick={async () => { if (await run(resetUserMfa({ userId, note }), `MFA reset for ${name} · logged`)) { setOpen(false); setNote(""); } }}>Reset MFA</Button>}>
      <label className="flex flex-col gap-1.5 text-small text-fg-body">Verification note (required, logged)<Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Verified by video call, ticket SUP-…" /></label>
    </Modal>
  );
}

function Summary({ ws, detail, staff, run }: { ws: PWorkspace; detail: Detail; staff: { id: string; name: string }[]; run: Run }) {
  const [note, setNote] = useState("");
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="flex flex-col gap-4 rounded-panel border border-line p-5"><h2 className="text-h4">Owner</h2>
        <div className="flex items-center gap-3"><Avatar initials={initials(ws.owner)} /><span><span className="block text-small text-fg">{ws.owner}</span><span className="block text-micro text-fg-muted">{ws.email || "Owner hasn't joined yet"}</span></span></div>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Account manager<Select defaultValue={detail.tenant.accountManagerId ?? ""} onChange={(e) => run(setAccountManager({ tenantId: ws.id, userId: e.target.value || null }), `Account manager: ${e.target.selectedOptions[0].text}`)} wrapperClassName="w-60"><option value="">Unassigned</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></label>
        <KeyValue columns={2} items={[["Country", ws.country || "-"], ["Plan", detail.tenant.plan], ["Last activity", ws.last], ["Created", day(detail.tenant.createdAt.toISOString())]]} />
      </section>
      <section className="flex flex-col gap-3 rounded-panel border border-line p-5"><h2 className="text-h4">Internal notes</h2><p className="text-micro text-fg-muted">Staff only. Never shown to the client.</p>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
        <Button size="sm" className="w-fit" disabled={!note.trim()} onClick={async () => { if (await run(addWorkspaceNote({ tenantId: ws.id, body: note.trim() }), "Note saved")) setNote(""); }}>Save note</Button>
        <ul className="flex flex-col gap-2 border-t border-line pt-3">{detail.notes.map((n, i) => <li key={i} className="text-small text-fg-body">{n.body}<span className="block text-micro text-fg-muted">{n.by}</span></li>)}</ul>
      </section>
    </div>
  );
}

/** PA9 staff side: request (max 2 h) → waiting for the client → active with countdown → end. Client side is admin/security. */
function SupportAccess({ ws, policy, mine, run }: { ws: PWorkspace; policy: string; mine: Detail["sessions"]; run: Run }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [minutes, setMinutes] = useState<30 | 60 | 120>(120);
  const open = mine.find((s) => s.status === "requested" || s.status === "active");
  const live = open?.status === "active" && open.endsAt ? open : null; // expiry: countdown hits 0 and the cron job ends it
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!live) return;
    const tick = () => setLeft(Math.max(0, Math.floor((Date.parse(live.endsAt!) - Date.now()) / 1000)));
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [live]);
  // While waiting for the client's decision, check every 10 s.
  useEffect(() => { if (open?.status !== "requested") return; const t = setInterval(() => router.refresh(), 10_000); return () => clearInterval(t); }, [open?.status, router]);
  const fmt = (s: number) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
  return (
    <div className="flex flex-col gap-4">
      {live && <Banner tone="info" action={<Button size="sm" variant="secondary" onClick={() => run(endMySupport({ tenantId: ws.id }), "Session ended · logged")}>End session</Button>}>
        <span className="flex flex-wrap items-center gap-2">Support session · {ws.name} · <span className="font-mono">{fmt(left)}</span> left · Read-only · All actions are logged <Badge mono tone="info">STAFF VIEW</Badge></span></Banner>}
      <section className="flex max-w-2xl flex-col gap-4 rounded-panel border border-line p-5">
        <h2 className="text-h4">Request support access</h2>
        <p className="text-small text-fg-muted">{policy === "never" ? "This workspace doesn't allow support access." : policy === "auto" ? "This workspace allows sessions of up to 1 hour automatically; longer ones need an administrator." : "A workspace administrator must approve. Sessions are read-only, time-boxed and fully logged."}</p>
        {open?.status === "requested" ? <div className="flex flex-wrap items-center gap-3"><StatusPill tone="info">Waiting for client approval…</StatusPill><span className="text-micro text-fg-muted">“{open.reason}” · {open.minutes} min</span><Button size="sm" variant="ghost" onClick={() => run(endMySupport({ tenantId: ws.id }), "Request cancelled")}>Cancel request</Button></div>
          : live ? <p className="text-small text-fg-body">Session active: “{live.reason}”.</p>
          : <>
            <label className="flex flex-col gap-1.5 text-small text-fg-body">Reason (shown to the client)<Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} disabled={policy === "never"} /></label>
            <label className="flex flex-col gap-1.5 text-small text-fg-body">Duration (max 2 h)<Select value={String(minutes)} onChange={(e) => setMinutes(Number(e.target.value) as 30 | 60 | 120)} wrapperClassName="w-40" disabled={policy === "never"}><option value="30">30 minutes</option><option value="60">1 hour</option><option value="120">2 hours</option></Select></label>
            <Button className="w-fit" disabled={policy === "never" || reason.trim().length < 10} disabledReason={reason.trim().length < 10 ? "Give a specific reason (min 10 characters)" : undefined} onClick={async () => { if (await run(requestSupport({ tenantId: ws.id, reason: reason.trim(), minutes }), "Request sent to the workspace administrators")) setReason(""); }}>Request access</Button>
          </>}
        {mine.filter((s) => s.status === "ended" || s.status === "denied" || s.status === "cancelled").slice(0, 3).map((s) => <p key={s.id} className="text-micro text-fg-muted">Earlier: {s.status} · “{s.reason}”</p>)}
      </section>
    </div>
  );
}
