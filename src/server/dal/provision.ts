import "server-only";
import { eq } from "drizzle-orm";
import { schema, type Tx } from "@/server/db/client";
import { ulid } from "@/server/ids";

export type TrialService = "ecl" | "leases";
// Trial defaults (PA6 "Trial defaults"): ECL 3 runs · 5,000 loans/run; Leases 10 leases · 1 entity; 14 days.
export const TRIAL_LIMITS: Record<TrialService, Record<string, number>> = { ecl: { runs_month: 3, loans_run: 5000 }, leases: { active_leases: 10, entities: 1 } };
const OWNER_ROLES = { ecl: "reviewer", leases: "reviewer" } as const;

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "workspace";

/** Creates a workspace owned by `userId` with 14-day trials for the chosen services. Caller owns the transaction. */
export async function provisionWorkspace(tx: Tx, o: { userId: string; name: string; country?: string; currency?: string; fiscalYearEnd?: string; services: TrialService[]; emailDomain?: string }) {
  const tenantId = ulid(), membershipId = ulid();
  const base = slugify(o.name);
  const [taken] = await tx.select({ id: schema.tenants.id }).from(schema.tenants).where(eq(schema.tenants.slug, base)).limit(1);
  await tx.insert(schema.tenants).values({
    id: tenantId, name: o.name.trim(), slug: taken ? `${base}-${tenantId.slice(-6).toLowerCase()}` : base, legalName: o.name.trim(),
    country: o.country ?? null, currency: o.currency ?? "USD", fiscalYearEnd: o.fiscalYearEnd ?? "12-31", plan: "trial", status: "trial",
    // Personal domains are blocked at sign-up, so the founder's domain is a safe default allow-list.
    allowedDomains: o.emailDomain ? [o.emailDomain] : [],
  });
  await tx.insert(schema.tenantMemberships).values({ id: membershipId, tenantId, userId: o.userId, workspaceRole: "owner", role: "administrator", status: "active" });
  const ends = new Date(Date.now() + 14 * 864e5);
  for (const svc of o.services) {
    await tx.insert(schema.memberServiceRoles).values({ id: ulid(), membershipId, service: svc, role: OWNER_ROLES[svc] });
    await tx.insert(schema.entitlements).values({ id: ulid(), tenantId, service: svc, state: "trial", trialEndsAt: ends, limits: TRIAL_LIMITS[svc], watermark: true });
  }
  return { tenantId, membershipId };
}
