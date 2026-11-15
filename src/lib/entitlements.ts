import type { Entitlement, ServiceId, ServiceState, Workspace } from "@/types/domain";

export function entitlement(ws: Workspace, id: ServiceId): Entitlement {
  return ws.entitlements.find((e) => e.service === id) ?? { service: id, state: "locked" };
}

/** Service is usable (can open its pages) */
export const canUse = (state: ServiceState) => state === "active" || state === "trial";
/** Service is read-only (data visible, no new work) */
export const isReadOnly = (state: ServiceState) => state === "trial-expired" || state === "suspended" || state === "expired";

export function quotaLeft(e: Entitlement) {
  return e.quota ? Math.max(0, e.quota.limit - e.quota.used) : Infinity;
}

export function daysLeft(e: Entitlement, today = new Date()) {
  if (!e.trialEndsAt) return null;
  return Math.ceil((new Date(e.trialEndsAt).getTime() - today.getTime()) / 86_400_000);
}

/** A run has results once computed, whatever the amount (a portfolio can legitimately have zero ECL). */
export const isComputed = (r: { status: string }) => ["needs-review", "returned", "signed-off", "archived"].includes(r.status);
