import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, Section } from "@/components/organisms/PageHeader";
import { Checklist } from "@/components/organisms/onboarding/Checklist";
import { TourMode } from "@/components/organisms/onboarding/TourMode";
import { WelcomeModal } from "@/components/organisms/onboarding/WelcomeModal";
import { Attention } from "@/components/organisms/home/Attention";
import { ComingSoon, RecentActivity, WhatsNew } from "@/components/organisms/home/Feed";
import { EclCard, LeasesCard, LockedCard } from "@/components/organisms/home/ServiceCards";
import { FirstRun } from "@/components/organisms/home/FirstRun";
import { daysLeft, entitlement } from "@/lib/entitlements";
import { listAudit } from "@/server/dal/audit";
import { homeAttention } from "@/server/dal/home";
import { listRuns } from "@/server/dal/engine";
import { getLeaseBook } from "@/server/dal/leases";
import { can } from "@/server/policy";
import { isComputed } from "@/lib/entitlements";
import { getOnboarding } from "@/server/dal/onboarding";
import { getWorkspace } from "@/server/dal/workspace";
import { requireMember } from "@/server/session";
import { one } from "@/lib/search";
import type { Entitlement } from "@/types/domain";

export const metadata: Metadata = { title: "Home" };

// Home (blueprint §10, HM1-HM4). `?scenario=trial` = ECL trial + Leases locked (HM2); `?scenario=new` = brand-new workspace (HM3).
async function Body({ searchParams }: { searchParams: PageProps<"/home">["searchParams"] }) {
  const sp = await searchParams;
  const scenario = one(sp.scenario);
  const p = await requireMember();
  const ws = (await getWorkspace(p.tenantId))!, first = p.name.split(" ")[0];
  let ecl: Entitlement = entitlement(ws, "ecl"), leases: Entitlement = entitlement(ws, "leases");
  if (scenario === "trial" || scenario === "new") {
    ecl = { service: "ecl", state: "trial", trialEndsAt: "2026-11-20", quota: { used: scenario === "new" ? 0 : 2, limit: 5, unit: "runs" } };
    leases = { service: "leases", state: "locked" };
  }
  const usable = (e: Entitlement) => e.state === "active" || e.state === "trial";
  const [runs, book] = await Promise.all([
    usable(ecl) && can(p, "ecl.view") ? listRuns(p) : null,
    usable(leases) && can(p, "leases.view") ? getLeaseBook(p) : null,
  ]);
  const computed = runs?.ok ? runs.data.filter(isComputed) : [];
  const latestRun = computed.find((r) => r.status === "signed-off") ?? computed[0];
  const lb = book?.ok ? book.data : null;
  const closeSteps = (lb?.close as { steps?: { status: string }[]; period?: string } | null) ?? null;
  const leaseSummary = lb && lb.register.length ? { liability: lb.overview.liability, rou: lb.overview.rou,
    close: { label: closeSteps?.period ?? lb.period, step: (closeSteps?.steps ?? []).filter((x) => x.status === "done" || x.status === "warning").length + 1, of: 8 } } : undefined;
  const isNew = scenario === "new";
  const states = { ecl: ecl.state, leases: leases.state };
  const progress = await getOnboarding(p.tenantId, p.mfa);

  return (
    <>
      {one(sp.tour) && <TourMode />}
      <WelcomeModal force={Boolean(one(sp.welcome))} name={first} workspace={ws.name} trial={ecl.state === "trial" ? `Your Expected Credit Loss trial runs for ${daysLeft(ecl)} more days.` : "Expected Credit Loss is active."} />
      {isNew ? <FirstRun /> : <PageHeader title={scenario === "trial" ? `Welcome back, ${first}` : `Good morning, ${first}`} description={`Reporting period · October 2026 · ${ws.name}`} />}
      {!isNew && <div className="max-md:order-last"><Checklist workspace={ws.name} states={states} progress={progress} /></div>}
      <Section title="My services">
        <div className="grid gap-4 md:grid-cols-2">
          {usable(ecl) && <EclCard e={ecl} run={latestRun} sample={scenario === "trial"} />}
          {usable(leases) ? <LeasesCard e={leases} summary={leaseSummary} /> : <LockedCard id="leases" name="Lease Accounting" standard="IFRS 16" line="Schedules, journals and month-end close in the same workspace." />}
        </div>
        {scenario === "trial" && <ComingSoon />}
      </Section>
      {isNew && <Checklist workspace={ws.name} states={states} progress={progress} />}
      {!isNew && <Section title="Needs your attention"><Attention items={(await homeAttention(p, ws.entitlements, { runs: runs?.ok ? runs.data : [], leaseInbox: lb?.inbox ?? [], reviewer: can(p, "ecl.review") })).filter((a) => usable(leases) || a.service !== "leases")} /></Section>}
      {!isNew && (
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <Section title="Recent activity"><RecentActivity events={await listAudit(p.tenantId, 8)} /></Section>
          <Section title="What's new"><WhatsNew /></Section>
        </div>
      )}
    </>
  );
}

export default function HomePage({ searchParams }: PageProps<"/home">) {
  return <Suspense fallback={<div className="flex flex-col gap-6"><div className="skeleton h-12 w-80 rounded-md" /><div className="skeleton h-64 rounded-panel" /></div>}><Body searchParams={searchParams} /></Suspense>;
}
