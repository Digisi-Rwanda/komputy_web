import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { MetaChip } from "@/components/atoms/Chip";
import { RunStatusPill } from "@/components/atoms/StatusPill";
import { SegmentedTabs } from "@/components/molecules/Tabs";
import { PageHeader } from "@/components/organisms/PageHeader";
import { RunActions } from "@/components/organisms/ecl/RunActions";
import { date } from "@/lib/format";
import type { Run } from "@/types/domain";

const TABS = [["summary", "Summary"], ["results", "Results"], ["exceptions", "Exceptions"], ["reconciliation", "Reconciliation"], ["inputs", "Inputs"], ["methodology", "Methodology"], ["outputs", "Outputs"], ["audit", "Audit"]] as const;

/** R1–R8 header: status, engine/date/currency chips, signed-off by/at, actions, 8 tabs. */
export function RunHeader({ run, tab }: { run: Run; tab: string }) {
  const signed = run.status === "signed-off";
  return (
    <PageHeader
      crumbs={[{ label: "Expected Credit Loss", href: "/ecl" }, { label: "Runs", href: "/ecl/runs" }, { label: run.id }]}
      title={run.name}
      status={<RunStatusPill status={run.status} />}
      meta={<><MetaChip>{run.engine}</MetaChip><MetaChip>{date(run.reportingDate)}</MetaChip><MetaChip>{run.currency}</MetaChip></>}
      description={signed && run.signedOffAt ? `Signed off by ${run.reviewer} · ${date(run.signedOffAt.slice(0, 10))} ${run.signedOffAt.slice(11, 16)}` : `Created by ${run.createdBy}`}
      actions={<>
        {signed && <Button asChild variant="secondary" icon={<Download />}><Link href={`/ecl/runs/${run.id}/outputs`}>Download bundle</Link></Button>}
        <Button asChild><Link href={`/ecl/compare?a=RUN-0137&b=${run.id}`}>Compare with…</Link></Button>
        <RunActions id={run.id} draft={run.status === "draft"} />
      </>}
      tabs={<SegmentedTabs label="Run sections" active={`/ecl/runs/${run.id}/${tab}`} items={TABS.map(([t, l]) => ({ label: l, href: `/ecl/runs/${run.id}/${t}`, count: t === "exceptions" ? run.exceptions || undefined : undefined }))} />}
    />
  );
}
