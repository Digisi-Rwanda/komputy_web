"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Textarea } from "@/components/atoms/Textarea";
import { RadioGroup } from "@/components/atoms/RadioGroup";
import { ProgressBar } from "@/components/molecules/Progress";
import { Sheet } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { requestMore, type AccessState } from "@/lib/actions/access";
import { useKeepValuesSubmit } from "@/hooks/useKeepValuesSubmit";

/** AC5 drawer: current package, full meter, options, notes → account manager. No in-app pricing or payment. */
export function RequestMoreDrawer({ used, limit, unit = "runs", pkg = "Single Service · ECL", trigger }: { used: number; limit: number; unit?: string; pkg?: string; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AccessState, FormData>(async (p, f) => {
    const r = await requestMore(p, f);
    if (r?.ok) { setOpen(false); toast.success("Request sent to your account manager", { description: `Ref ${r.ref}` }); }
    return r;
  }, null);
  const submit = useKeepValuesSubmit(action);
  return (
    <Sheet open={open} onOpenChange={setOpen} trigger={trigger} title={`Request more ${unit}`} description={`Current package: ${pkg}`}>
      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2"><p className="flex justify-between text-small text-fg-body"><span>{unit[0].toUpperCase() + unit.slice(1)} this quarter</span><span className="font-mono tabular-nums">{used} / {limit}</span></p><ProgressBar value={used} max={limit} label={`${unit} used`} /></div>
        <RadioGroup name="option" defaultValue="plus20" options={[{ value: "plus20", label: `+20 ${unit} this quarter` }, { value: "plus50", label: `+50 ${unit} this quarter` }, { value: "suite", label: `Move to Suite (unlimited ${unit})` }]} />
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Notes for your account manager<Textarea name="note" maxLength={1000} /></label>
        {state && !state.ok && <p role="alert" className="text-micro text-negative">{state.error}</p>}
        <Button type="submit" loading={pending}>Send request</Button>
        <p className="text-micro text-fg-muted">Your account manager will reply within 1 business day. Nothing is charged online.</p>
      </form>
    </Sheet>
  );
}

/** AC4.8 / AC5: create button replaced when quota is used up (blueprint §3.4). */
export function QuotaGate({ used, limit, label = "New run", unit = "runs", children }: { used: number; limit: number; label?: string; unit?: string; children: React.ReactNode }) {
  if (used < limit) return <>{children}</>;
  return (
    <div className="flex flex-col items-end gap-1">
      <Button disabled disabledReason={`Quota reached: ${used} of ${limit} ${unit} used`}>{label}</Button>
      <RequestMoreDrawer used={used} limit={limit} unit={unit} trigger={<button type="button" className="text-micro text-warning hover:underline">Quota reached — Request more →</button>} />
    </div>
  );
}

/** Grace rule chip: work already validated can still be computed after the quota is used. */
export const GraceChip = () => <Badge tone="info">Can still compute</Badge>;
