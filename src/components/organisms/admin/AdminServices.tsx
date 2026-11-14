"use client";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { NumberInput } from "@/components/atoms/NumberInput";
import { RadioGroup } from "@/components/atoms/RadioGroup";
import { Select } from "@/components/atoms/Select";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Textarea } from "@/components/atoms/Textarea";
import { ProgressBar } from "@/components/molecules/Progress";
import { Sheet } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { useRouter } from "next/navigation";
import { requestService } from "@/lib/actions/workspace-admin";
import type { ServiceCard } from "@/server/dal/workspace-admin";
import type { Tone } from "@/types/ui";

/** CA4: entitlements are read-only for the client; every lever is a request to Ledgerline. */
const WAITLIST: [string, "tax" | "lease-planning" | "doc-intel" | "erp"][] = [["Lease Planning & Analytics", "lease-planning"], ["Document Intelligence", "doc-intel"], ["ERP Connect", "erp"]];

export function Services({ cards, history, accountManager }: { cards: ServiceCard[]; history: [string, Tone, string, string][]; accountManager?: { name: string; email: string } }) {
  const router = useRouter();
  const [waitlist, setWaitlist] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [need, setNeed] = useState("runs");
  const [svc, setSvc] = useState<"ecl" | "leases">("ecl");
  const [amount, setAmount] = useState<number | null>(30);
  const [note, setNote] = useState("");
  /** Every lever is a request to Ledgerline; the history list refreshes from the server. */
  const ask = async (input: Parameters<typeof requestService>[0], ok = "Request sent to Ledgerline") => {
    const r = await requestService(input);
    if (!r.ok) { toast.error(r.error); return false; }
    toast.success(ok, { description: "We reply within 1 business day." }); router.refresh(); return true;
  };
  const join = async (name: string, service: Parameters<typeof requestService>[0]["service"]) => { if (await ask({ kind: "waitlist", service }, `You're on the ${name} waitlist`)) setWaitlist((w) => [...w, name]); };
  return (
    <div className="flex flex-col gap-8">
      <p className="text-small text-fg-muted">Services are enabled by Ledgerline. Request changes and our team will get back to you within 1 business day.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {cards.map((s) => (
          <section key={s.id} className="flex flex-col gap-4 rounded-panel border border-line p-5">
            <div className="flex flex-wrap items-center gap-3"><span className="inline-flex size-9 items-center justify-center rounded-full bg-surface text-fg-muted"><Icon name={s.id === "ecl" ? "ecl" : "leases"} /></span><h2 className="text-h4">{s.name}</h2><StatusPill tone={s.tone}>{s.state}</StatusPill></div>
            <p className="font-mono text-micro text-fg-muted">{s.dates}</p>
            {s.meters.map(([l, u, m]) => m ? <div key={l} className="flex flex-col gap-1.5"><span className="flex justify-between text-small text-fg-body"><span>{l}</span><span className="font-mono tabular-nums">{u} / {m}</span></span><ProgressBar value={u} max={m} label={l} tone={u / m >= 0.8 ? "warning" : undefined} /></div>
              : <p key={l} className="flex justify-between text-small text-fg-body"><span>{l}</span><span className="font-mono tabular-nums">{u.toLocaleString()}</span></p>)}
            <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-4">
              {s.id === "ecl" ? <><Button variant="secondary" onClick={() => setOpen(true)}>Request more capacity</Button>{accountManager && <span className="text-small text-fg-muted">Account manager: <span className="text-fg">{accountManager.name}</span> · {accountManager.email}</span>}</>
                : s.state === "Trial" ? <><Button onClick={() => ask({ kind: "access", service: s.id })}>Request full access</Button><Button variant="secondary" onClick={() => ask({ kind: "extend", service: s.id })}>Extend trial</Button></>
                : <Button variant="secondary" onClick={() => { setSvc(s.id); setOpen(true); }}>Request more capacity</Button>}
            </div>
          </section>
        ))}
        <section className="flex flex-col gap-3 rounded-panel border border-line p-5 opacity-70 lg:col-span-2"><div className="flex flex-wrap items-center gap-3"><span className="inline-flex size-9 items-center justify-center rounded-full bg-surface text-fg-muted"><Icon name="tax" /></span><h2 className="text-h4">Tax Provision (IAS 12)</h2><StatusPill>Coming soon</StatusPill>
          <Button size="sm" variant="secondary" className="ml-auto" disabled={waitlist.includes("Tax Provision")} onClick={() => join("Tax Provision", "tax")}>{waitlist.includes("Tax Provision") ? "On waitlist ✓" : "Join waitlist"}</Button></div></section>
      </div>
      <section className="flex flex-col gap-3"><h2 className="text-h4">Not enabled</h2>
        <div className="grid gap-3 sm:grid-cols-3">{WAITLIST.map(([n, id]) => <div key={n} className="flex flex-col gap-2 rounded-card border border-line p-4"><span className="text-small text-fg">{n}</span><span className="text-micro text-fg-muted">Coming soon · {waitlist.includes(n) ? "On waitlist ✓" : <button type="button" className="text-link hover:underline" onClick={() => join(n, id)}>Join waitlist</button>}</span></div>)}</div>
      </section>
      <section className="flex flex-col gap-3"><h2 className="text-h4">Request history</h2>
        {history.length === 0 ? <p className="text-small text-fg-muted">No requests yet.</p> : <ul className="divide-y divide-line rounded-panel border border-line">{history.map(([t, tone, st, when], i) => <li key={t + i} className="flex flex-wrap items-center gap-3 px-4 py-3 text-small"><span className="flex-1 text-fg">{t}</span><StatusPill tone={tone}>{st}</StatusPill><span className="w-40 text-right text-micro text-fg-muted">{when}</span></li>)}</ul>}
      </section>
      <Sheet open={open} onOpenChange={setOpen} title="Request more capacity" description="Your account manager confirms terms." footer={<Button onClick={async () => { if (await ask({ kind: "capacity", service: svc, need, amount: need === "runs" ? amount ?? undefined : undefined, note: note.trim() || undefined })) { setOpen(false); setNote(""); } }}>Send request</Button>}>
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5 text-small text-fg-body">Service<Select value={svc} onChange={(e) => setSvc(e.target.value as "ecl" | "leases")}><option value="ecl">Expected Credit Loss</option><option value="leases">Lease Accounting</option></Select></label>
          <div className="flex flex-col gap-2"><span className="text-small text-fg-body">What do you need?</span><RadioGroup value={need} onValueChange={setNeed} options={[{ value: "runs", label: "More runs" }, { value: "loans", label: "Larger loan books" }, { value: "users", label: "More users" }, { value: "other", label: "Other" }]} /></div>
          {need === "runs" && <label className="flex flex-col gap-1.5 text-small text-fg-body">Runs per month<NumberInput aria-label="Runs per month" value={amount} onValueChange={setAmount} /></label>}
          <label className="flex flex-col gap-1.5 text-small text-fg-body">Details<Textarea maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <p className="text-micro text-fg-muted">Nothing is charged online. Your account manager confirms terms.</p>
        </div>
      </Sheet>
    </div>
  );
}
