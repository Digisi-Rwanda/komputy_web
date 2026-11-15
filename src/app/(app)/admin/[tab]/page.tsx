import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminHeader, ADMIN_LABEL } from "@/components/organisms/admin/AdminHeader";
import { AdminOverview } from "@/components/organisms/admin/AdminOverview";
import { AuditLog } from "@/components/organisms/admin/AuditLog";
import { DangerZone } from "@/components/organisms/admin/DangerZone";
import { Members } from "@/components/organisms/admin/Members";
import { Profile } from "@/components/organisms/admin/Profile";
import { Requests } from "@/components/organisms/admin/Requests";
import { Security } from "@/components/organisms/admin/Security";
import { Services } from "@/components/organisms/admin/AdminServices";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { adminOverview, requestHistory, serviceCards } from "@/server/dal/workspace-admin";
import { getWorkspace } from "@/server/dal/workspace";
import { listAudit } from "@/server/dal/audit";
import { listMembers } from "@/server/dal/members";
import { listMemberRequests } from "@/server/dal/requests";
import { getSecurity } from "@/server/dal/security";
import { requireMember } from "@/server/session";
import { TABS } from "@/lib/nav";
import { one } from "@/lib/search";

type Tab = (typeof TABS.admin)[number];

export function generateStaticParams() {
  return TABS.admin.map((tab) => ({ tab }));
}

export async function generateMetadata({ params }: PageProps<"/admin/[tab]">) {
  const t = (await params).tab as Tab;
  return { title: `${ADMIN_LABEL[t] ?? "Admin"} · Workspace admin` };
}

async function Audit({ searchParams }: { searchParams: PageProps<"/admin/[tab]">["searchParams"] }) {
  const p = await requireMember("audit.view");
  return <AuditLog events={await listAudit(p.tenantId)} initialQuery={one((await searchParams).q)} />;
}

async function RequestsTab() {
  const p = await requireMember("requests.decide");
  return <Requests initial={await listMemberRequests(p.tenantId)} />;
}

async function SecurityTab() {
  const p = await requireMember("security.manage");
  return <Security view={await getSecurity(p.tenantId)} />;
}

async function MembersTab() {
  const p = await requireMember("members.view");
  return <Members initial={await listMembers(p.tenantId)} />;
}

async function DangerTab() {
  const p = await requireMember("ownership.transfer");
  const [members, ws] = await Promise.all([listMembers(p.tenantId), getWorkspace(p.tenantId)]);
  const t = ws!.tenant;
  return <DangerZone admins={members.filter((m) => m.workspaceRole === "admin" && m.status === "active")} name={t.name} closingOn={t.status === "closing" && t.closeRequestedAt ? new Date(t.closeRequestedAt.getTime() + 30 * 864e5).toISOString() : null} />;
}

async function OverviewTab() {
  const p = await requireMember("members.view");
  return <AdminOverview data={await adminOverview(p.tenantId)} />;
}

async function ServicesTab() {
  const p = await requireMember("services.request");
  const ws = await getWorkspace(p.tenantId);
  const [cards, history] = await Promise.all([serviceCards(p.tenantId), requestHistory(p.tenantId)]);
  const am = ws?.tenant.accountManagerId ? (await db.select({ name: schema.users.name, email: schema.users.email }).from(schema.users).where(eq(schema.users.id, ws.tenant.accountManagerId)))[0] : undefined;
  return <Services cards={cards} history={history} accountManager={am} />;
}

async function ProfileTab() {
  const p = await requireMember("workspace.update");
  const t = (await getWorkspace(p.tenantId))!.tenant;
  const [creator] = await db.select({ name: schema.users.name }).from(schema.tenantMemberships).innerJoin(schema.users, eq(schema.users.id, schema.tenantMemberships.userId)).where(and(eq(schema.tenantMemberships.tenantId, t.id), eq(schema.tenantMemberships.workspaceRole, "owner")));
  return <Profile ws={{ id: t.id, name: t.name, legal: t.legalName ?? t.name, country: t.country ?? "", currency: t.currency, fye: t.fiscalYearEnd, date: t.reportingCadence === "quarterly" ? "quarter-end" : "month-end", region: t.region ?? "Default region", logo: t.logo, created: `${t.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}${creator ? ` · owner ${creator.name}` : ""}` }} />;
}

const wait = (node: React.ReactNode) => <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}>{node}</Suspense>;

// Company admin CA1-CA9 (blueprint §14). Params are read inside Suspense so navigation stays instant.
export default function WorkspaceAdminPage({ params, searchParams }: PageProps<"/admin/[tab]">) {
  return wait(<AdminTab params={params} searchParams={searchParams} />);
}

async function AdminTab({ params, searchParams }: PageProps<"/admin/[tab]">) {
  const tab = (await params).tab as Tab;
  if (!TABS.admin.includes(tab)) notFound();
  const body = {
    overview: wait(<OverviewTab />),
    members: wait(<MembersTab />),
    services: wait(<ServicesTab />),
    requests: wait(<RequestsTab />),
    profile: wait(<ProfileTab />),
    security: wait(<SecurityTab />),
    "audit-log": wait(<Audit searchParams={searchParams} />),
    "danger-zone": wait(<DangerTab />),
  }[tab];
  const p = await requireMember("workspace.view");
  const [ws, open] = await Promise.all([getWorkspace(p.tenantId), db.$count(schema.accessRequests, and(eq(schema.accessRequests.tenantId, p.tenantId), eq(schema.accessRequests.scope, "member"), eq(schema.accessRequests.status, "open")))]);
  return <><AdminHeader tab={tab} code={`WS · ${(ws?.tenant.slug ?? "").toUpperCase()}`} openRequests={open} />{body}</>;
}
