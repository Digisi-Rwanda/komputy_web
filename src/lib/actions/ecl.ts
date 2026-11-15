"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { call } from "@/server/dal/engine";
import type { ActionResult } from "@/server/mutate";
import { can, type Action } from "@/server/policy";
import { getPrincipal } from "@/server/session";

const id = z.string().regex(/^[0-9A-Z]{26}$/);
const kind = z.enum(["PD", "LGD", "EAD"]);

async function as<T>(action: Action, fn: (p: NonNullable<Awaited<ReturnType<typeof getPrincipal>>>) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  const p = await getPrincipal();
  if (!p?.tenantId) return { ok: false, error: "Your session ended. Sign in again." };
  if (!can(p, action)) return { ok: false, error: "You don't have permission to do this." };
  return fn(p);
}
const res = <T,>(r: { ok: true; data: T } | { ok: false; error: string }): ActionResult<T> => (r.ok ? { ok: true, data: r.data } : { ok: false, error: r.error });
const path = <E extends Record<string, string> = Record<never, never>>(p: { tenantId: string | null }, extra?: E) => ({ path: { tenant_id: p.tenantId!, ...(extra as E) } });

/** W1: create a draft run. */
export async function createRun(input: { name: string; reportingPeriod?: string; reportingDate?: string; currency?: string }) {
  const v = z.object({ name: z.string().trim().min(1).max(200), reportingPeriod: z.string().max(100).optional(), reportingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), currency: z.string().length(3).optional() }).safeParse(input);
  if (!v.success) return { ok: false, error: "Give the run a name (and a valid date)." } as const;
  return as<{ fullId: string }>("ecl.prepare", async (p) => {
    const r = await call<{ fullId: string }>(p, (c) => c.POST("/api/v1/tenants/{tenant_id}/runs", { params: path(p), body: { name: v.data.name, reporting_period: v.data.reportingPeriod ?? null, reporting_date: v.data.reportingDate ?? null } }));
    if (r.ok && v.data.currency) await call(p, (c) => c.PATCH("/api/v1/tenants/{tenant_id}/runs/{run_id}", { params: path(p, { run_id: r.data.fullId }), body: { currency: v.data.currency } }));
    revalidatePath("/ecl/runs");
    return res(r);
  });
}

/** W2–W4: direct-to-storage upload, step 1 (parts plan). The browser PUTs the parts itself. */
export async function startUpload(runId: string, k: string, filename: string, size: number) {
  if (!id.safeParse(runId).success || !kind.safeParse(k).success || !(size > 0)) return { ok: false, error: "Invalid upload." } as const;
  return as<{ key: string; uploadId: string; partSize: number; urls: string[] }>("ecl.prepare", async (p) =>
    res(await call(p, (c) => c.POST("/api/v1/tenants/{tenant_id}/runs/{run_id}/uploads/direct", { params: path(p, { run_id: runId }), body: { kind: k, filename, size, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } }))));
}

/** Step 2: complete the multipart upload and register the file on the run. */
export async function completeUpload(runId: string, k: string, filename: string, key: string, uploadId: string, parts: { partNumber: number; etag: string }[]) {
  if (!id.safeParse(runId).success || !kind.safeParse(k).success || !parts.length) return { ok: false, error: "Invalid upload." } as const;
  return as<Record<string, unknown>>("ecl.prepare", async (p) => {
    const r = await call<Record<string, unknown>>(p, (c) => c.POST("/api/v1/tenants/{tenant_id}/runs/{run_id}/uploads/direct/complete", { params: path(p, { run_id: runId }), body: { kind: k, filename, key, uploadId, parts, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } }));
    revalidatePath(`/ecl/runs/${runId}`);
    return res(r);
  });
}

export async function removeUpload(runId: string, uploadId: string) {
  return as<null>("ecl.prepare", async (p) => res(await call(p, (c) => c.DELETE("/api/v1/tenants/{tenant_id}/runs/{run_id}/uploads/{upload_id}", { params: path(p, { run_id: runId, upload_id: uploadId }) }))));
}

/** W5–W9: queue validation for one dataset; progress arrives over SSE, the result via getValidationJob. */
export async function startValidation(runId: string, scope: "pd" | "lgd" | "ead") {
  return as<{ jobId: string }>("ecl.prepare", async (p) => res(await call(p, (c) => c.POST("/api/v1/tenants/{tenant_id}/runs/{run_id}/validate", { params: { ...path(p, { run_id: runId }), query: { scope } }, body: { accepted_warning_ids: [] } }))));
}

export async function getValidationJob(runId: string, jobId: string) {
  return as<{ status: string; result?: Record<string, unknown>; error?: { code: string; detail: string } }>("ecl.view", async (p) =>
    res(await call(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/runs/{run_id}/validation-jobs/{job_id}", { params: path(p, { run_id: runId, job_id: jobId }) }))));
}

export async function acceptValidation(runId: string, scope: "pd" | "lgd" | "ead") {
  return as<Record<string, unknown>>("ecl.prepare", async (p) => res(await call(p, (c) => c.POST("/api/v1/tenants/{tenant_id}/runs/{run_id}/validation/{kind}/accept", { params: path(p, { run_id: runId, kind: scope }) }))));
}

/** W10: compute (queued on the calc workers). */
export async function executeRun(runId: string) {
  return as<{ status: string }>("ecl.prepare", async (p) => {
    const r = await call<{ status: string }>(p, (c) => c.POST("/api/v1/tenants/{tenant_id}/runs/{run_id}/execute", { params: path(p, { run_id: runId }) }));
    revalidatePath("/ecl/runs");
    return res(r);
  });
}

export async function rerunRun(runId: string, name?: string) {
  return as<{ fullId: string }>("ecl.prepare", async (p) => {
    const r = await call<{ fullId: string }>(p, (c) => c.POST("/api/v1/tenants/{tenant_id}/runs/{run_id}/rerun", { params: path(p, { run_id: runId }), body: { name: name ?? null } }));
    revalidatePath("/ecl/runs");
    return res(r);
  });
}

export async function deleteRun(runId: string) {
  return as<null>("workspace.update", async (p) => {
    const r = await call<null>(p, (c) => c.DELETE("/api/v1/tenants/{tenant_id}/runs/{run_id}", { params: path(p, { run_id: runId }) }));
    revalidatePath("/ecl/runs");
    return res(r);
  });
}

/** Review lifecycle (maker/checker). The engine enforces roles and segregation of duties. */
export async function reviewRun(runId: string, decision: "sign-off" | "return" | "resubmit" | "comment", comment?: string) {
  const action: Action = decision === "resubmit" ? "ecl.prepare" : decision === "comment" ? "ecl.view" : "ecl.review";
  if ((decision === "return" || decision === "comment") && (comment ?? "").trim().length < 3) return { ok: false, error: "Add a short comment." } as const;
  return as<Record<string, unknown>>(action, async (p) => {
    const r = await call<Record<string, unknown>>(p, (c) => c.POST(`/api/v1/tenants/{tenant_id}/runs/{run_id}/review/${decision}` as "/api/v1/tenants/{tenant_id}/runs/{run_id}/review/sign-off", { params: path(p, { run_id: runId }), body: { comment: comment?.trim() || null } }));
    revalidatePath(`/ecl/runs/${runId}`);
    revalidatePath("/ecl/runs");
    return res(r);
  });
}

/** Wizard hydration: the run as the engine sees it (status, uploaded inputs, progress). */
export async function loadRun(runId: string) {
  if (!id.safeParse(runId).success) return { ok: false, error: "Unknown run." } as const;
  return as<import("@/server/dal/engine").EngineRun & { inputs?: { kind: string; filename: string; size: number; rows: number | null; sha256: string; status: string | null; warningsAccepted: boolean }[] }>("ecl.view", async (p) =>
    res(await call(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/ecl/views/runs/{run_id}", { params: path(p, { run_id: runId }) }))));
}

// ── ECL setup (segments, collateral types, thresholds). Admins + reviewers; the engine re-checks and audits.
export async function saveSegment(input: { id?: string; name: string; active: boolean }) {
  const v = z.object({ id: id.optional(), name: z.string().trim().min(2).max(100), active: z.boolean() }).safeParse(input);
  if (!v.success) return { ok: false, error: "Segment names need at least 2 characters." } as const;
  return as<unknown>("ecl.review", async (p) => {
    const r = v.data.id
      ? await call(p, (c) => c.PATCH("/api/v1/tenants/{tenant_id}/segments/{segment_id}", { params: path(p, { segment_id: v.data.id! }), body: { name: v.data.name, is_active: v.data.active } }))
      : await call(p, (c) => c.POST("/api/v1/tenants/{tenant_id}/segments", { params: path(p), body: { name: v.data.name } }));
    revalidatePath("/ecl/setup/segments");
    return res(r);
  });
}

export async function saveCollateral(input: { id?: string; name: string; haircutPct: number; months: number }) {
  const v = z.object({ id: id.optional(), name: z.string().trim().min(2).max(100), haircutPct: z.number().min(0).max(100), months: z.number().int().min(0).max(600) }).safeParse(input);
  if (!v.success) return { ok: false, error: "Haircut must be 0–100 % and time to realise whole months." } as const;
  return as<unknown>("ecl.review", async (p) => {
    const body = { name: v.data.name, haircut: v.data.haircutPct.toFixed(2), time_to_realize: v.data.months };
    const r = v.data.id
      ? await call(p, (c) => c.PATCH("/api/v1/tenants/{tenant_id}/collateral-types/{collateral_id}", { params: path(p, { collateral_id: v.data.id! }), body }))
      : await call(p, (c) => c.POST("/api/v1/tenants/{tenant_id}/collateral-types", { params: path(p), body }));
    revalidatePath("/ecl/setup/collateral");
    return res(r);
  });
}

export async function saveThresholds(values: Record<string, number>) {
  return as<unknown>("ecl.review", async (p) => {
    const r = await call(p, (c) => c.PUT("/api/v1/tenants/{tenant_id}/ecl/thresholds", { params: path(p), body: values as never }));
    revalidatePath("/ecl/setup/thresholds");
    return res(r);
  });
}

/** O4: a run pre-loaded with the engine's sample workbooks (never uses quota). */
export async function createSampleRun() {
  return as<{ fullId: string }>("ecl.prepare", async (p) => {
    const r = await call<{ fullId: string }>(p, (c) => c.POST("/api/v1/tenants/{tenant_id}/ecl/sample-run", { params: path(p) }));
    revalidatePath("/ecl/runs");
    return res(r);
  });
}
