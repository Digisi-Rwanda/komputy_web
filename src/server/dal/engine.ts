import "server-only";
import { cache } from "react";
import { engine } from "@/server/engine/client";
import type { Principal } from "@/server/policy";
import type { Run } from "@/types/domain";

/** Extra fields the engine adds to the UI's Run shape. */
export type EngineRun = Run & {
  checksTotal: number; createdById: string; createdAt: string; failureMessage?: string | null; failureStage?: string | null;
  progress?: Record<string, { status: string }> | null; locked: boolean; supersedes?: string | null;
  segments?: { segment: string; loans: number; exposure: number; ecl: number; coverage: number; stages: [number, number, number] }[];
};
export type EngineResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

/** One typed call; engine problem bodies ({code, detail}) become a readable error, network failures a 503. */
export async function call<T>(p: Principal, fn: (c: ReturnType<typeof engine>) => Promise<{ data?: unknown; error?: unknown; response: Response }>): Promise<EngineResult<T>> {
  try {
    const r = await fn(engine(p));
    if (r.response.ok) return { ok: true, data: ((r.data as { data?: T })?.data ?? r.data) as T };
    const e = r.error as { detail?: string; code?: string } | undefined;
    return { ok: false, status: r.response.status, error: e?.detail ?? `Engine error (${r.response.status})` };
  } catch {
    return { ok: false, status: 503, error: "The calculation engine isn't reachable right now. Try again in a moment." };
  }
}

const tid = (p: Principal) => ({ tenant_id: p.tenantId! });

export const listRuns = cache(async (p: Principal) =>
  call<EngineRun[]>(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/ecl/views/runs", { params: { path: tid(p) } })));

export const getRunView = cache(async (p: Principal, runId: string) =>
  call<EngineRun>(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/ecl/views/runs/{run_id}", { params: { path: { ...tid(p), run_id: runId } } })));

export const getUsage = cache(async (p: Principal) =>
  call<{ ecl: { runsThisMonth: number; loansLastRun: number }; leases: { active: number } }>(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/usage", { params: { path: tid(p) } })));

import type { AuditEvent, Exception, LoanRow } from "@/types/domain";

export const getRunLoans = cache(async (p: Principal, runId: string, q: { segment?: string; stage?: number; q?: string; after?: string; limit?: number } = {}) =>
  call<{ rows: LoanRow[]; next: string | null; total: number }>(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/ecl/views/runs/{run_id}/loans", { params: { path: { ...tid(p), run_id: runId }, query: q } })));

export const getRunExceptions = cache(async (p: Principal, runId: string) =>
  call<(Exception & { dataset: string; customer: string; value: string })[]>(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/ecl/views/runs/{run_id}/exceptions", { params: { path: { ...tid(p), run_id: runId } } })));

export const getRunAudit = cache(async (p: Principal, runId: string) =>
  call<AuditEvent[]>(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/ecl/views/runs/{run_id}/audit", { params: { path: { ...tid(p), run_id: runId } } })));

export type ReviewState = { state: string | null; lockedAt: string | null; signedOffAt: string | null; preparedBy: string; events: { id: string; action: string; comment: string | null; by: string; byId: string; at: string }[] };
export const getReview = cache(async (p: Principal, runId: string) =>
  call<ReviewState>(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/runs/{run_id}/review", { params: { path: { ...tid(p), run_id: runId } } })));

/** Ported run detail (inputs, uploads, validation state) for the wizard and the Inputs tab. */
export const getRunDetail = cache(async (p: Principal, runId: string) =>
  call<Record<string, unknown>>(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/runs/{run_id}", { params: { path: { ...tid(p), run_id: runId } } })));

export type SetupSegment = { id: string; name: string; code: string | null; is_active: boolean; runs_count: number; created_at: string };
export type SetupCollateral = { id: string; name: string; haircut: string | number; time_to_realize: number; created_at: string };
export type SetupThresholds = { values: Record<string, number>; defaults: Record<string, number> };

export const getSegments = cache(async (p: Principal) => call<SetupSegment[]>(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/segments", { params: { path: tid(p) } })));
export const getCollateral = cache(async (p: Principal) => call<SetupCollateral[]>(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/collateral-types", { params: { path: tid(p) } })));
export const getThresholds = cache(async (p: Principal) => call<SetupThresholds>(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/ecl/thresholds", { params: { path: tid(p) } })));

/** ECL setup mapped to the editor shapes (segments, collateral types, threshold rows). */
export async function getEclSetup(p: Principal) {
  const { THRESHOLD_ROWS } = await import("@/lib/ecl-setup");
  const [s, c, t] = await Promise.all([getSegments(p), getCollateral(p), getThresholds(p)]);
  return {
    ok: s.ok && c.ok && t.ok, error: !s.ok ? s.error : !c.ok ? c.error : !t.ok ? t.error : undefined,
    segments: (s.ok ? s.data : []).map((x) => ({ id: x.id, name: x.name, active: x.is_active, loans: x.runs_count, source: "manual" as const, updated: x.created_at.slice(0, 10) })),
    collateral: (c.ok ? c.data : []).map((x) => ({ id: x.id, name: x.name, haircut: Number(x.haircut) / 100, months: x.time_to_realize, usedUsd: 0, active: true })),
    thresholds: THRESHOLD_ROWS.map((r) => ({ ...r, value: t.ok ? t.data.values[r.key] ?? 0 : 0, def: t.ok ? t.data.defaults[r.key] ?? 0 : 0 })),
  };
}

export const getExplore = cache(async (p: Principal, runId: string, segment?: string) =>
  call<import("@/components/organisms/ecl/Explorer").Explore>(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/ecl/views/runs/{run_id}/explore", { params: { path: { ...tid(p), run_id: runId }, query: { segment } } })));
export const getLoanDetail = cache(async (p: Principal, runId: string, loanId: string) =>
  call<import("@/components/organisms/ecl/Explorer").LoanDetail>(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/ecl/views/runs/{run_id}/loans/{loan_id}", { params: { path: { ...tid(p), run_id: runId, loan_id: loanId } } })));

export type Comparison = { migration: number[][]; movement: { label: string; value: number; kind?: "total" }[]; segments: { segment: string; a: number; b: number; delta: number }[] };
export const getComparison = cache(async (p: Principal, a: string, b: string) =>
  call<Comparison>(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/ecl/views/compare", { params: { path: tid(p), query: { a, b } } })));
