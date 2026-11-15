"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { PageHeader } from "@/components/organisms/PageHeader";
import { markDone } from "@/hooks/useOnboarding";
import { createSampleRun } from "@/lib/actions/ecl";

/** O4: create the sample run in the engine, then continue in the real wizard (validate → compute → review). */
export function SampleRun() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void createSampleRun().then((r) => {
      if (!live) return;
      if (!r.ok) { setError(r.error); return; }
      markDone("ecl-first-run");
      router.replace(`/ecl/runs/new/pd?run=${r.data.fullId}`);
    });
    return () => { live = false; };
  }, [router]);
  return (
    <div className="flex flex-col gap-4">
      <PageHeader crumbs={[{ label: "Expected Credit Loss", href: "/ecl" }, { label: "Sample run" }]} title="Preparing a sample run" status={<Badge mono tone="info">Sample</Badge>} />
      {error ? <p className="rounded-panel border border-negative/40 bg-negative-tint p-5 text-small text-fg">{error}</p>
        : <p className="flex items-center gap-3 rounded-panel border border-line p-5 text-small text-fg-body"><Loader2 aria-hidden className="size-4 motion-safe:animate-spin text-link" />Loading the sample PD, LGD and EAD workbooks…</p>}
    </div>
  );
}

export function SampleChooser() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="ring-inner flex flex-col gap-3 rounded-panel border border-line bg-raised p-6">
        <Badge mono tone="info" className="w-fit">Sample</Badge>
        <h3 className="text-h4">Use sample data</h3>
        <p className="flex-1 text-small text-fg-muted">A small bank portfolio (Jan–Apr 2025, three segments). You validate and compute it like real data. It doesn&apos;t use a trial run.</p>
        <Button asChild className="w-fit"><Link href="/ecl/sample?run=1">Run sample</Link></Button>
      </div>
      <div className="flex flex-col gap-3 rounded-panel border border-line p-6">
        <Badge className="w-fit">Your data</Badge>
        <h3 className="text-h4">Use my own data</h3>
        <p className="flex-1 text-small text-fg-muted">Download templates, fill them, upload.</p>
        <div className="flex flex-wrap items-center gap-3"><Button asChild variant="secondary"><Link href="/ecl/runs/new">Start a new run</Link></Button><Link href="/ecl/setup/templates" className="text-small text-link hover:underline">Download templates</Link></div>
      </div>
    </div>
  );
}
