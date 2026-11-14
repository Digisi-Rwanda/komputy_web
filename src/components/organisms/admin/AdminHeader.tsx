import { MetaChip } from "@/components/atoms/Chip";
import { SegmentedTabs } from "@/components/molecules/Tabs";
import { PageHeader } from "@/components/organisms/PageHeader";
import { TABS } from "@/lib/nav";

export const ADMIN_LABEL: Record<(typeof TABS.admin)[number], string> = { overview: "Overview", members: "Members", services: "Services & usage", requests: "Requests", profile: "Profile", security: "Security", "audit-log": "Audit log", "danger-zone": "Danger zone" };

export function AdminHeader({ tab, code, openRequests }: { tab: (typeof TABS.admin)[number]; code: string; openRequests: number }) {
  return (
    <PageHeader
      crumbs={[{ label: "Admin", href: "/admin/overview" }, { label: ADMIN_LABEL[tab] }]}
      title="Workspace admin"
      meta={<MetaChip>{code}</MetaChip>}
      tabs={<SegmentedTabs active={`/admin/${tab}`} items={TABS.admin.map((t) => ({ label: ADMIN_LABEL[t], href: `/admin/${t}`, count: t === "requests" && openRequests ? openRequests : undefined }))} />}
    />
  );
}
