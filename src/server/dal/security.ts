import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { ago } from "@/server/dal/members";
import { codesInText } from "@/lib/code";

export interface SecurityView {
  policy: { requireMfa: boolean; timeoutHours: number; idleSignout: boolean; domains: string[]; supportPolicy: "ask" | "auto" | "never"; withoutMfa: number };
  pending: { id: string; who: string; reason: string; minutes: number; age: string } | null;
  sessions: { id: string; who: string; time: string; status: string; actions: number; live: boolean; until: string | null }[];
}

const fmt = (d: Date) => d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Kigali" });

/** CA7: policy + support access requests and session history for the workspace. */
export async function getSecurity(tenantId: string): Promise<SecurityView> {
  const [[t], members, sessions] = await Promise.all([
    db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)),
    db.select({ mfa: schema.users.totpEnabled }).from(schema.tenantMemberships).innerJoin(schema.users, eq(schema.users.id, schema.tenantMemberships.userId)).where(and(eq(schema.tenantMemberships.tenantId, tenantId), eq(schema.tenantMemberships.status, "active"))),
    db.select({ s: schema.supportSessions, staff: schema.users.name }).from(schema.supportSessions).innerJoin(schema.users, eq(schema.users.id, schema.supportSessions.staffId))
      .where(and(eq(schema.supportSessions.tenantId, tenantId), inArray(schema.supportSessions.status, ["requested", "active", "ended", "denied"]))).orderBy(desc(schema.supportSessions.createdAt)).limit(20),
  ]);
  const now = new Date();
  const pending = sessions.find((x) => x.s.status === "requested");
  return {
    policy: { requireMfa: t.requireMfa, timeoutHours: t.sessionTimeoutHours, idleSignout: t.idleSignout, domains: t.allowedDomains, supportPolicy: t.supportPolicy as SecurityView["policy"]["supportPolicy"], withoutMfa: members.filter((m) => !m.mfa).length },
    pending: pending ? { id: pending.s.id, who: `${pending.staff} (Komputy Support)`, reason: codesInText(pending.s.reason), minutes: pending.s.minutes, age: ago(pending.s.createdAt) } : null,
    sessions: sessions.filter((x) => x.s.status !== "requested").map(({ s, staff }) => {
      const live = s.status === "active" && Boolean(s.endsAt && s.endsAt > now);
      return { id: s.id, who: staff, time: s.startsAt ? `${fmt(s.startsAt)} to ${s.endsAt ? fmt(s.endsAt).split(", ").pop() : ""}` : fmt(s.createdAt), status: live ? "Active" : s.status === "denied" ? "Denied" : "Ended", actions: s.actionsLogged, live, until: live ? fmt(s.endsAt!).split(", ").pop()! : null };
    }),
  };
}
