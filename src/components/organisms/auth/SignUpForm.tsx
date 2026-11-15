"use client";
import { useKeepValuesSubmit } from "@/hooks/useKeepValuesSubmit";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Field } from "@/components/molecules/Field";
import { Stepper } from "@/components/molecules/Stepper";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { CardSelector } from "@/components/molecules/CardSelector";
import { Icon } from "@/components/atoms/Icon";
import { Badge } from "@/components/atoms/Badge";
import { signUp, type FormState } from "@/lib/actions/auth";
import { isEmail } from "@/lib/validation";
import { passwordOk } from "@/lib/password";
import { FormAlert } from "@/components/molecules/FormAlert";
import { PasswordField } from "@/components/molecules/PasswordField";

const COUNTRIES = ["Rwanda", "Kenya", "Uganda", "Tanzania", "Burundi", "DR Congo", "Ethiopia", "Nigeria", "Ghana", "South Africa", "Other"];
const CURRENCIES = [["RWF", "Rwandan franc"], ["KES", "Kenyan shilling"], ["UGX", "Ugandan shilling"], ["TZS", "Tanzanian shilling"], ["USD", "US dollar"], ["EUR", "Euro"]];
const STEP_FIELDS = [["name", "email", "password"], ["company", "country"], ["service", "terms"]];

/** A3: one form, three steps with client checks per step; server re-validates everything on submit. */
export function SignUpForm({ preselect }: { preselect?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, null);
  const submit = useKeepValuesSubmit(action);
  const [step, setStep] = useState(0);
  const [local, setLocal] = useState<Record<string, string>>({});
  const [service, setService] = useState(preselect === "leases" ? "leases" : "ecl");
  const [size, setSize] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const server = state && !state.ok ? state.fields ?? {} : {};
  const err = { ...server, ...local };

  // Jump back to the first step with a server error.
  const firstBad = STEP_FIELDS.findIndex((fs) => fs.some((k) => server[k]));
  const [seen, setSeen] = useState<FormState>(null);
  if (state !== seen) { setSeen(state); if (firstBad >= 0) setStep(firstBad); }

  const next = () => {
    const fd = new FormData(form.current!);
    const g = (k: string) => String(fd.get(k) ?? "").trim();
    const e: Record<string, string> = {};
    if (step === 0) {
      if (g("name").length < 2) e.name = "Enter your full name.";
      if (!isEmail(g("email"))) e.email = "Enter a valid email address.";
      if (!passwordOk(String(fd.get("password") ?? ""))) e.password = "Use 12+ characters that aren't in known breaches.";
    } else {
      if (g("company").length < 2) e.company = "Enter your company name.";
      if (!g("country")) e.country = "Choose your country.";
    }
    setLocal(e);
    if (!Object.keys(e).length) setStep(step + 1);
  };

  const hide = (n: number) => (step === n ? "flex" : "hidden");
  return (
    <form ref={form} onSubmit={(e) => { setLocal({}); submit(e); }} noValidate className="flex flex-col gap-6">
      <Stepper current={step} steps={[{ label: "You" }, { label: "Company" }, { label: "Service" }]} />
      <div className={`${hide(0)} flex-col gap-4`}>
        <h2 className="text-h4">Create your account</h2>
        <Field label="Full name" id="su-name" required error={err.name}><Input name="name" autoComplete="name" /></Field>
        <Field label="Email" id="su-email" required help="A company email is preferred." error={err.email}><Input name="email" type="email" autoComplete="email" /></Field>
        {server.email?.includes("already") && <p className="-mt-2 text-micro"><Link href="/sign-in" className="text-link hover:underline">Sign in instead?</Link></p>}
        <div className="flex flex-col gap-1.5"><label htmlFor="su-password" className="text-small text-fg-body">Password <span className="text-negative">*</span></label><PasswordField id="su-password" meter autoComplete="new-password" invalid={Boolean(err.password)} />{err.password && <p role="alert" className="text-micro text-negative">{err.password}</p>}</div>
        <Button size="lg" className="w-full" onClick={next}>Continue</Button>
        <p className="text-center text-small text-fg-muted">Already have an account? <Link href="/sign-in" className="text-link hover:underline">Sign in</Link></p>
      </div>
      <div className={`${hide(1)} flex-col gap-4`}>
        <h2 className="text-h4">Tell us about your company</h2>
        <Field label="Company name" id="su-company" required error={err.company}><Input name="company" autoComplete="organization" /></Field>
        <Field label="Country" id="su-country" required error={err.country}><Select name="country" defaultValue=""><option value="" disabled>Choose…</option>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Reporting currency" id="su-currency"><Select name="currency" defaultValue="RWF">{CURRENCIES.map(([c, n]) => <option key={c} value={c}>{c} · {n}</option>)}</Select></Field>
        <Field label="Financial year end" id="su-fye"><Select name="fye" defaultValue="12">{["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => <option key={m} value={i + 1}>{new Date(2026, i + 1, 0).getDate()} {m}</option>)}</Select></Field>
        <div className="flex flex-col gap-1.5"><span className="text-small text-fg-body">Company size <span className="text-fg-muted">(optional)</span></span><input type="hidden" name="size" value={size} /><ToggleGroup label="Company size" value={size} onChange={setSize} options={["1-50", "51-250", "250+"].map((v) => ({ value: v, label: v.replace("-", " to ").replace("+", " or more") }))} /></div>
        <div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(0)}>Back</Button><Button onClick={next}>Continue</Button></div>
      </div>
      <div className={`${hide(2)} flex-col gap-4`}>
        <h2 className="text-h4">What do you want to try first?</h2>
        <input type="hidden" name="service" value={service} />
        <CardSelector label="Service to try" value={service} onChange={setService} options={[
          { value: "ecl", title: "Expected Credit Loss", description: "IFRS 9", icon: <Icon name="ecl" /> },
          { value: "leases", title: "Lease Accounting", description: "IFRS 16", icon: <Icon name="leases" /> },
          { value: "tax", title: "Tax Provision", description: "IAS 12", icon: <Icon name="tax" />, badge: <Badge>Soon</Badge>, disabled: true },
        ]} />
        <p className="text-micro text-fg-muted">Not sure? Pick one. You can add the other later.</p>
        {err.service && <p role="alert" className="text-micro text-negative">{err.service}</p>}
        <Checkbox name="terms" label={<>I agree to the <Link href="/legal/terms" className="text-link underline" target="_blank">Terms</Link> and <Link href="/legal/privacy" className="text-link underline" target="_blank">Privacy Policy</Link></>} aria-invalid={Boolean(err.terms) || undefined} />
        {err.terms && <p role="alert" className="text-micro text-negative">{err.terms}</p>}
        {Object.keys(server).length > 0 && firstBad === 2 && <FormAlert>Please fix the highlighted fields.</FormAlert>}
        <div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(1)}>Back</Button><Button type="submit" loading={pending}>Create workspace</Button></div>
      </div>
    </form>
  );
}
