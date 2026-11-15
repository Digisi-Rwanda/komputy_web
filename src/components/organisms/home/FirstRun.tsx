import Link from "next/link";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";

const STEPS = ["Set up segments and collateral", "Upload PD, LGD and EAD", "Compute and sign off"];

/** HM3 brand-new workspace hero: three steps + two choices. */
export function FirstRun() {
  return (
    <section aria-labelledby="first-run" className="flex flex-col gap-8">
      <div><h1 id="first-run" className="text-[32px] leading-tight tracking-[-0.03em] md:text-h1">Let&apos;s get your first provision computed</h1><p className="mt-2 text-body text-fg-muted">Three workbooks in, a signed off ECL out.</p></div>
      <ol className="bg-blueprint grid gap-px overflow-hidden rounded-panel border border-line bg-line md:grid-cols-3">
        {STEPS.map((s, i) => <li key={s} className="flex flex-col gap-2 bg-canvas p-6"><span className="font-mono text-h3 text-fg-muted">{i + 1}</span><span className="text-small text-fg">{s}</span></li>)}
      </ol>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="ring-inner flex flex-col gap-3 rounded-panel border border-line bg-raised p-6"><Badge tone="info" className="w-fit">Recommended · doesn&apos;t use trial runs</Badge><h2 className="text-h4">Try with sample data</h2><p className="flex-1 text-small text-fg-muted">A full run on 60 loans in about two minutes.</p><Button asChild className="w-fit"><Link href="/ecl/sample?run=1">Run sample</Link></Button></div>
        <div className="flex flex-col gap-3 rounded-panel border border-line p-6"><Badge className="w-fit">Your data</Badge><h2 className="text-h4">Start with my data</h2><p className="flex-1 text-small text-fg-muted">Fill the three templates and upload them.</p><div className="flex items-center gap-4"><Button asChild variant="secondary"><Link href="/ecl/runs/new">New run</Link></Button><Link href="/ecl/setup/templates" className="text-small text-link hover:underline">Download templates</Link></div></div>
      </div>
    </section>
  );
}
