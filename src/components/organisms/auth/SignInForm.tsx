"use client";
import { useKeepValuesSubmit } from "@/hooks/useKeepValuesSubmit";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Badge } from "@/components/atoms/Badge";
import { Label } from "@/components/atoms/Label";
import { signIn, type FormState } from "@/lib/actions/auth";
import { FormAlert } from "@/components/molecules/FormAlert";
import { PasswordField } from "@/components/molecules/PasswordField";

const mmss = (ms: number) => `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

/** A1: default, wrong password (attempts left), locked (live countdown), SSO not configured. */
export function SignInForm({ next, notice }: { next: string; notice?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, null);
  const submit = useKeepValuesSubmit(action);
  const [now, setNow] = useState(() => Date.now());
  const [sso, setSso] = useState(false);
  const [email, setEmail] = useState("");
  const lockedUntil = state && !state.ok ? state.lockedUntil : undefined;
  const locked = lockedUntil != null && lockedUntil > now;
  useEffect(() => { if (!lockedUntil) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [lockedUntil]);
  const f = state && !state.ok ? state.fields ?? {} : {};

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      {notice && !state && <FormAlert tone="warning">{notice}</FormAlert>}
      {locked && <FormAlert tone="warning">Too many attempts. Try again in <span className="font-mono">{mmss(lockedUntil - now)}</span>, or <Link href="/forgot-password" className="text-link underline">reset your password</Link>.</FormAlert>}
      {!locked && state && !state.ok && state.error && <FormAlert>{state.error}{state.attemptsLeft != null && ` ${state.attemptsLeft} ${state.attemptsLeft === 1 ? "attempt" : "attempts"} left before a short lock.`}</FormAlert>}
      {sso && <FormAlert tone="warning">SSO isn&apos;t configured for {email.split("@")[1] || "your domain"}. Sign in with your password instead.</FormAlert>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="si-email">Work email</Label>
        <Input id="si-email" name="email" type="email" autoComplete="username" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} invalid={Boolean(f.email)} aria-describedby={f.email ? "si-email-err" : undefined} />
        {f.email && <p id="si-email-err" role="alert" className="text-micro text-negative">{f.email}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between"><Label htmlFor="si-password">Password</Label><Link href="/forgot-password" className="text-micro text-link hover:underline">Forgot password?</Link></div>
        <PasswordField id="si-password" invalid={Boolean(f.password)} />
        {f.password?.trim() && <p role="alert" className="text-micro text-negative">{f.password}</p>}
      </div>
      <Checkbox name="keep" label="Keep me signed in on this device" />
      <Button type="submit" size="lg" loading={pending} disabled={locked} className="w-full">Sign in</Button>
      <div className="flex items-center gap-3 text-micro text-fg-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
      <Button type="button" variant="secondary" size="lg" className="w-full" onClick={() => setSso(true)} right={<Badge>Enterprise</Badge>}>Sign in with SSO</Button>
      <p className="text-center text-small text-fg-muted">New to Komputy? <Link href="/sign-up" className="text-link hover:underline">Start a free trial →</Link></p>
    </form>
  );
}
