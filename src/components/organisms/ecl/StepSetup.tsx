"use client";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Textarea } from "@/components/atoms/Textarea";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "@/components/organisms/Toaster";
import { createRun } from "@/lib/actions/ecl";
import { Field } from "@/components/molecules/Field";
import { DatePicker } from "@/components/molecules/DatePicker";
import { Sheet } from "@/components/organisms/Modal";
import { CollateralSetup, SegmentsSetup, ThresholdsSetup } from "@/components/organisms/ecl/Setup";
import type { WizardSetup } from "@/components/organisms/ecl/Wizard";
import { setDraft, useDraft } from "@/hooks/useRunDraft";
import { WizardShell } from "@/components/organisms/ecl/Shell";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function UseCard({ title, value, editor }: { title: string; value: string; editor: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-panel border border-line p-5">
      <p className="text-small text-fg">{title}</p>
      <p className="flex-1 text-micro text-fg-muted">{value}</p>
      <Sheet title={`Edit ${title.toLowerCase()}`} width="w-[760px]" trigger={<button type="button" className="inline-flex w-fit items-center gap-1 text-micro text-link hover:underline">Edit in Setup<ExternalLink aria-hidden className="size-3" /></button>}>{editor}</Sheet>
    </div>
  );
}

/** W1 step 1: run settings + what this run will use (edit in a side drawer without leaving the wizard). */
export function StepSetup({ setup }: { setup?: WizardSetup }) {
  const seg = (setup?.segments ?? []).filter((s) => s.active), col = setup?.collateral ?? [], th = setup?.thresholds ?? [];
  const d = useDraft(), router = useRouter();
  const [busy, start] = useTransition();
  const next = () => start(async () => {
    if (d.runId) { router.push(`/ecl/runs/new/pd?run=${d.runId}`); return; }
    const r = await createRun({ name: d.name.trim() || "Untitled run", reportingDate: d.reportingDate || undefined, currency: d.currency, reportingPeriod: d.description || undefined });
    if (!r.ok) { toast.error(r.error); return; }
    setDraft({ runId: r.data.fullId, id: d.name });
    router.push(`/ecl/runs/new/pd?run=${r.data.fullId}`);
  });
  return (
    <WizardShell step={1} footer={<Button loading={busy} disabled={!d.name.trim()} onClick={next} right={<ArrowRight />}>{d.runId ? "Continue to PD data" : "Create run and continue"}</Button>}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4">
            <h2 className="text-h4">Run settings</h2>
            <div className="grid gap-5 rounded-panel border border-line p-6 sm:grid-cols-2">
              <Field label="Run name" id="ws-name" className="sm:col-span-2"><Input value={d.name} maxLength={200} disabled={Boolean(d.runId)} onChange={(e) => setDraft({ name: e.target.value })} /></Field>
              <Field label="Reporting date" id="ws-date" help={d.reportingDate ? "Exposure rows with another Reporting Date are excluded." : "Leave empty to use the EAD file's reporting date."}><DatePicker value={d.reportingDate ? new Date(d.reportingDate + "T00:00:00") : undefined} placeholder="From the EAD file" monthEndOnly onChange={(v) => !d.runId && setDraft({ reportingDate: v ? iso(v) : "" })} /></Field>
              <Field label="Currency" id="ws-cur"><Select value={d.currency} disabled={Boolean(d.runId)} onChange={(e) => setDraft({ currency: e.target.value })}>{[["USD", "US dollar"], ["RWF", "Rwandan franc"], ["KES", "Kenyan shilling"], ["UGX", "Ugandan shilling"], ["TZS", "Tanzanian shilling"], ["EUR", "Euro"]].map(([c, n]) => <option key={c} value={c}>{c} · {n}</option>)}</Select></Field>
              <Field label="Engine version" id="ws-engine" help="The workspace default (set by Komputy)."><Select value={d.engine} disabled><option value={d.engine}>{d.engine === "current" ? "Current release" : d.engine}</option></Select></Field>
              <Field label="Description" id="ws-desc" optional className="sm:col-span-2"><Textarea value={d.description} maxLength={500} onChange={(e) => setDraft({ description: e.target.value })} placeholder="Month-end provision for the board pack." /></Field>
            </div>
          </section>
          <section className="flex flex-col gap-4">
            <h2 className="text-h4">What this run will use</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <UseCard title="Segments" value={seg.length ? `${seg.length} active · ${seg.map((s) => s.name).join(", ")}` : "Detected from your PD file"} editor={<SegmentsSetup initial={setup?.segments ?? []} />} />
              <UseCard title="Collateral types" value={col.length ? `${col.length} · ${col.map((c) => `${c.name} ${Math.round(c.haircut * 100)} %`).join(", ")}` : "None yet: add the types in your collateral sheet"} editor={<CollateralSetup initial={col} />} />
              <UseCard title="Validation thresholds" value={th.length ? `Max month gap ${th[0].value} · min transitions ${th[1].value}` : "Platform defaults"} editor={<ThresholdsSetup initial={th} />} />
            </div>
          </section>
        </div>
        <aside className="flex h-fit flex-col gap-3 rounded-panel border border-line p-5">
          <p className="text-small text-fg">Before you start</p>
          {["PD workbook: monthly staging history", "LGD workbook: customer collateral", "EAD workbook: loan exposures at the reporting date"].map((t) => <p key={t} className="flex gap-2 text-small text-fg-muted"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-positive" />{t}</p>)}
          <Link href="/ecl/setup/templates" className="text-small text-link hover:underline">Download templates →</Link>
        </aside>
      </div>
    </WizardShell>
  );
}
