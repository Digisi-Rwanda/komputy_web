import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Check } from "lucide-react";
import { AccessNotice } from "@/components/organisms/access/AccessNotice";
import { LockedActions } from "@/components/organisms/access/LockedActions";
import { LockedPreview } from "@/components/organisms/access/LockedPreview";
import { LOCKED_COPY, TRIAL_TERMS } from "@/data/locked-copy";
import { SERVICE_PAGES } from "@/data/services";
import { SERVICES, service } from "@/lib/services";
import { entitlement } from "@/lib/entitlements";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { listMembers } from "@/server/dal/members";
import { getWorkspace } from "@/server/dal/workspace";
import { requireMember } from "@/server/session";
import { one } from "@/lib/search";
import type { ServiceId } from "@/types/domain";

export function generateStaticParams() { return SERVICES.map((s) => ({ service: s.id })); }
export const metadata: Metadata = { title: "Service not active" };

// AC1/AC2 (blueprint §9.2). `?as=member` previews the member view (Eric Uwase, Analyst); `?state=requested` the requested panel.
async function Actions({ id, searchParams }: { id: ServiceId; searchParams: PageProps<"/locked/[service]">["searchParams"] }) {
  const sp = await searchParams;
  const s = service(id);
  const p = await requireMember();
  const member = p.workspaceRole === "member";
  const [open] = await db.select().from(schema.accessRequests).where(and(eq(schema.accessRequests.tenantId, p.tenantId), eq(schema.accessRequests.service, id), eq(schema.accessRequests.status, member ? "open" : "new")));
  const st = one(sp.state) || (open ? "requested" : entitlement((await getWorkspace(p.tenantId))!, id).state);
  if (st === "requested") return <AccessNotice state="requested" info={{ requestedAt: open ? open.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-", ref: open?.code ?? "-" }} />;
  const admins = (await listMembers(p.tenantId)).filter((m) => m.workspaceRole !== "member" && m.status === "active").map((m) => m.name);
  return (
    <>
      
      <LockedActions service={id} name={s.name} admin={!member} live={s.live} admins={admins} terms={TRIAL_TERMS[id] ?? ["Length · 14 days"]} />
    </>
  );
}

export default async function LockedServicePage({ params, searchParams }: PageProps<"/locked/[service]">) {
  const id = (await params).service as ServiceId;
  const page = SERVICE_PAGES[id];
  if (!page) notFound();
  const s = service(id);
  const c = LOCKED_COPY[id] ?? {
    eyebrow: `${s.name}${s.standard ? ` · ${s.standard}` : ""}`, title: page.kind === "soon" ? page.title : `${s.name} isn't active yet`, sub: page.sub,
    ticks: page.kind === "soon" ? page.willDo.map((w) => w.title) : [], price: s.live ? "From USD 1,200 / month" : "Coming soon", trial: s.live ? "14-day trial. No card needed." : "Join the waitlist to hear first.", url: `komputy.com/${id}`,
  };
  return (
    <section aria-labelledby="locked-title" className="mx-auto flex w-full max-w-[880px] flex-col gap-8 py-4">
      <div className="flex flex-col gap-4">
        <p className="label-mono">{c.eyebrow}</p>
        <h1 id="locked-title" className="text-[32px] leading-tight tracking-[-0.03em] md:text-h1">{c.title}</h1>
        <p className="text-body text-fg-muted">{c.sub}</p>
      </div>
      <LockedPreview url={c.url} kind={id === "leases" ? "leases" : id === "ecl" ? "ecl" : "other"} />
      <ul className="flex flex-col gap-2">{c.ticks.map((t) => <li key={t} className="flex items-center gap-2 text-small text-fg-body"><Check aria-hidden className="size-4 text-positive" />{t}</li>)}</ul>
      <p className="text-small text-fg-muted">{c.price}</p>
      <div className="flex flex-col gap-3">
        <Suspense fallback={<div className="skeleton h-12 w-64 rounded-full" />}><Actions id={id} searchParams={searchParams} /></Suspense>
        <p className="text-micro text-fg-muted">{c.trial}</p>
      </div>
    </section>
  );
}
