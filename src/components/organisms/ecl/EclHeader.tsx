import Link from "next/link";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { MetaChip } from "@/components/atoms/Chip";
import { SegmentedTabs } from "@/components/molecules/Tabs";
import { PageHeader } from "@/components/organisms/PageHeader";
import type { ReactNode } from "react";

/** Shared ECL page header: title, IFRS 9 chip, actions, Overview | Runs | Results tabs. */
export function EclHeader({ active, title = "Expected Credit Loss", meta, actions }: { active: "/ecl" | "/ecl/runs" | "/ecl/results"; title?: string; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <PageHeader
      title={title}
      meta={meta ?? <MetaChip>IFRS 9</MetaChip>}
      actions={actions ?? <><Button asChild icon={<Icon name="plus" />}><Link href="/ecl/runs/new">New run</Link></Button><Button asChild variant="secondary" icon={<Icon name="download" />}><Link href="/ecl/runs/RUN-0142/outputs">Latest bundle</Link></Button></>}
      tabs={<SegmentedTabs active={active} items={[{ label: "Overview", href: "/ecl" }, { label: "Runs", href: "/ecl/runs" }, { label: "Results", href: "/ecl/results" }]} />}
    />
  );
}
