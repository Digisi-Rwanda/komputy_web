import { isComputed } from "@/lib/entitlements";
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
export function RunHeader({ run, tab, canDelete = false, canRerun = false }: { run: Run; tab: string; canDelete?: boolean; canRerun?: boolean }) {
  const signed = run.status === "signed-off";
  return (
    <PageHeader
      crumbs={[{ label: "Expected Credit Loss", href: "/ecl" }, { label: "Runs", href: "/ecl/runs" }, { label: run.name }]}
      title={run.name}
      status={<RunStatusPill status={run.status} />}
      meta={<><MetaChip>{run.engine}</MetaChip><MetaChip>{date(run.reportingDate)}</MetaChip><MetaChip>{run.currency}</MetaChip></>}
      description={signed && run.signedOffAt ? `Signed off by ${run.reviewer} · ${date(run.signedOffAt.slice(0, 10))} ${run.signedOffAt.slice(11, 16)}` : `Created by ${run.createdBy}`}
      actions={<>
        {signed && <Button asChild variant="secondary" icon={<Download />}><Link href={`/api/ecl/runs/${run.id}/downloads/bundle`}>Download bundle</Link></Button>}
        {isComputed(run) && <Button asChild><Link href={`/ecl/compare?b=${run.id}`}>Compare with…</Link></Button>}
        <RunActions id={run.id} name={run.name} canDelete={canDelete} canRerun={canRerun && isComputed(run)} />
      </>}
      tabs={<SegmentedTabs label="Run sections" active={`/ecl/runs/${run.id}/${tab}`} items={TABS.map(([t, l]) => ({ label: l, href: `/ecl/runs/${run.id}/${t}`, count: t === "exceptions" ? run.exceptions || undefined : undefined }))} />}
    />
  );
}
