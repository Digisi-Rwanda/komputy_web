"use client";
import { useKeepValuesSubmit } from "@/hooks/useKeepValuesSubmit";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Field } from "@/components/molecules/Field";
import { requestReset, resetPassword, type FormState } from "@/lib/actions/auth";
import { AuthCard } from "@/components/organisms/auth/AuthCard";
import { FormAlert } from "@/components/molecules/FormAlert";
import { PasswordField } from "@/components/molecules/PasswordField";

export function ForgotForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestReset, null);
  const submit = useKeepValuesSubmit(action);
  if (state?.ok) return (
    <AuthCard icon="mail" title="Check your inbox" sub={<>If an account exists for <span className="text-fg">{state.message}</span>, we sent a reset link. It expires in 1 hour.</>}>
      <Button asChild variant="secondary" className="w-full"><Link href="/sign-in">Back to sign in</Link></Button>
    </AuthCard>
  );
  const f = state && !state.ok ? state.fields ?? {} : {};
  return (
    <AuthCard title="Reset your password" sub="Enter your email and we'll send you a reset link.">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Email" id="fp-email" error={f.email}><Input name="email" type="email" autoComplete="email" /></Field>
        <Button type="submit" size="lg" loading={pending} className="w-full">Send reset link</Button>
        <Link href="/sign-in" className="text-center text-small text-link hover:underline">Back to sign in</Link>
      </form>
    </AuthCard>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, null);
  const submit = useKeepValuesSubmit(action);
  if (state?.ok) return (
    <AuthCard icon="check-circle" iconTone="positive" title="Password updated" sub="All other sessions were signed out. Sign in with your new password.">
      <Button asChild size="lg" className="w-full"><Link href="/sign-in">Sign in</Link></Button>
    </AuthCard>
  );
  const f = state && !state.ok ? state.fields ?? {} : {};
  return (
    <AuthCard title="Choose a new password" sub="Use 12+ characters that aren't in known breaches.">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {state && !state.ok && state.error && <FormAlert>{state.error} <Link href="/forgot-password" className="text-link underline">Request a new link</Link></FormAlert>}
        <input type="hidden" name="token" value={token} />
        <div className="flex flex-col gap-1.5"><label htmlFor="rp-password" className="text-small text-fg-body">New password</label><PasswordField id="rp-password" meter autoComplete="new-password" invalid={Boolean(f.password)} />{f.password && <p role="alert" className="text-micro text-negative">{f.password}</p>}</div>
        <div className="flex flex-col gap-1.5"><label htmlFor="rp-confirm" className="text-small text-fg-body">Confirm password</label><PasswordField id="rp-confirm" name="confirm" autoComplete="new-password" invalid={Boolean(f.confirm)} />{f.confirm && <p role="alert" className="text-micro text-negative">{f.confirm}</p>}</div>
        <p className="text-micro text-fg-muted">For your security, all other sessions will be signed out.</p>
        <Button type="submit" size="lg" loading={pending} className="w-full">Update password</Button>
      </form>
    </AuthCard>
  );
}
