import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { ago } from "@/server/dal/members";
import type { Principal } from "@/server/policy";
import type { AttentionItem, Entitlement } from "@/types/domain";

type EngineSide = { runs: { id: string; name: string; status: string; createdById?: string; updatedAt: string }[]; leaseInbox: { id: string; title: string; meta: string; age: string; byId?: string; type: string }[]; reviewer: boolean };

/** HM1 "Needs your attention": workspace items plus engine items (runs to sign off / returned / failed, lease approvals). */
export async function homeAttention(p: Principal & { tenantId: string }, ents: Entitlement[], eng?: EngineSide): Promise<AttentionItem[]> {
  const items: AttentionItem[] = [];
  for (const r of eng?.runs ?? []) {
    if (r.status === "needs-review" && eng!.reviewer && r.createdById !== p.userId) items.push({ id: `run-${r.id}`, service: "ecl", title: `${r.name} is ready for sign-off`, meta: "Review the figures and sign off", status: ["info", "Sign-off"], age: ago(new Date(r.updatedAt)).replace(" ago", ""), href: `/ecl/runs/${r.id}/summary`, action: "Review" });
    if (r.status === "returned" && r.createdById === p.userId) items.push({ id: `run-${r.id}`, service: "ecl", title: `${r.name} was returned`, meta: "See the reviewer's comment", status: ["warning", "Returned"], age: ago(new Date(r.updatedAt)).replace(" ago", ""), href: `/ecl/runs/${r.id}/summary`, action: "Open" });
    if (r.status === "failed" && r.createdById === p.userId) items.push({ id: `run-${r.id}`, service: "ecl", title: `${r.name} failed to compute`, meta: "Fix the inputs and retry", status: ["negative", "Failed"], age: ago(new Date(r.updatedAt)).replace(" ago", ""), href: `/ecl/runs/new/compute?run=${r.id}`, action: "Open" });
  }
  for (const i of (eng?.leaseInbox ?? []).filter((x) => x.byId !== p.userId).slice(0, 5)) items.push({ id: `lease-${i.id}`, service: "leases", title: i.title, meta: i.meta, status: ["info", "Approval"], age: i.age, href: "/leases/inbox", action: "Review" });
  const admin = p.workspaceRole === "owner" || p.workspaceRole === "admin";
  if (admin) {
    const [reqs, support] = await Promise.all([
      db.select().from(schema.accessRequests).where(and(eq(schema.accessRequests.tenantId, p.tenantId), eq(schema.accessRequests.scope, "member"), eq(schema.accessRequests.status, "open"))).limit(3),
      db.select().from(schema.supportSessions).where(and(eq(schema.supportSessions.tenantId, p.tenantId), eq(schema.supportSessions.status, "requested"))).limit(1),
    ]);
    for (const s of support) items.push({ id: s.id, service: "workspace", title: "Ledgerline support requests access", meta: s.reason, status: ["warning", "Waiting"], age: ago(s.createdAt).replace(" ago", ""), href: "/admin/security", action: "Review" });
    for (const r of reqs) items.push({ id: r.id, service: "workspace", title: String((r.details as Record<string, string>).title ?? "Access request"), meta: String((r.details as Record<string, string>).requested ?? ""), status: ["info", "Request"], age: ago(r.createdAt).replace(" ago", ""), href: "/admin/requests", action: "Review" });
  }
  for (const e of ents) {
    const days = e.trialEndsAt ? Math.ceil((Date.parse(e.trialEndsAt) - Date.now()) / 864e5) : null;
    if (e.state === "trial" && days !== null && days <= 7) items.push({ id: `trial-${e.service}`, service: e.service === "ecl" ? "ecl" : "leases", title: `${e.service === "ecl" ? "Expected Credit Loss" : "Lease Accounting"} trial ends in ${Math.max(0, days)} day${days === 1 ? "" : "s"}`, meta: admin ? "Request full access to keep working" : "Ask your administrator about full access", status: ["warning", "Trial"], age: "", href: admin ? "/admin/services" : `/locked/${e.service}`, action: admin ? "Request access" : "Details" });
  }
  if (!p.mfa) items.push({ id: "mfa", service: "workspace", title: "Turn on two-factor authentication", meta: "Protect your account with an authenticator app", status: ["neutral", "Security"], age: "", href: "/account/security", action: "Set up" });
  return items;
}
