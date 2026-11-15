"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { IconButton } from "@/components/atoms/IconButton";
import { Select } from "@/components/atoms/Select";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Textarea } from "@/components/atoms/Textarea";
import { DropdownMenu } from "@/components/molecules/Overlays";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { Modal } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { cn } from "@/lib/cn";
import { resetUserMfa, setStaffRole, setUserActive } from "@/lib/actions/platform";
import type { listPeople } from "@/server/dal/platform";

type People = Awaited<ReturnType<typeof listPeople>>;
const STAFF_ROLES = [["admin", "Platform admin"], ["sales", "Sales (can propose, not activate)"], ["support", "Support (read-only)"]];
const ini = (s: string) => s.split(/[ .]+/).filter(Boolean).map((x) => x[0]).join("").slice(0, 2).toUpperCase();

/** PA7 global people directory + staff roles. No data access from here; every change needs a logged reason. */
export function PlatformUsers({ data, me }: { data: People; me: string }) {
  const router = useRouter();
  const [seg, setSeg] = useState("all");
  const [pending, setPending] = useState<{ kind: "disable" | "enable" | "mfa"; id: string; name: string } | null>(null);
  const [reason, setReason] = useState("");
  const done = async (r: { ok: boolean; error?: string }, ok: string) => { if (!r.ok) { toast.error(r.error ?? "Couldn't do that."); return false; } toast.success(ok); router.refresh(); return true; };
  const confirm = async () => {
    if (!pending) return;
    const r = pending.kind === "mfa" ? await resetUserMfa({ userId: pending.id, note: reason }) : await setUserActive({ userId: pending.id, active: pending.kind === "enable", reason });
    const label = pending.kind === "mfa" ? `MFA reset for ${pending.name} · logged` : pending.kind === "enable" ? `${pending.name} enabled` : `${pending.name} disabled in all workspaces`;
    if (await done(r.ok ? r : { ok: false, error: r.fieldErrors ? Object.values(r.fieldErrors)[0] : r.error }, label)) { setPending(null); setReason(""); }
  };
  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup label="People" value={seg} onChange={setSeg} options={[{ value: "all", label: "All people", count: data.people.length }, { value: "staff", label: "Staff", count: data.staff.length }]} />
      {seg === "all" ? (
        <div className="relative overflow-x-auto rounded-panel border border-line"><table className="w-full min-w-[820px] text-small"><caption className="sr-only">All people</caption>
          <thead><tr className="border-b border-line text-fg-muted">{["Person", "Workspaces", "MFA", "Last login", "Status", ""].map((h, i) => <th key={i} scope="col" className="px-4 py-2.5 text-left font-normal">{h}</th>)}</tr></thead>
          <tbody>{data.people.map((p) => <tr key={p.id} className={cn("border-b border-line last:border-0", p.status === "disabled" && "opacity-60")}>
            <td className="px-4 py-3"><span className="flex items-center gap-3"><Avatar initials={ini(p.name)} size="sm" /><span><span className="block text-fg">{p.name}</span><span className="block text-micro text-fg-muted">{p.email}</span></span></span></td>
            <td className="px-4"><span className="flex flex-wrap gap-1">{p.ws.length ? p.ws.map((w) => <span key={w} className="rounded-full bg-surface px-2 py-0.5 text-micro text-fg-body">{w}</span>) : <span className="text-fg-muted">-</span>}</span></td>
            <td className="px-4">{p.mfa ? "On" : <StatusPill tone="warning">Off</StatusPill>}</td><td className="px-4 text-fg-muted">{p.last}</td>
            <td className="px-4"><StatusPill tone={p.status === "active" ? "positive" : "neutral"}>{p.status === "active" ? "Active" : "Disabled"}</StatusPill></td>
            <td className="px-4 text-right"><DropdownMenu trigger={<IconButton label={`Actions for ${p.name}`} size="sm"><Icon name="more" /></IconButton>} items={[
              { label: "Reset MFA…", disabled: !p.mfa, onSelect: () => setPending({ kind: "mfa", id: p.id, name: p.name }) },
              { label: p.status === "active" ? "Disable person globally…" : "Enable person…", danger: p.status === "active", separatorBefore: true, onSelect: () => setPending({ kind: p.status === "active" ? "disable" : "enable", id: p.id, name: p.name }) },
            ]} /></td>
          </tr>)}</tbody></table></div>
      ) : (
        <ul className="divide-y divide-line rounded-panel border border-line">{data.staff.map(([id, n, e, r]) => <li key={id} className="flex flex-wrap items-center gap-3 px-4 py-3"><Avatar initials={ini(n)} size="sm" /><span className="min-w-0 flex-1"><span className="block text-small text-fg">{n}</span><span className="block text-micro text-fg-muted">{e}</span></span>
          <Select aria-label={`Role for ${n}`} defaultValue={r} disabled={id === me} onChange={async (ev) => { const label = ev.target.selectedOptions[0].text; await done(await setStaffRole({ userId: id, role: ev.target.value }), `${n}: ${label}`); }} wrapperClassName="w-72">{STAFF_ROLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></li>)}
          <li className="px-4 py-3 text-micro text-fg-muted">You can&apos;t change your own role. Sales can propose activations; only platform admins activate.</li></ul>
      )}
      <Modal open={pending !== null} onOpenChange={(o) => { if (!o) { setPending(null); setReason(""); } }} size="sm"
        title={pending?.kind === "mfa" ? `Reset MFA for ${pending.name}?` : pending?.kind === "disable" ? `Disable ${pending?.name} everywhere?` : `Enable ${pending?.name}?`}
        description={pending?.kind === "mfa" ? "They set up a new authenticator at next sign-in. Their sessions end now." : pending?.kind === "disable" ? "They're signed out of every workspace and can't sign in until enabled." : "They can sign in again."}
        footer={<Button variant={pending?.kind === "enable" ? "primary" : "danger"} disabled={reason.trim().length < (pending?.kind === "mfa" ? 10 : 3)} onClick={confirm}>{pending?.kind === "mfa" ? "Reset MFA" : pending?.kind === "disable" ? "Disable" : "Enable"}</Button>}>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">{pending?.kind === "mfa" ? "How you verified the person (required, logged)" : "Reason (required, logged)"}<Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} /></label>
      </Modal>
    </div>
  );
}
