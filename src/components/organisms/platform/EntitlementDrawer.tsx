"use client";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Input } from "@/components/atoms/Input";
import { NumberInput } from "@/components/atoms/NumberInput";
import { Select } from "@/components/atoms/Select";
import { Switch } from "@/components/atoms/Switch";
import { Textarea } from "@/components/atoms/Textarea";
import { Sheet } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { changeEntitlement } from "@/lib/actions/platform";

export type EntKind = "trial" | "activate" | "units" | "suspend" | "extend" | "expire";
type Svc = "ecl" | "leases";
const TITLE: Record<EntKind, string> = { trial: "Grant trial", activate: "Activate service", units: "Add units", suspend: "Suspend service", extend: "Extend trial", expire: "Expire service" };
const NAME: Record<Svc, string> = { ecl: "Expected Credit Loss", leases: "Lease Accounting" };
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** PA4 entitlement drawers. Every change needs a reason, is logged and emailed to the workspace owner. Sales staff propose. */
export function EntitlementDrawer({ kind, ws, tenantId, service = "leases", trigger, onDone, linked }: { kind: EntKind; ws: string; tenantId: string; service?: Svc; trigger: ReactNode; onDone?: () => void; linked?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [svc, setSvc] = useState<Svc>(service);
  const [reason, setReason] = useState(kind === "suspend" ? "Contract expired" : "");
  const [days, setDays] = useState<number | null>(kind === "extend" ? 7 : 14);
  const [a, setA] = useState<number | null>(svc === "ecl" ? 20 : 250); // runs/month or active leases
  const [b, setB] = useState<number | null>(svc === "ecl" ? 250000 : 3); // loans/run or entities
  const [start, setStart] = useState(() => iso(new Date()));
  const [end, setEnd] = useState(() => iso(new Date(Date.now() + 365 * 864e5)));
  const [ref, setRef] = useState(""), [price, setPrice] = useState(""), [watermark, setWatermark] = useState(true);
  const [msg, setMsg] = useState(`Your ${NAME[svc]} contract has ended. Data is view only. Contact your account manager to renew.`);
  const [keepData, setKeepData] = useState(true);
  const danger = kind === "suspend" || kind === "expire";
  const limits: Record<string, number> = svc === "ecl" ? { runs_month: a ?? 0, loans_run: b ?? 0 } : { active_leases: a ?? 0, entities: b ?? 0 };
  const ok = reason.trim().length >= 3 && (kind !== "activate" || (start && end > start)) && (!danger || keepData);
  const submit = async () => {
    setBusy(true);
    const r = await changeEntitlement({ tenantId, service: svc, kind, reason: reason.trim(), linkedRequest: linked,
      ...(kind === "trial" && { days: days ?? 14, limits, watermark }), ...(kind === "extend" && { days: Math.min(30, days ?? 7) }),
      ...(kind === "units" && { limits }), ...(kind === "activate" && { startsAt: start, endsAt: end, limits, contractRef: ref || undefined, priceNote: price || undefined }),
      ...(danger && { clientMessage: msg }) });
    setBusy(false);
    if (!r.ok) { toast.error(r.fieldErrors ? Object.values(r.fieldErrors)[0] : r.error); return; }
    setOpen(false);
    toast.success(r.data.proposed ? `Proposal recorded for ${ws}` : `${TITLE[kind]} · ${NAME[svc]}`, { description: r.data.proposed ? "A platform admin applies entitlement changes." : "Logged and emailed to the workspace owner." });
    onDone?.(); router.refresh();
  };
  const R = (l: string, c: ReactNode) => <label className="flex flex-col gap-1.5 text-small text-fg-body">{l}{c}</label>;
  const lim = (<div className="grid grid-cols-2 gap-3">{R(svc === "ecl" ? "Runs / month" : "Active leases", <NumberInput aria-label={svc === "ecl" ? "Runs per month" : "Active leases"} value={a} onValueChange={setA} />)}{R(svc === "ecl" ? "Loans per run" : "Entities", <NumberInput aria-label={svc === "ecl" ? "Loans per run" : "Entities"} value={b} onValueChange={setB} />)}</div>);
  return (
    <Sheet open={open} onOpenChange={setOpen} trigger={trigger} width="w-[520px]" title={`${TITLE[kind]} · ${ws}`} description="Logged and emailed to the workspace owner."
      footer={<Button variant={danger ? "danger" : "primary"} loading={busy} disabled={!ok} disabledReason={!ok ? (reason.trim().length < 3 ? "A reason is required" : "Check the dates") : undefined} onClick={submit}>{kind === "activate" ? `Activate ${NAME[svc]}` : kind === "extend" ? `Extend by ${Math.min(30, days ?? 0)} days` : TITLE[kind]}</Button>}>
      <div className="flex flex-col gap-5">
        {danger && <div className="rounded-card border border-negative/40 bg-negative-tint px-4 py-3 text-small text-fg">The client keeps their data. Outputs become view only.</div>}
        {R("Service", <Select value={svc} onChange={(e) => setSvc(e.target.value as Svc)}><option value="leases">Lease Accounting</option><option value="ecl">Expected Credit Loss</option></Select>)}
        {kind === "trial" && <>{R("Duration (days)", <NumberInput aria-label="Duration" value={days} onValueChange={setDays} />)}{lim}<Switch checked={watermark} onCheckedChange={setWatermark} label="Watermark outputs as TRIAL" /></>}
        {kind === "activate" && <><div className="grid grid-cols-2 gap-3">{R("Start", <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />)}{R("End", <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />)}</div>{lim}
          {R("Contract reference", <Input value={ref} onChange={(e) => setRef(e.target.value)} className="font-mono" placeholder="KCB-2026-LEASE" maxLength={60} />)}{R("Price note (internal)", <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="USD 900 / month, annual" maxLength={200} />)}
          {linked && <p className="text-micro text-fg-muted">Linked request <Badge mono tone="positive">{linked.slice(-6)} · will be marked Won</Badge></p>}
          <div className="rounded-card border border-line bg-raised p-4"><p className="mb-1 font-mono text-micro uppercase tracking-wider text-fg-muted">What the client will see</p><p className="text-small text-fg">{NAME[svc]} is now active · {svc === "ecl" ? `${a ?? 0} runs / month` : `${a ?? 0} leases`} · until {end}</p></div></>}
        {kind === "units" && lim}
        {kind === "extend" && R("+ days (max 30)", <NumberInput aria-label="Extra days" value={days} onValueChange={(v) => setDays(v == null ? null : Math.min(30, v))} />)}
        {danger && <>{R("Message shown to client", <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={1000} />)}<Checkbox checked={keepData} onCheckedChange={(v) => setKeepData(v === true)} label="Keep data view only (required)" /></>}
        {R("Reason (required, logged)", <Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder={kind === "extend" ? "Customer evaluating with auditors" : ""} />)}
      </div>
    </Sheet>
  );
}
