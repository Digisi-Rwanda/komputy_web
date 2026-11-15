"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Check, Search } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { IconButton } from "@/components/atoms/IconButton";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Textarea } from "@/components/atoms/Textarea";
import { MultiEmailInput } from "@/components/molecules/MultiEmailInput";
import { DropdownMenu, Tooltip } from "@/components/molecules/Overlays";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { FilterBar, type FilterValues } from "@/components/organisms/FilterBar";
import { ConfirmDialog, Modal } from "@/components/organisms/Modal";
import { StateView } from "@/components/organisms/StateView";
import { toast } from "@/components/organisms/Toaster";
import { cn } from "@/lib/cn";
import { inviteMembers, remindMfa, removeMember, resendInvite, revokeInvite, setMemberStatus, setServiceRole, setWorkspaceRole } from "@/lib/actions/members";
import type { ActionResult } from "@/server/mutate";
import type { EclRole, LeasesRole, Member } from "@/types/domain";

const DOMAIN = "kivubank.rw";
export const ECL_ROLES: [EclRole, string][] = [["none", "No access"], ["viewer", "Viewer: read results and reports"], ["analyst", "Analyst: prepare runs and upload data"], ["reviewer", "Reviewer: approve and sign off runs"]];
export const LEASE_ROLES: [LeasesRole, string][] = [["none", "No access"], ["viewer", "Viewer: read only"], ["preparer", "Preparer: create and edit leases"], ["reviewer", "Reviewer: approve leases and close"], ["poster", "Poster: mark journals as posted"]];
const label = (r: string) => (r === "none" ? "No access" : r === "preparer" ? "Preparer" : r[0].toUpperCase() + r.slice(1));
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RoleCell({ m, svc, onChange }: { m: Member; svc: "ecl" | "leases"; onChange: (v: string) => void }) {
  const [edit, setEdit] = useState(false);
  const v = m[svc];
  if (m.status === "invited" && svc === "leases" && v === "none") return <span className="text-fg-subtle">None</span>;
  if (edit) return <Select autoFocus aria-label={`${svc === "ecl" ? "ECL" : "Leases"} role for ${m.name}`} value={v} wrapperClassName="w-44" onBlur={() => setEdit(false)} onChange={(e) => { onChange(e.target.value); setEdit(false); }}>{(svc === "ecl" ? ECL_ROLES : LEASE_ROLES).map(([k, d]) => <option key={k} value={k}>{d}</option>)}</Select>;
  const text = <button type="button" disabled={m.status !== "active"} onClick={() => setEdit(true)} className={cn("rounded-full px-2 py-0.5 text-left hover:bg-surface", v === "none" ? "text-fg-subtle" : "text-fg-body")}>{label(v)}</button>;
  return v === "reviewer" ? <Tooltip content="Can't approve their own submissions">{text}</Tooltip> : text;
}

/** CA2 members with per-service roles + CA3 invite modal. Owner can't be removed; at least one admin. */
export function Members({ initial }: { initial: Member[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) { setSeen(initial); setRows(initial); } // server refreshed: adopt the new list
  const [removing, setRemoving] = useState<Member | null>(null);
  /** Optimistic update → server action → toast; rolls back if the server refuses. */
  const act = async <T,>(call: Promise<ActionResult<T>>, ok: string | ((d: T) => string), optimistic?: () => void) => {
    const prev = rows;
    optimistic?.();
    const r = await call;
    if (!r.ok) { setRows(prev); toast.error(r.error); return; }
    toast.success(typeof ok === "function" ? ok(r.data) : ok);
    router.refresh();
  };
  const sp = useSearchParams(); // ⌘K deep links: ?q=<email> filters, ?invite=1 opens the invite modal
  const [q, setQ] = useState(() => sp.get("q") ?? "");
  const [f, setF] = useState<FilterValues>({});
  const [fresh, setFresh] = useState<string[]>([]);
  const set = (id: string, patch: Partial<Member>) => setRows((r) => r.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const admins = rows.filter((m) => m.workspaceRole !== "member" && m.status === "active").length;
  const list = rows.filter((m) => (m.name + m.email).toLowerCase().includes(q.toLowerCase())
    && (!f.role?.length || f.role.includes(m.status === "invited" ? "invited" : m.workspaceRole))
    && (!f.service?.length || f.service.some((s) => m[s as "ecl" | "leases"] !== "none"))
    && (!f.mfa?.length || f.mfa.includes(m.mfa ? "on" : "off")));
  const invite = async (emails: string[], ecl: EclRole, leases: LeasesRole, admin: boolean, message?: string) => {
    const r = await inviteMembers({ emails, workspaceRole: admin ? "admin" : "member", roles: { ecl, leases }, message });
    if (!r.ok) { toast.error(r.error); return false; }
    toast.success(`${r.data.sent} invite${r.data.sent > 1 ? "s" : ""} sent. They expire in 7 days`, r.data.skipped ? { description: `${r.data.skipped} already in the workspace` } : undefined);
    setFresh(emails.map((e) => e.toLowerCase()));
    router.refresh();
    return true;
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative w-full sm:w-64"><span className="sr-only">Search members</span><Search className="pointer-events-none absolute left-3 z-10 top-1/2 size-4 -translate-y-1/2 text-fg-muted" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members" className="rounded-full pl-9" /></label>
        <FilterBar value={f} onChange={setF} filters={[{ key: "role", label: "Role", options: [{ value: "owner", label: "Owner" }, { value: "admin", label: "Admin" }, { value: "member", label: "Member" }, { value: "invited", label: "Invited" }] }, { key: "service", label: "Service", options: [{ value: "ecl", label: "Expected Credit Loss" }, { value: "leases", label: "Lease Accounting" }] }, { key: "mfa", label: "MFA", options: [{ value: "on", label: "On" }, { value: "off", label: "Off" }] }]} />
        <span className="ml-auto"><InviteModal onSend={invite} existing={rows.map((r) => r.email)} defaultOpen={sp.get("invite") === "1"} /></span>
      </div>
      {list.length === 0 ? <StateView icon="users" title="No members match" description="Try a different search or clear the filters." /> : (
        <div className="relative overflow-x-auto rounded-panel border border-line">
          <table className="w-full min-w-[940px] text-small"><caption className="sr-only">Workspace members</caption>
            <thead><tr className="border-b border-line text-fg-muted">{["Member", "Workspace role", "ECL role", "Leases role", "MFA", "Last active"].map((h) => <th key={h} scope="col" className="px-4 py-2.5 text-left font-normal">{h}</th>)}<th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{list.map((m) => (
              <tr key={m.id} className={cn("border-b border-line last:border-0 transition-colors", m.status === "disabled" && "opacity-60", fresh.includes(m.email) && "bg-info-tint")}>
                <td className="px-4 py-3"><span className="flex items-center gap-3"><Avatar initials={m.initials} size="sm" /><span className="flex flex-col"><span className="text-fg">{m.name}</span><span className="text-micro text-fg-muted">{m.email}</span></span></span></td>
                <td className="px-4">{m.status === "invited" ? <StatusPill tone="info">Invited</StatusPill> : m.status === "disabled" ? <StatusPill tone="neutral">Disabled</StatusPill> : m.workspaceRole === "member" ? <span className="text-fg-body">Member</span> : <StatusPill tone={m.workspaceRole === "owner" ? "positive" : "neutral"}>{label(m.workspaceRole)}</StatusPill>}</td>
                <td className="px-4"><RoleCell m={m} svc="ecl" onChange={(v) => act(setServiceRole({ membershipId: m.id, service: "ecl", role: v }), `${m.name}: ECL role → ${label(v)}`, () => set(m.id, { ecl: v as EclRole }))} /></td>
                <td className="px-4"><RoleCell m={m} svc="leases" onChange={(v) => act(setServiceRole({ membershipId: m.id, service: "leases", role: v }), `${m.name}: Leases role → ${label(v)}`, () => set(m.id, { leases: v as LeasesRole }))} /></td>
                <td className="px-4">{m.status === "invited" ? <span className="text-fg-subtle">Not yet</span> : m.mfa ? <span className="inline-flex items-center gap-1 text-positive"><Check className="size-3.5" />On</span> : <StatusPill tone="warning">Off</StatusPill>}</td>
                <td className="px-4 text-fg-muted">{m.status === "invited" ? <span className="flex flex-wrap items-center gap-2"><span>{m.lastActive === "Never" ? "Expires tomorrow" : m.lastActive}</span><button type="button" className="text-link hover:underline" onClick={() => act(resendInvite({ invitationId: m.id.slice(4) }), `Invite resent to ${m.email}`)}>Resend</button>·<button type="button" className="text-link hover:underline" onClick={() => act(revokeInvite({ invitationId: m.id.slice(4) }), `Invite to ${m.email} revoked`, () => setRows((r) => r.filter((x) => x.id !== m.id)))}>Revoke</button></span> : m.lastActive}</td>
                <td className="px-2 text-right">{m.workspaceRole === "owner" ? <Tooltip content="The owner can't be removed"><span className="inline-flex size-8 items-center justify-center text-fg-subtle"><Icon name="lock" className="size-4" /></span></Tooltip> : (
                  <DropdownMenu trigger={<IconButton label={`Actions for ${m.name}`} size="sm"><Icon name="more" /></IconButton>} items={[
                    { label: m.workspaceRole === "admin" ? "Make member" : "Make administrator", disabled: m.status !== "active" || (m.workspaceRole === "admin" && admins <= 1), onSelect: () => act(setWorkspaceRole({ membershipId: m.id, role: m.workspaceRole === "admin" ? "member" : "admin" }), `${m.name} is now ${m.workspaceRole === "admin" ? "a member" : "an administrator"}`, () => set(m.id, { workspaceRole: m.workspaceRole === "admin" ? "member" : "admin" })) },
                    { label: "Remind to set up MFA", disabled: m.mfa || m.status !== "active", onSelect: () => act(remindMfa({ membershipIds: [m.id] }), `Reminder sent to ${m.name}`) },
                    { label: m.status === "disabled" ? "Enable member" : "Disable member", disabled: m.status === "invited", onSelect: () => act(setMemberStatus({ membershipId: m.id, status: m.status === "disabled" ? "active" : "disabled" }), m.status === "disabled" ? `${m.name} enabled` : `${m.name} disabled · signed out of this workspace`, () => set(m.id, { status: m.status === "disabled" ? "active" : "disabled" })) },
                    { label: "Remove from workspace", danger: true, separatorBefore: true, disabled: m.status === "invited" || (m.workspaceRole === "admin" && admins <= 1), onSelect: () => setRemoving(m) },
                  ]} />)}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
      <ConfirmDialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)} title={`Remove ${removing?.name ?? ""}?`} description="They lose access to this workspace straight away. Their past work and audit history stay." confirmLabel="Remove member"
        onConfirm={() => { const m = removing!; setRemoving(null); void act(removeMember({ membershipId: m.id }), `${m.name} removed`, () => setRows((r) => r.filter((x) => x.id !== m.id))); }} />
      <p className="text-micro text-fg-muted">The owner can&apos;t be removed. At least one administrator is required. Click a role to change it.</p>
    </div>
  );
}

function InviteModal({ onSend, existing, defaultOpen = false }: { onSend: (e: string[], ecl: EclRole, leases: LeasesRole, admin: boolean, message?: string) => Promise<boolean>; existing: string[]; defaultOpen?: boolean }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const [emails, setEmails] = useState<string[]>([]);
  const [role, setRole] = useState("member");
  const [ecl, setEcl] = useState<EclRole>("analyst");
  const [leases, setLeases] = useState<LeasesRole>("viewer");
  const valid = emails.filter((e) => EMAIL.test(e) && e.endsWith("@" + DOMAIN) && !existing.includes(e));
  const badDomain = emails.filter((e) => EMAIL.test(e) && !e.endsWith("@" + DOMAIN));
  const dupes = emails.filter((e) => existing.includes(e));
  const send = async () => {
    setSending(true);
    const ok = await onSend(valid, ecl, leases, role === "admin", message.trim() || undefined);
    setSending(false);
    if (ok) { setOpen(false); setEmails([]); setMessage(""); }
  };
  return (
    <Modal open={open} onOpenChange={setOpen} title="Invite members" size="lg" trigger={<Button icon={<Icon name="plus" />}>Invite members</Button>}
      footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button loading={sending} disabled={!valid.length} disabledReason={!valid.length ? "Add at least one valid address" : undefined} onClick={send}>Send {valid.length || ""} invite{valid.length === 1 ? "" : "s"}</Button></>}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5"><label htmlFor="invite-emails" className="text-small text-fg-body">Email addresses</label>
          <MultiEmailInput id="invite-emails" value={emails} onChange={setEmails} allowedDomains={[DOMAIN]} placeholder={`name@${DOMAIN}`} />
          {badDomain.length > 0 && <p role="alert" className="text-micro text-negative">Only @{DOMAIN} addresses are allowed (workspace security policy).</p>}
          {dupes.length > 0 && <p role="alert" className="text-micro text-warning">{dupes.join(", ")} {dupes.length > 1 ? "are" : "is"} already in this workspace.</p>}
          <p className="text-micro text-fg-muted">People who already have a Komputy account join with their existing login.</p></div>
        <div className="flex flex-col gap-1.5"><span className="text-small text-fg-body">Workspace role</span><ToggleGroup label="Workspace role" value={role} onChange={setRole} options={[{ value: "member", label: "Member" }, { value: "admin", label: "Admin" }]} /></div>
        <div className="flex flex-col gap-2"><span className="text-small text-fg-body">Service access</span>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-line px-4 py-2.5"><span className="text-small text-fg">Expected Credit Loss</span><Select aria-label="ECL role" value={ecl} onChange={(e) => setEcl(e.target.value as EclRole)} wrapperClassName="w-60">{ECL_ROLES.map(([k, d]) => <option key={k} value={k}>{d}</option>)}</Select></div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-line px-4 py-2.5"><span className="text-small text-fg">Lease Accounting <span className="text-fg-muted">(Trial)</span></span><Select aria-label="Leases role" value={leases} onChange={(e) => setLeases(e.target.value as LeasesRole)} wrapperClassName="w-60">{LEASE_ROLES.map(([k, d]) => <option key={k} value={k}>{d}</option>)}</Select></div>
          <p className="text-micro text-fg-muted">Roles can be changed later.</p></div>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Personal message <span className="text-micro text-fg-muted">Optional</span><Textarea maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} /></label>
      </div>
    </Modal>
  );
}
