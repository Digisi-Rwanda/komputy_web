"use client";
import Link from "next/link";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { MetaChip } from "@/components/atoms/Chip";
import { SegmentedTabs } from "@/components/molecules/Tabs";
import { PageHeader } from "@/components/organisms/PageHeader";
import { useLeaseData } from "@/components/organisms/leases/LeaseData";
import type { ReactNode } from "react";
import { month } from "@/lib/format";

/** Shared Leases header: IFRS 16 + open period chips, actions, Overview | Register | Inbox | Close tabs. */
export function LeasesHeader({ active, title = "Lease Accounting", description, actions, newDisabled }: { active?: string; title?: string; description?: ReactNode; actions?: ReactNode; newDisabled?: boolean }) {
  const leaseData = useLeaseData();
  return (
    <PageHeader
      crumbs={[{ label: "Lease Accounting", href: "/leases" }, ...(title !== "Lease Accounting" ? [{ label: title }] : [{ label: "Overview" }])]}
      title={title}
      meta={<><MetaChip>IFRS 16 (2019)</MetaChip><MetaChip>Period {month(leaseData.period)}</MetaChip></>}
      description={description}
      actions={actions ?? (newDisabled ? <Button disabled disabledReason="Finish setup first" icon={<Icon name="plus" />}>New lease</Button> : <Button asChild icon={<Icon name="plus" />}><Link href="/leases/new">New lease</Link></Button>)}
      tabs={active ? <SegmentedTabs active={active} items={[{ label: "Overview", href: "/leases" }, { label: "Register", href: "/leases/register" }, { label: "Inbox", href: "/leases/inbox", count: leaseData.inbox.length }, { label: "Close", href: "/leases/close" }]} /> : undefined}
    />
  );
}
