"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { RadioGroup } from "@/components/atoms/RadioGroup";
import { Select } from "@/components/atoms/Select";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Switch } from "@/components/atoms/Switch";
import { Banner } from "@/components/molecules/Banner";
import { FormSection } from "@/components/molecules/Field";
import { toast } from "@/components/organisms/Toaster";
import { decideSupport, endSupport, updateSecurityPolicy } from "@/lib/actions/security";
import type { SecurityView } from "@/server/dal/security";
import type { ActionResult } from "@/server/mutate";

const DOMAIN_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

/** CA7 security policy + support access approvals (privacy promise visible, one-click approve with full context). */
export function Security({ view }: { view: SecurityView }) {
  const router = useRouter();
  const [policy, setPolicy] = useState(view.policy);
  const [seen, setSeen] = useState(view);
  if (seen !== view) { setSeen(view); setPolicy(view.policy); }
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async <T,>(call: Promise<ActionResult<T>>, ok: string | ((d: T) => string), rollback?: () => void) => {
    setBusy(true);
    const r = await call;
    setBusy(false);
    if (!r.ok) { rollback?.(); toast.error(r.fieldErrors ? Object.values(r.fieldErrors)[0] : r.error); return; }
    toast.success(typeof ok === "function" ? ok(r.data) : ok);
    router.refresh();
  };
  const save = (patch: Partial<SecurityView["policy"]>, ok: string) => {
    const prev = policy;
    setPolicy({ ...policy, ...patch });
    void run(updateSecurityPolicy({ requireMfa: patch.requireMfa, timeoutHours: patch.timeoutHours as 1 | 8 | 24 | undefined, idleSignout: patch.idleSignout, domains: patch.domains, supportPolicy: patch.supportPolicy }), ok, () => setPolicy(prev));
  };
  const addDomain = () => {
    const d = draft.trim().toLowerCase().replace(/^@/, "");
    if (!DOMAIN_RE.test(d)) { toast.error("Enter a domain like example.com"); return; }
    if (!policy.domains.includes(d)) save({ domains: [...policy.domains, d] }, `@${d} allowed`);
    setDraft("");
  };
  const live = view.sessions.find((s) => s.live);
  return (
    <div className="flex flex-col divide-y divide-line">
      {live && <Banner tone="info" className="mb-6" action={<Button size="sm" variant="secondary" loading={busy} onClick={() => run(endSupport({ id: live.id }), "Support session ended")}>End now</Button>}>Ledgerline Support ({live.who}) has access until {live.until}. Every action is logged.</Banner>}
      <FormSection title="Authentication" description="Applies to every member of this workspace.">
        <Switch checked={policy.requireMfa} onCheckedChange={(v) => save({ requireMfa: v }, v ? "MFA required for all members" : "MFA no longer required")} label="Require MFA for all members"
          description={policy.requireMfa ? (policy.withoutMfa ? `${policy.withoutMfa} member${policy.withoutMfa > 1 ? "s" : ""} will be asked to set up MFA before they can continue.` : "Everyone already uses MFA.") : "Members choose whether to use MFA."} />
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Session timeout<Select value={String(policy.timeoutHours)} onChange={(e) => save({ timeoutHours: Number(e.target.value) }, "Session timeout updated")} wrapperClassName="w-48"><option value="1">1 hour</option><option value="8">8 hours</option><option value="24">24 hours</option></Select></label>
        <Switch checked={policy.idleSignout} onCheckedChange={(v) => save({ idleSignout: v }, v ? "Idle sessions sign out after 30 minutes" : "Idle sign-out off")} label="Sign out idle sessions after 30 minutes" />
      </FormSection>
      <FormSection title="Allowed email domains" description="Invites to other domains are blocked.">
        <div className="flex flex-wrap items-center gap-2">{policy.domains.map((d) => <span key={d} className="inline-flex h-8 items-center gap-1 rounded-full bg-surface-active pl-3 pr-1 text-small text-fg">{d}<button type="button" aria-label={`Remove ${d}`} disabled={policy.domains.length === 1} onClick={() => save({ domains: policy.domains.filter((x) => x !== d) }, `@${d} removed`)} className="inline-flex size-6 items-center justify-center rounded-full hover:bg-surface disabled:opacity-40"><X className="size-3" /></button></span>)}</div>
        <div className="flex flex-wrap gap-2"><Input aria-label="Add domain" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addDomain()} placeholder="example.com" className="w-56" /><Button variant="secondary" onClick={addDomain}>+ Add domain</Button></div>
      </FormSection>
      <FormSection title="Support access" description="Ledgerline staff can't see your runs, loans or leases. If you need help with your data, approve a time-limited support session.">
        <div className="flex flex-col gap-5 rounded-panel border border-line bg-raised p-5">
          <p className="flex items-center gap-2 text-small text-fg"><ShieldCheck className="size-4 text-positive" />Your data stays private by default.</p>
          <RadioGroup value={policy.supportPolicy} onValueChange={(v) => save({ supportPolicy: v as SecurityView["policy"]["supportPolicy"] }, "Support access policy updated")} options={[{ value: "ask", label: "Ask an administrator every time (recommended)" }, { value: "auto", label: "Allow automatically for up to 1 hour" }, { value: "never", label: "Never allow" }]} />
          {view.pending && policy.supportPolicy !== "never" && <div className="flex flex-col gap-3 rounded-card border border-warning/50 p-4">
            <p className="text-small text-fg">{view.pending.who} requests access</p>
            <p className="text-micro text-fg-muted">Reason: “{view.pending.reason}” · Duration {view.pending.minutes >= 60 ? `${view.pending.minutes / 60} hour${view.pending.minutes > 60 ? "s" : ""}` : `${view.pending.minutes} minutes`} · Requested {view.pending.age}</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" disabled={busy} onClick={() => run(decideSupport({ id: view.pending!.id, approve: false }), "Support request denied · staff notified")}>Deny</Button>
              <Button loading={busy} onClick={() => run(decideSupport({ id: view.pending!.id, approve: true }), (d) => `${d.minutes >= 60 ? `${d.minutes / 60}-hour` : `${d.minutes}-minute`} support session approved`)}>Approve {view.pending.minutes >= 60 ? `${view.pending.minutes / 60}-hour` : `${view.pending.minutes}-minute`} session</Button>
            </div>
          </div>}
          {policy.supportPolicy === "never" && <p className="text-micro text-fg-muted">Support can still answer questions, but can&apos;t open your workspace.</p>}
          <div className="relative overflow-x-auto"><table className="w-full min-w-[520px] text-small"><caption className="sr-only">Support sessions</caption>
            <thead><tr className="text-fg-muted">{["Staff", "When", "Status", "Actions logged", ""].map((h, i) => <th key={i} scope="col" className="py-1.5 text-left font-normal">{h}</th>)}</tr></thead>
            <tbody>{view.sessions.length === 0 ? <tr><td colSpan={5} className="py-4 text-center text-fg-muted">No support sessions yet.</td></tr> : view.sessions.map((s) => <tr key={s.id} className="border-t border-line"><td className="py-2 text-fg">{s.who}</td><td className="font-mono text-micro text-fg-body">{s.time}</td><td>{s.live ? <StatusPill tone="info">Active</StatusPill> : <span className="text-fg-muted">{s.status}</span>}</td><td className="tabular-nums">{s.actions}</td><td className="text-right">{s.live ? <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(endSupport({ id: s.id }), "Support session ended")}>End session</Button> : <Link href={`/admin/audit-log?q=${encodeURIComponent(s.who)}`} className="text-link hover:underline">View log</Link>}</td></tr>)}</tbody></table></div>
        </div>
      </FormSection>
    </div>
  );
}
