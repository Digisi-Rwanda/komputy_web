"use client";
import { useActionState } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { RadioGroup } from "@/components/atoms/RadioGroup";
import { Select } from "@/components/atoms/Select";
import { FormAlert } from "@/components/molecules/FormAlert";
import { createMyWorkspace } from "@/lib/actions/workspace";

/** A3 → new workspace: company, country, one service to trial. You become its owner. */
export function NewWorkspaceForm() {
  const [state, action, pending] = useActionState(createMyWorkspace, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-small text-fg-body">Company name<Input name="company" required maxLength={80} autoComplete="organization" /></label>
      <label className="flex flex-col gap-1.5 text-small text-fg-body">Country<Select name="country" defaultValue="Rwanda">{["Rwanda", "Kenya", "Uganda", "Tanzania", "Burundi", "Ghana", "Nigeria", "Other"].map((c) => <option key={c}>{c}</option>)}</Select></label>
      <div className="flex flex-col gap-2"><span className="text-small text-fg-body">Start a 14-day trial of</span><RadioGroup name="service" defaultValue="ecl" options={[{ value: "ecl", label: "Expected Credit Loss (IFRS 9)" }, { value: "leases", label: "Lease Accounting (IFRS 16)" }]} /></div>
      {state && !state.ok && <FormAlert>{state.error}</FormAlert>}
      <Button type="submit" size="lg" loading={pending} className="w-full">Create workspace</Button>
    </form>
  );
}
