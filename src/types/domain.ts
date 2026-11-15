export type ServiceId = "ecl" | "leases" | "lease-planning" | "tax" | "doc-intel" | "erp";
/** Entitlement of a service inside one workspace */
export type ServiceState = "active" | "trial" | "trial-expired" | "suspended" | "expired" | "requested" | "locked" | "coming-soon";
export type WorkspaceRole = "owner" | "admin" | "member";
export type EclRole = "none" | "viewer" | "analyst" | "reviewer";
export type LeasesRole = "none" | "viewer" | "preparer" | "reviewer" | "poster";
export type PlatformRole = "platform-admin" | "sales" | "support";
export type Stage = 1 | 2 | 3;

export interface Service {
  id: ServiceId;
  name: string;
  short: string;
  standard: string;
  description: string;
  live: boolean;
}

export interface Entitlement {
  service: ServiceId;
  state: ServiceState;
  trialEndsAt?: string;
  quota?: { used: number; limit: number; unit: string };
}

export interface Workspace {
  id: string;
  name: string;
  legalName: string;
  initial: string;
  logo?: string;
  country: string;
  currency: string;
  entitlements: Entitlement[];
}

export interface Member {
  id: string;
  name: string;
  initials: string;
  email: string;
  title?: string;
  workspaceRole: WorkspaceRole;
  ecl: EclRole;
  leases: LeasesRole;
  mfa: boolean;
  status: "active" | "invited" | "disabled";
  lastActive: string;
}

export type RunStatus = "draft" | "validating" | "ready" | "computing" | "failed" | "needs-review" | "returned" | "signed-off" | "archived";

export interface StageAmount { stage: Stage; ecl: number; exposure: number; share: number }

export interface Run {
  id: string;
  name: string;
  reportingDate: string;
  status: RunStatus;
  engine: string;
  currency: string;
  totalEcl: number;
  exposure: number;
  coverage: number;
  deltaVsPrior: number;
  stages: StageAmount[];
  loans: number;
  exceptions: number;
  checksPassed: number;
  createdBy: string;
  reviewer?: string;
  signedOffAt?: string;
  updatedAt: string;
  /** wizard step 1-7 for runs still in progress */
  step?: number;
  stepLabel?: string;
  failure?: { message: string; ref: string };
  sample?: boolean;
}

export interface SegmentResult { segment: string; exposure: number; ecl: number; coverage: number; delta: number }

export type LeaseStatus = "draft" | "submitted" | "approved" | "modified" | "expiring" | "terminated";
export type AssetClass = "Property" | "Vehicles" | "IT equipment" | "Branch ATMs";

export interface Lease {
  id: string;
  name: string;
  counterparty: string;
  assetClass: AssetClass;
  entity: string;
  start?: string;
  end?: string;
  liability?: number;
  rouAsset?: number;
  rate?: number;
  status: LeaseStatus;
  exempt?: "low-value" | "short-term";
  createdBy: string;
}

export interface Notification {
  id: string;
  kind: "runs" | "leases" | "access" | "workspace" | "security";
  title: string;
  meta: string;
  at: string;
  read: boolean;
  action?: string;
  /** deep link to the object (run, lease, admin page) */
  href?: string;
}

export interface AuditEvent { at: string; actor: string; initials: string; action: string; object: string; service: string }

/** CA5 member request (access / role / service the workspace lacks). */
export interface AccessRequest { id: string; who: string; initials: string; title: string; meta: string; age: string; kind: "grant" | "role" | "service"; status?: "open" | "approved" | "declined" | "forwarded"; note?: string; current: string; requested: string }

// Platform console (PA2/PA5)
export interface PWorkspace { id: string; name: string; country: string; owner: string; email: string; services: [string, ServiceState][]; trialEnds?: string; usage: [string, number, number][]; last: string; am?: string; inactiveDays: number; paying: boolean }
export type LeadStage = "new" | "contacted" | "negotiating" | "won" | "lost";
export interface Lead { id: string; stage: LeadStage; type: "Quote" | "Trial" | "More capacity" | "Waitlist" | "Forwarded" | "Full access" | "Activate"; company: string; services: string[]; size: string; source: string; age: string; assignee?: string; workspace?: string; code?: string; contact?: string; message?: string }

/** Home "Needs your attention" row (HM1). */
export interface AttentionItem { id: string; service: "ecl" | "leases" | "workspace"; title: string; meta: string; status: [import("@/types/ui").Tone, string]; age: string; href: string; action: string }

/** Loan-level ECL result row (engine view). */
export interface LoanRow { id: string; customer: string; segment: string; stage: Stage; outstanding: number; ead: number; pd: number; lgd: number; ecl: number; capped?: boolean }

/** Spec 12.2 exception line (engine categories: Input Validation, PD Match, ECL Cap, Reconciliation). */
export interface Exception { id: string; category: string; loan: string; rule: string; detail: string; impact: string; amount: number; ack?: string; input?: [string, string][] }
