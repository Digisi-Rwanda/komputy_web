"use client";
import { useKeepValuesSubmit } from "@/hooks/useKeepValuesSubmit";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Textarea } from "@/components/atoms/Textarea";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Field } from "@/components/molecules/Field";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { submitContact, type ContactState } from "@/lib/actions/public";
import { SERVICES } from "@/lib/services";
import { cn } from "@/lib/cn";

const COUNTRIES = ["Rwanda", "Kenya", "Uganda", "Tanzania", "Burundi", "DR Congo", "Ethiopia", "Nigeria", "Ghana", "South Africa", "Other"];
const PKG: Record<string, string> = { single: "Single service", dual: "Dual · ECL + Leases", enterprise: "Enterprise" };

export interface ContactPrefill { pkg?: string; services?: string[]; size?: string; topic?: string; range?: string }

/** P6 v2 context-aware request form. Validates in a server action; shows reference on success. */
export function ContactForm({ prefill }: { prefill: ContactPrefill }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact, null);
  const submit = useKeepValuesSubmit(action);
  const [pkg, setPkg] = useState(prefill.pkg && PKG[prefill.pkg] ? prefill.pkg : "");
  const [services, setServices] = useState<string[]>(prefill.services?.length ? prefill.services : ["ecl"]);
  const [time, setTime] = useState("Morning");
  const [consent, setConsent] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const err = state && !state.ok ? state.errors : {};

  useEffect(() => {
    if (state && !state.ok) form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  }, [state]);

  if (state?.ok) {
    return (
      <div role="status" className="flex flex-wrap items-center gap-6 rounded-panel border border-line bg-raised p-8 animate-scale-in">
        <CheckCircle2 aria-hidden className="size-14 text-positive" />
        <div className="flex-1">
          <p className="text-h3 text-fg">Thanks{state.name && `, ${state.name}`}. We&apos;ve got it.</p>
          <p className="mt-1 text-small text-fg-muted">Reference <span className="font-mono text-fg">{state.reference}</span> · We&apos;ll reply within 1 business day.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link href="/sign-up">Start a free trial meanwhile</Link></Button>
          <Button asChild variant="link"><Link href="/">Back to home</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <form ref={form} onSubmit={submit} noValidate className="flex flex-col gap-5">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <input type="hidden" name="topic" value={prefill.topic ?? "sales"} />
      <input type="hidden" name="package" value={pkg} />
      <input type="hidden" name="time" value={time} />
      {services.map((s) => <input key={s} type="hidden" name="services" value={s} />)}
      {consent && <input type="hidden" name="consent" value="on" />}
      {(pkg || prefill.range) && (
        <div className="flex flex-wrap gap-2">
          {pkg && <span className="inline-flex h-7 items-center gap-1 rounded-full bg-surface pl-3 pr-1 text-micro text-fg">Package: {PKG[pkg]}<button type="button" aria-label="Remove package" onClick={() => setPkg("")} className="inline-flex size-5 items-center justify-center rounded-full hover:bg-surface-active"><X className="size-3" /></button></span>}
          {prefill.range && <span className="inline-flex h-7 items-center rounded-full bg-info-tint px-3 text-micro text-link">Indicative USD {prefill.range.replace("-", " to ")} / month</span>}
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" id="c-name" required error={err.name}><Input name="name" autoComplete="name" /></Field>
        <Field label="Work email" id="c-email" required error={err.email}><Input name="email" type="email" autoComplete="email" /></Field>
        <Field label="Company" id="c-company" required error={err.company}><Input name="company" autoComplete="organization" /></Field>
        <Field label="Country" id="c-country" required error={err.country}>
          <Select name="country" defaultValue=""><option value="" disabled>Choose…</option>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</Select>
        </Field>
      </div>
      <fieldset aria-describedby={err.services ? "c-services-err" : undefined} className="flex flex-col gap-2">
        <legend className="mb-1.5 text-small text-fg-body">Services of interest <span className="text-negative">*</span></legend>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => {
            const on = services.includes(s.id);
            return (
              <button key={s.id} type="button" aria-pressed={on} onClick={() => setServices((v) => (on ? v.filter((x) => x !== s.id) : [...v, s.id]))} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-micro transition-colors", on ? "border-accent bg-info-tint text-fg" : "border-line text-fg-muted hover:text-fg")}>
                <span aria-hidden className={cn("size-1.5 rounded-full", s.live ? "bg-positive" : "bg-fg-muted")} />{s.short}{on && " ✓"}
              </button>
            );
          })}
        </div>
        {err.services && <p id="c-services-err" role="alert" className="text-micro text-negative">{err.services}</p>}
      </fieldset>
      <Field label="Portfolio size" id="c-size" optional help="Loans per run, active leases, entities."><Input name="size" defaultValue={prefill.size} placeholder="≈ 50,000 loans" /></Field>
      <Field label="Message" id="c-message" optional error={err.message}><Textarea name="message" maxLength={2000} placeholder="Tell us more about your needs…" /></Field>
      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-1.5"><span className="text-small text-fg-body">Preferred contact time</span><ToggleGroup label="Preferred contact time" value={time} onChange={setTime} options={[{ value: "Morning", label: "Morning" }, { value: "Afternoon", label: "Afternoon" }]} /></div>
        <div className="flex flex-col gap-1">
          <Checkbox checked={consent} onCheckedChange={(c) => setConsent(c === true)} aria-invalid={Boolean(err.consent) || undefined} label="I agree to be contacted about Komputy services." />
          {err.consent && <p role="alert" className="text-micro text-negative">{err.consent}</p>}
        </div>
      </div>
      <Button type="submit" size="lg" loading={pending} className="w-full">Send request</Button>
      <p className="text-center text-micro text-fg-muted">Or email <span className="font-mono text-fg-body select-all">sales@komputy.com</span></p>
    </form>
  );
}
