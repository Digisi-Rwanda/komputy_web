"use client";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Checkbox } from "@/components/atoms/Checkbox";
import { verifyMfa, type FormState } from "@/lib/actions/auth";
import { FormAlert } from "@/components/molecules/FormAlert";
import { OtpInput } from "@/components/molecules/OtpInput";

/** A2: authenticator code (auto-submits when complete), wrong code, backup code mode. */
export function MfaForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(verifyMfa, null);
  const [backup, setBackup] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const err = state && !state.ok ? state.error : undefined;
  return (
    <form ref={form} action={action} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="mode" value={backup ? "backup" : "totp"} />
      {err && <FormAlert>{err}</FormAlert>}
      {backup ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mfa-backup" className="text-small text-fg-body">Backup code</label>
          <Input id="mfa-backup" name="code" placeholder="XXXX-XXXX" autoComplete="one-time-code" className="font-mono uppercase" invalid={Boolean(err)} autoFocus />
          <p className="text-micro text-fg-muted">Each backup code works once.</p>
        </div>
      ) : (
        <OtpInput key={String(state && !state.ok)} invalid={Boolean(err)} onComplete={() => setTimeout(() => form.current?.requestSubmit(), 0)} />
      )}
      <Checkbox name="trust" label="Trust this device for 30 days" />
      <Button type="submit" size="lg" loading={pending} className="w-full">Verify</Button>
      <p className="flex flex-wrap justify-center gap-x-2 text-small">
        <button type="button" onClick={() => setBackup((v) => !v)} className="text-link hover:underline">{backup ? "Use your authenticator app" : "Use a backup code"}</button>
        <span className="text-fg-muted">·</span>
        <Link href="/sign-in" className="text-link hover:underline">Sign in as someone else</Link>
      </p>
    </form>
  );
}
