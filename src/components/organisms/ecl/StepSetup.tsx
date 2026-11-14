"use client";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Textarea } from "@/components/atoms/Textarea";
import { MetaChip } from "@/components/atoms/Chip";
import { Field } from "@/components/molecules/Field";
import { DatePicker } from "@/components/molecules/DatePicker";
import { Sheet } from "@/components/organisms/Modal";
import { CollateralSetup, SegmentsSetup, ThresholdsSetup } from "@/components/organisms/ecl/Setup";
import { getCollateralSetup, getSegmentsSetup, getThresholds } from "@/data/mock/index";
import { setDraft, useDraft } from "@/hooks/useRunDraft";
import { WizardShell } from "@/components/organisms/ecl/Shell";

const seg = getSegmentsSetup().filter((s) => s.active), col = getCollateralSetup(), th = getThresholds();
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
export function StepSetup() {
  const d = useDraft();
  return (
    <WizardShell step={1} footer={<Button asChild right={<ArrowRight />}><Link href="/ecl/runs/new/pd">Continue to PD data</Link></Button>}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4">
            <h2 className="text-h4">Run settings</h2>
            <div className="grid gap-5 rounded-panel border border-line p-6 sm:grid-cols-2">
              <Field label="Run name" id="ws-name" className="sm:col-span-2"><Input value={d.name} maxLength={80} onChange={(e) => setDraft({ name: e.target.value })} /></Field>
              <Field label="Reporting date" id="ws-date" help="Month-end. All three files must match this date."><DatePicker value={new Date(d.reportingDate + "T00:00:00")} monthEndOnly onChange={(v) => v && setDraft({ reportingDate: iso(v) })} /></Field>
              <Field label="Currency" id="ws-cur"><Select value={d.currency} onChange={(e) => setDraft({ currency: e.target.value })}><option value="USD">USD — US dollar</option><option value="RWF">RWF — Rwandan franc</option><option value="KES">KES — Kenyan shilling</option></Select></Field>
              <Field label="Engine version" id="ws-engine" help={<MetaChip>Pinned by Aline Mugisha</MetaChip>}><Select value={d.engine} disabled><option value="v1.3.0">v1.3.0 (workspace default)</option></Select></Field>
              <Field label="Description" id="ws-desc" optional className="sm:col-span-2"><Textarea value={d.description} maxLength={500} onChange={(e) => setDraft({ description: e.target.value })} placeholder="Month-end provision for the board pack." /></Field>
            </div>
          </section>
          <section className="flex flex-col gap-4">
            <h2 className="text-h4">What this run will use</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <UseCard title="Segments" value={`${seg.length} active · ${seg.map((s) => s.name).join(", ")}`} editor={<SegmentsSetup initial={getSegmentsSetup()} />} />
              <UseCard title="Collateral types" value={`${col.length} · ${col.map((c) => `${c.name} ${Math.round(c.haircut * 100)} %`).join(", ")}`} editor={<CollateralSetup initial={col} />} />
              <UseCard title="Validation thresholds" value={`Default profile · max month gap ${th[0].value} · min transitions ${th[1].value}`} editor={<ThresholdsSetup initial={th} />} />
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
