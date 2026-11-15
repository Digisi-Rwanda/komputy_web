"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Select } from "@/components/atoms/Select";
import { Textarea } from "@/components/atoms/Textarea";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Field } from "@/components/molecules/Field";
import { Modal } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { askAdmin, startTrial, type AccessState } from "@/lib/actions/access";
import { useKeepValuesSubmit } from "@/hooks/useKeepValuesSubmit";
import type { ServiceId } from "@/types/domain";

/** AC3 frame 1: trial terms + acknowledgement, then lands on the service's setup with the trial-ready card. */
function StartTrialModal({ service, name, terms }: { service: ServiceId; name: string; terms: string[] }) {
  const router = useRouter();
  const [ack, setAck] = useState(false);
  const [state, action, pending] = useActionState<AccessState, FormData>(async (p, f) => {
    const r = await startTrial(p, f);
    if (r?.ok) { toast.success(`${name} trial started`); router.push(service === "leases" ? "/leases/setup?trial=started" : `/${service}?trial=started`); }
    return r;
  }, null);
  const submit = useKeepValuesSubmit(action);
  return (
    <Modal title={`Start your ${name} trial`} trigger={<Button size="lg">Start 14-day trial</Button>}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <input type="hidden" name="service" value={service} />
        {ack && <input type="hidden" name="ack" value="on" />}
        <dl className="divide-y divide-line rounded-card border border-line">
          {terms.map((t) => { const [k, v] = t.split(" · "); return <div key={k} className="flex gap-4 px-4 py-2.5 text-small"><dt className="label-mono w-20 shrink-0 pt-0.5">{k}</dt><dd className="text-fg-body">{v}</dd></div>; })}
        </dl>
        <Checkbox checked={ack} onCheckedChange={(c) => setAck(c === true)} label="I understand trial outputs are not for statutory reporting." />
        {state && !state.ok && <p role="alert" className="text-micro text-negative">{state.error}</p>}
        <div className="flex justify-end gap-2"><Button type="submit" loading={pending} disabled={!ack}>Start trial</Button></div>
      </form>
    </Modal>
  );
}

/** AC2 member path: ask a workspace admin; request lands in their Requests list. */
function AskAdminModal({ service, name, admins }: { service: ServiceId; name: string; admins: string[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AccessState, FormData>(async (p, f) => {
    const r = await askAdmin(p, f);
    if (r?.ok) { setOpen(false); toast.success(`Request sent to ${r.to}`, { description: `Ref ${r.ref}` }); }
    return r;
  }, null);
  const submit = useKeepValuesSubmit(action);
  return (
    <Modal open={open} onOpenChange={setOpen} title={`Ask for ${name}`} description="Your workspace admin decides whether to start a trial or request access." trigger={<Button size="lg">Ask my admin</Button>}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input type="hidden" name="service" value={service} />
        <Field label="Send to" id="ask-to"><Select name="to" defaultValue={admins[0]}>{admins.map((a) => <option key={a}>{a}</option>)}</Select></Field>
        <Field label="Why do you need it?" id="ask-note" optional><Textarea name="note" maxLength={1000} placeholder="I review month-end close for the property portfolio." /></Field>
        {state && !state.ok && <p role="alert" className="text-micro text-negative">{state.error}</p>}
        <div className="flex justify-end"><Button type="submit" loading={pending}>Send request</Button></div>
      </form>
    </Modal>
  );
}

/** AC1/AC2 action row: one primary action, role-dependent. */
export function LockedActions({ service, name, admin, terms, admins, live, trialUsedAt }: { service: ServiceId; name: string; admin: boolean; terms: string[]; admins: string[]; live: boolean; trialUsedAt?: string }) {
  if (!live) return (
    <div className="flex flex-wrap items-center gap-3">
      <Button asChild size="lg"><Link href={`/services/${service}`}>Join the waitlist</Link></Button>
      <Button asChild variant="secondary" size="lg"><Link href={`/contact?topic=design-partner&services=${service}`}>Become a design partner</Link></Button>
    </div>
  );
  if (!admin) return (
    <div className="flex flex-wrap items-center gap-4">
      <AskAdminModal service={service} name={name} admins={admins} />
      <Link href={`/services/${service}`} className="text-small text-link hover:underline">What is {name}?</Link>
    </div>
  );
  return (
    <div className="flex flex-wrap items-center gap-3">
      {trialUsedAt ? <p className="w-full text-small text-fg-muted">Trial used on {trialUsedAt} . Request access to continue.</p> : <StartTrialModal service={service} name={name} terms={terms} />}
      <Button asChild variant={trialUsedAt ? "primary" : "secondary"} size="lg"><Link href={`/contact?topic=quote&services=${service}`}>Request access</Link></Button>
      <Link href="/pricing" className="text-small text-link hover:underline">See pricing →</Link>
    </div>
  );
}
