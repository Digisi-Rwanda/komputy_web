// Every permission rule in the app lives here (plan §2.2). Pure functions: no I/O, exhaustively unit-tested.
export type WorkspaceRole = "owner" | "admin" | "member";
export type EclRole = "none" | "viewer" | "analyst" | "reviewer";
export type LeasesRole = "none" | "viewer" | "preparer" | "reviewer" | "poster";
export type StaffRole = "admin" | "sales" | "support";
export type ServiceKey = "ecl" | "leases";

export interface Principal {
  userId: string;
  email: string;
  name: string;
  sessionId: string;
  mfa: boolean;
  /** Profile photo (data URL) when set. */
  image?: string | null;
  staff: StaffRole | null;
  tenantId: string | null;
  membershipId: string | null;
  workspaceRole: WorkspaceRole | null;
  services: { ecl: EclRole; leases: LeasesRole };
  /** Active workspace requires MFA and this person hasn't set it up (CA7). */
  mfaPending?: boolean;
  /** Active workspace was suspended by Komputy (members can't open it). */
  suspended?: boolean;
  /** Sign out after 30 idle minutes (workspace security policy). */
  idleSignout?: boolean;
}

const WORKSPACE_RANK: Record<WorkspaceRole, number> = { member: 0, admin: 1, owner: 2 };
const atLeast = (p: Principal, r: WorkspaceRole) => p.workspaceRole !== null && WORKSPACE_RANK[p.workspaceRole] >= WORKSPACE_RANK[r];

/** action → who may do it. Adding a screen means adding a row here and a test case. */
const RULES = {
  // any member of the active workspace
  "workspace.view": (p: Principal) => p.workspaceRole !== null,
  "notifications.manage": (p: Principal) => p.workspaceRole !== null,
  "access.request": (p: Principal) => p.workspaceRole !== null,
  "activity.view": (p: Principal) => p.workspaceRole !== null,
  // services (per-service roles; workspace admins can do everything in a service). The engine enforces the same.
  "ecl.view": (p: Principal) => atLeast(p, "admin") || (p.workspaceRole !== null && p.services.ecl !== "none"),
  "ecl.prepare": (p: Principal) => atLeast(p, "admin") || (p.workspaceRole !== null && (p.services.ecl === "analyst" || p.services.ecl === "reviewer")),
  "ecl.review": (p: Principal) => atLeast(p, "admin") || (p.workspaceRole !== null && p.services.ecl === "reviewer"),
  "leases.view": (p: Principal) => atLeast(p, "admin") || (p.workspaceRole !== null && p.services.leases !== "none"),
  "leases.prepare": (p: Principal) => atLeast(p, "admin") || (p.workspaceRole !== null && ["preparer", "reviewer", "poster"].includes(p.services.leases)),
  "leases.review": (p: Principal) => atLeast(p, "admin") || (p.workspaceRole !== null && (p.services.leases === "reviewer" || p.services.leases === "poster")),
  // workspace administrators (CA1-CA8)
  "workspace.update": (p: Principal) => atLeast(p, "admin"),
  "members.view": (p: Principal) => atLeast(p, "admin"),
  "members.manage": (p: Principal) => atLeast(p, "admin"),
  "invites.manage": (p: Principal) => atLeast(p, "admin"),
  "security.manage": (p: Principal) => atLeast(p, "admin"),
  "requests.decide": (p: Principal) => atLeast(p, "admin"),
  "audit.view": (p: Principal) => atLeast(p, "admin"),
  "services.request": (p: Principal) => atLeast(p, "admin"),
  "support.decide": (p: Principal) => atLeast(p, "admin"),
  // owner only (CA9)
  "ownership.transfer": (p: Principal) => atLeast(p, "owner"),
  "workspace.close": (p: Principal) => atLeast(p, "owner"),
  // platform staff (PA1-PA9)
  "platform.view": (p: Principal) => p.staff !== null,
  "pipeline.manage": (p: Principal) => p.staff === "admin" || p.staff === "sales",
  "entitlements.propose": (p: Principal) => p.staff === "admin" || p.staff === "sales",
  "entitlements.change": (p: Principal) => p.staff === "admin",
  "tenants.manage": (p: Principal) => p.staff === "admin",
  "users.manage": (p: Principal) => p.staff === "admin",
  "staff.manage": (p: Principal) => p.staff === "admin",
  "catalog.publish": (p: Principal) => p.staff === "admin",
  "engine.promote": (p: Principal) => p.staff === "admin",
  "support.request": (p: Principal) => p.staff === "admin" || p.staff === "support",
  "notes.write": (p: Principal) => p.staff !== null,
} as const;

export type Action = keyof typeof RULES;
export const ACTIONS = Object.keys(RULES) as Action[];
export const can = (p: Principal, action: Action): boolean => RULES[action](p);

/** Role changes an admin may make. Nobody changes the owner's role here (that's ownership transfer). */
export function canChangeRole(actor: Principal, target: { workspaceRole: WorkspaceRole; userId: string }, next: WorkspaceRole): boolean {
  if (!can(actor, "members.manage") || target.workspaceRole === "owner" || next === "owner") return false;
  return true;
}

/** Segregation of duties: a reviewer can never approve their own submission (LC-01, CA5, W15). */
export const canApprove = (p: Principal, preparerId: string) => p.userId !== preparerId;

export const ECL_ROLES: readonly EclRole[] = ["none", "viewer", "analyst", "reviewer"];
export const LEASES_ROLES: readonly LeasesRole[] = ["none", "viewer", "preparer", "reviewer", "poster"];
export const STAFF_ROLES: readonly StaffRole[] = ["admin", "sales", "support"];
