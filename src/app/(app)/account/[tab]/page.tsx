import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/organisms/PageHeader";
import { AccountNav, ACCOUNT_LABEL } from "@/components/organisms/account/AccountNav";
import { Appearance } from "@/components/organisms/account/Appearance";
import { MyWorkspaces } from "@/components/organisms/account/MyWorkspaces";
import { NotificationPrefs } from "@/components/organisms/account/NotificationPrefs";
import { ProfileForm } from "@/components/organisms/account/ProfileForm";
import { SecurityPanel } from "@/components/organisms/account/SecurityPanel";
import { TABS } from "@/lib/nav";
import { fetchNotificationPrefs } from "@/lib/actions/notifications";
import { getAccount, listMySessions } from "@/server/dal/account";
import { listMyWorkspaces } from "@/server/dal/workspace";
import { requireMember } from "@/server/session";

type Tab = (typeof TABS.account)[number];

export function generateStaticParams() {
  return TABS.account.map((tab) => ({ tab }));
}

export async function generateMetadata({ params }: PageProps<"/account/[tab]">) {
  return { title: `${ACCOUNT_LABEL[(await params).tab as Tab] ?? "Account"} · Account` };
}

// NA2-NA5. Params are read inside Suspense so navigation stays instant.
export default function AccountPage({ params }: PageProps<"/account/[tab]">) {
  return <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><AccountTab params={params} /></Suspense>;
}

async function AccountTab({ params }: { params: PageProps<"/account/[tab]">["params"] }) {
  const tab = (await params).tab as Tab;
  if (!TABS.account.includes(tab)) notFound();
  const p = await requireMember("workspace.view", { allowMfaPending: true }); // account pages must stay reachable to set up MFA
  const security = async () => {
    const [a, sessions] = await Promise.all([getAccount(p.userId), listMySessions(p.userId, p.sessionId)]);
    return <SecurityPanel mfa={a.mfa} passwordChanged={a.passwordChanged} mfaRequired={Boolean(p.mfaPending) || false} sessions={sessions} />;
  };
  const body = { profile: tab === "profile" ? <ProfileForm profile={await getAccount(p.userId)} /> : null, security: tab === "security" ? await security() : null, notifications: tab === "notifications" ? <NotificationPrefs {...await fetchNotificationPrefs().then((r) => ({ saved: r.matrix, digest: r.digest }))} /> : null, appearance: <Appearance />, workspaces: tab === "workspaces" ? <MyWorkspaces items={(await listMyWorkspaces(p.userId)).map(({ ws, role }) => ({ id: ws.id, name: ws.name, role, initial: ws.initial, current: ws.id === p.tenantId, services: ws.entitlements.map((e) => `${e.service === "ecl" ? "ECL" : e.service === "leases" ? "Leases" : e.service}${e.state === "trial" ? " (Trial)" : ""}`).join(", ") || "No services yet" }))} /> : null }[tab];
  return (
    <>
      <PageHeader crumbs={[{ label: "Account", href: "/account/profile" }, { label: ACCOUNT_LABEL[tab] }]} title={ACCOUNT_LABEL[tab]} />
      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]"><AccountNav tab={tab} />{body}</div>
    </>
  );
}
