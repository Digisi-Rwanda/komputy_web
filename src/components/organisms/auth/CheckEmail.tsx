"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { resendVerification, type FormState } from "@/lib/actions/auth";

/** A4.1/A4.2: open mail app, resend with 60 s cooldown, change email, read-only tour link. */
export function CheckEmail({ email }: { email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resendVerification, null);
  const [left, setLeft] = useState(0);
  const [seen, setSeen] = useState(state);
  if (state !== seen) { setSeen(state); if (state?.ok) setLeft(60); } // start cooldown on each successful resend
  useEffect(() => { if (left <= 0) return; const t = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(t); }, [left]);
  return (
    <div className="flex flex-col items-center gap-4">
      <Button asChild size="lg" className="w-full"><a href="mailto:">Open email app</a></Button>
      <form action={action} className="flex w-full flex-col items-center gap-2">
        <input type="hidden" name="email" value={email} />
        <Button type="submit" variant="secondary" className="w-full" loading={pending} disabled={left > 0}>{left > 0 ? `Resend in 0:${String(left).padStart(2, "0")}` : "Resend email"}</Button>
        {state?.ok && <p role="status" className="flex items-center gap-1.5 text-micro text-positive"><CheckCircle2 className="size-3.5" />{state.message}</p>}
      </form>
      <Link href="/sign-up" className="text-small text-link hover:underline">Change email</Link>
      <p className="mt-2 rounded-card border border-line px-4 py-3 text-center text-micro text-fg-muted">You can look around in <Link href="/home?tour=1" className="text-link hover:underline">view only mode</Link> meanwhile. Uploads unlock once you verify.</p>
    </div>
  );
}

/** A4.3: verified, auto-continue after 3 s. */
export function Verified() {
  const router = useRouter();
  const [n, setN] = useState(3);
  useEffect(() => { if (n === 0) { router.push("/onboarding"); return; } const t = setTimeout(() => setN(n - 1), 1000); return () => clearTimeout(t); }, [n, router]);
  return (
    <div className="flex flex-col items-center gap-3">
      <Button asChild size="lg" className="w-full"><Link href="/onboarding">Continue to Komputy</Link></Button>
      <p aria-live="polite" className="text-micro text-fg-muted">Redirecting in {n}…</p>
    </div>
  );
}
