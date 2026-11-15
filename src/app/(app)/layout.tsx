import { Suspense } from "react";
import { AppShell } from "@/components/organisms/AppShell";
import { BannerStack } from "@/components/organisms/BannerStack";
import { IdleSignout } from "@/components/organisms/IdleSignout";
import { Tour } from "@/components/organisms/onboarding/Tour";
import { APP_NAV, APP_NAV_FOOTER } from "@/lib/nav";
import { daysLeft, entitlement } from "@/lib/entitlements";
import { getWorkspace, listMyWorkspaces } from "@/server/dal/workspace";
import { requireMember } from "@/server/session";
import { getUsage } from "@/server/dal/engine";

const ROLE = { owner: "Owner", admin: "Administrator", member: "Member" } as const;
const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

// The signed-in shell: real user, active workspace and its entitlements (sidebar states, trial banner, usage meter).
async function Shell({ children }: { children: React.ReactNode }) {
  const p = await requireMember("workspace.view", { allowMfaPending: true }); // pages enforce MFA; the shell must still render for /account/security
  const [ws, mine, usage] = await Promise.all([getWorkspace(p.tenantId), listMyWorkspaces(p.userId), getUsage(p).catch(() => null)]);
  if (!ws) return null;
  const leases = entitlement(ws, "leases");
  return (
    <AppShell
      notifications
      banners={<BannerStack workspace={ws} />}
      sidebar={{
        nav: APP_NAV,
        footer: APP_NAV_FOOTER,
        workspace: ws,
        workspaces: mine.map((m) => m.ws),
        roles: Object.fromEntries(mine.map((m) => [m.ws.id, m.role])),
        user: { name: p.name, initials: initials(p.name), role: ROLE[p.workspaceRole], image: p.image ?? undefined },
        states: { "/ecl": entitlement(ws, "ecl").state, "/leases": leases.state },
        usage: leases.state === "trial" && leases.quota ? { label: "Lease Accounting trial", used: usage?.ok ? usage.data.leases.active : 0, limit: leases.quota.limit, note: `${daysLeft(leases)} days left · Request full access` } : undefined,
      }}
    >
      {children}
      <Tour />
      {p.idleSignout && <IdleSignout />}
    </AppShell>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <Suspense fallback={<div className="flex h-dvh"><div className="skeleton hidden w-[264px] md:block" /><div className="flex-1 p-8"><div className="skeleton h-96 rounded-panel" /></div></div>}><Shell>{children}</Shell></Suspense>;
}
