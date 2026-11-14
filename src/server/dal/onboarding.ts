import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export interface OnboardingRecord { done: string[]; dismissed: boolean }
export const readMeta = (raw: string | null): Record<string, unknown> => { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } };

/** O2 per-workspace checklist: steps ticked by people + steps the data already proves (email, team, MFA, profile). */
export async function getOnboarding(tenantId: string, userMfa: boolean): Promise<OnboardingRecord> {
  const [[t], [others], [invited]] = await Promise.all([
    db.select({ meta: schema.tenants.metadata, legal: schema.tenants.legalName, country: schema.tenants.country }).from(schema.tenants).where(eq(schema.tenants.id, tenantId)),
    db.select({ n: db.$count(schema.tenantMemberships, and(eq(schema.tenantMemberships.tenantId, tenantId), ne(schema.tenantMemberships.workspaceRole, "owner"))) }).from(schema.tenants).limit(1),
    db.select({ id: schema.invitations.id }).from(schema.invitations).where(eq(schema.invitations.tenantId, tenantId)).limit(1),
  ]);
  const saved = (readMeta(t?.meta ?? null).onboarding ?? {}) as Partial<OnboardingRecord>;
  const auto = ["verify-email", ...(t?.legal && t.country ? ["profile"] : []), ...((others?.n ?? 0) > 0 || invited ? ["invite"] : []), ...(userMfa ? ["mfa"] : [])];
  return { done: [...new Set([...auto, ...(saved.done ?? [])])], dismissed: Boolean(saved.dismissed) };
}
