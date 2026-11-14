import Link from "next/link";
import { Button } from "@/components/atoms/Button";

const STEPS = ["Entity", "GL accounts", "Periods", "Policies", "Rate curves"];

/** AC3 frame 2: centred card after a Lease Accounting trial starts. */
export function TrialReady() {
  return (
    <section className="ring-inner mx-auto flex w-full max-w-xl flex-col items-center gap-5 rounded-panel border border-line bg-raised p-8 text-center animate-scale-in">
      <h2 className="text-h3">Your trial is ready</h2>
      <p className="text-small text-fg-muted">Set up Lease Accounting in five short steps, or explore with sample leases first.</p>
      <ol className="flex flex-wrap justify-center gap-2">{STEPS.map((s, i) => <li key={s} className="rounded-full border border-line px-3 py-1 text-micro text-fg-body"><span className="font-mono text-fg-muted">{i + 1}</span> {s}</li>)}</ol>
      <div className="flex flex-wrap items-center gap-4"><Button asChild><Link href="/leases/setup">Start setup</Link></Button><Link href="/leases/register?sample=1" className="text-small text-link hover:underline">Try with sample leases</Link></div>
    </section>
  );
}
