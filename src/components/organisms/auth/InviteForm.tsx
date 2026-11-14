"use client";
import { useKeepValuesSubmit } from "@/hooks/useKeepValuesSubmit";
import Link from "next/link";
import { useActionState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Field } from "@/components/molecules/Field";
import { acceptInvite, type FormState } from "@/lib/actions/auth";
import { FormAlert } from "@/components/molecules/FormAlert";
import { PasswordField } from "@/components/molecules/PasswordField";

/** A6.1 existing account → sign in and join; A6.2 new → name + password. Never creates a second workspace. */
export function InviteForm({ invitationId, email, existing }: { invitationId: string; email: string; existing: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(acceptInvite, null);
  const submit = useKeepValuesSubmit(action);
  const f = state && !state.ok ? state.fields ?? {} : {};
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="invitation" value={invitationId} />
      <input type="hidden" name="mode" value={existing ? "existing" : "new"} />
      {existing ? (
        <p className="text-center text-small text-fg-muted">You already have a Ledgerline account ({email}).</p>
      ) : (
        <>
          <Field label="Full name" id="in-name" required error={f.name}><Input name="name" autoComplete="name" /></Field>
          <div className="flex flex-col gap-1.5"><span className="text-small text-fg-body">Email address</span><Input value={email} readOnly leading={<Lock />} aria-label="Email address (from invite)" /></div>
          <div className="flex flex-col gap-1.5"><label htmlFor="in-password" className="text-small text-fg-body">Password <span className="text-negative">*</span></label><PasswordField id="in-password" meter autoComplete="new-password" invalid={Boolean(f.password)} />{f.password && <p role="alert" className="text-micro text-negative">{f.password}</p>}</div>
          <Checkbox name="terms" label={<>I agree to the <Link href="/legal/terms" className="text-link underline">Terms</Link> and <Link href="/legal/privacy" className="text-link underline">Privacy Policy</Link></>} />
          {f.terms && <p role="alert" className="text-micro text-negative">{f.terms}</p>}
        </>
      )}
      {state && !state.ok && state.error && <FormAlert>{state.error}</FormAlert>}
      <Button type="submit" size="lg" loading={pending} className="w-full">{existing ? "Sign in and join" : "Create account and join"}</Button>
      {existing ? <Button asChild variant="link" className="self-center"><Link href="/">Decline</Link></Button> : <p className="text-center text-micro text-fg-muted">You&apos;re joining an existing workspace — no new workspace is created.</p>}
    </form>
  );
}
