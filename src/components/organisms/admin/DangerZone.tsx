"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Download } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Banner } from "@/components/molecules/Banner";
import { Modal } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { setWorkspaceClosing, transferOwnership } from "@/lib/actions/workspace-admin";
import type { Member } from "@/types/domain";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** CA9: transfer ownership (admins only, password step-up) and close workspace (name + password, 30-day grace). */
export function DangerZone({ admins, name, closingOn }: { admins: Member[]; name: string; closingOn: string | null }) {
  const router = useRouter();
  const [to, setTo] = useState(admins[0]?.id ?? "");
  const [pw, setPw] = useState("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [openT, setOpenT] = useState(false);
  const [openC, setOpenC] = useState(false);
  const target = admins.find((a) => a.id === to);
  const go = async (call: Promise<{ ok: true; data: unknown } | { ok: false; error: string }>, ok: string, close: () => void) => {
    setBusy(true); const r = await call; setBusy(false);
    if (!r.ok) { toast.error(r.error); return; }
    close(); setPw(""); setTyped(""); toast.success(ok); router.refresh();
  };
  return (
    <div className="flex flex-col gap-6">
      {closingOn && <Banner tone="negative" action={<Button size="sm" variant="secondary" loading={busy} onClick={() => go(setWorkspaceClosing({ close: false }), "Closure cancelled", () => {})}>Cancel closure</Button>}>Workspace closing on {fmt(closingOn)}. Members keep read-only access until then.</Banner>}
      <section className="flex flex-col gap-4 rounded-panel border border-negative/40 p-5">
        <div><h2 className="text-h4">Transfer ownership</h2><p className="text-small text-fg-muted">The new owner gets full control, including closing the workspace.</p></div>
        {admins.length === 0 ? <p className="text-small text-fg-muted">Make someone an administrator first (Members).</p> : (
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 text-small text-fg-body">New owner (admins only)<Select value={to} onChange={(e) => setTo(e.target.value)} wrapperClassName="w-60">{admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></label>
            <Modal open={openT} onOpenChange={(v) => { setOpenT(v); if (!v) setPw(""); }} title={`Transfer ownership to ${target?.name}?`} size="sm" trigger={<Button variant="secondary">Transfer ownership</Button>}
              footer={<Button loading={busy} disabled={!pw} disabledReason={!pw ? "Enter your password" : undefined} onClick={() => go(transferOwnership({ membershipId: to, password: pw }), `${target?.name} is now the owner`, () => setOpenT(false))}>Transfer</Button>}>
              <div className="flex flex-col gap-4">
                <ul className="flex flex-col gap-1.5 text-small text-fg-body">{["You'll become an administrator", `${target?.name.split(" ")[0]} will receive an email`, "This is recorded in the audit log"].map((t) => <li key={t} className="flex items-center gap-2"><Check className="size-4 text-positive" />{t}</li>)}</ul>
                <label className="flex flex-col gap-1.5 text-small text-fg-body">Your password<Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></label>
              </div>
            </Modal>
          </div>)}
      </section>
      <section className="flex flex-col gap-4 rounded-panel border border-negative/40 p-5">
        <div><h2 className="text-h4">Close workspace</h2><p className="text-small text-fg-muted">All runs, leases and files are deleted 30 days after closing. Export your data first.</p></div>
        <div className="flex flex-wrap gap-2">
          {/* shortcut: full export bundles come from the engine (plan Phase 5); enable then. */}
          <Button variant="secondary" icon={<Download />} disabled disabledReason="Full data export arrives with the engine connection">Export all data</Button>
          <Modal open={openC} onOpenChange={(v) => { setOpenC(v); if (!v) { setPw(""); setTyped(""); } }} title="Close workspace?" size="sm" description="Everything is deleted after 30 days. You can cancel until then."
            trigger={<Button variant="danger" disabled={Boolean(closingOn)} disabledReason={closingOn ? "Already scheduled to close" : undefined}>Close workspace</Button>}
            footer={<Button variant="danger" loading={busy} disabled={typed !== name || !pw} onClick={() => go(setWorkspaceClosing({ close: true, confirmName: typed, password: pw }), "Workspace scheduled to close in 30 days", () => setOpenC(false))}>Close workspace</Button>}>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-small text-fg-body"><span>Type <span className="font-mono text-fg">{name}</span> to confirm</span><Input value={typed} onChange={(e) => setTyped(e.target.value)} invalid={typed.length > 0 && !name.startsWith(typed)} autoComplete="off" />{typed.length > 0 && typed !== name && <span className="text-micro text-negative">Text doesn&apos;t match yet</span>}</label>
              <label className="flex flex-col gap-1.5 text-small text-fg-body">Your password<Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></label>
            </div>
          </Modal>
        </div>
      </section>
    </div>
  );
}
