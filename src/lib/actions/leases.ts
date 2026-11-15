"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { engineFetch } from "@/server/engine/client";
import type { ActionResult } from "@/server/mutate";
import { can, type Action } from "@/server/policy";
import { getPrincipal } from "@/server/session";

/**
 * Lease Accounting actions → the engine's lease API (`/tenants/{tid}/leases/...`). The engine enforces roles,
 * maker/checker, optimistic locking (rev) and period locks; we authorize first, then relay its answer.
 */
async function lease<T = unknown>(action: Action, method: "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<ActionResult<T>> {
  const p = await getPrincipal();
  if (!p?.tenantId) return { ok: false, error: "Your session ended. Sign in again." };
  if (!can(p, action)) return { ok: false, error: "You don't have permission to do this." };
  if ((path && !/^\/[\w\-./]*$/.test(path)) || path.includes("..")) return { ok: false, error: "Invalid request." };
  try {
    const r = await engineFetch(p, `/api/v1/tenants/${p.tenantId}/leases${path}`, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const j = (await r.json().catch(() => ({}))) as { data?: T; detail?: string };
    if (!r.ok) return { ok: false, error: j.detail ?? `The engine refused this (${r.status}).` };
    revalidatePath("/leases", "layout");
    return { ok: true, data: (j.data ?? j) as T };
  } catch {
    return { ok: false, error: "The calculation engine isn't reachable right now. Try again in a moment." };
  }
}

const id = z.string().regex(/^[0-9A-Z]{26}$/);
const text = z.string().max(2000);

export async function decideLease(leaseId: string, rev: number, approve: boolean, comment: string) {
  if (!id.safeParse(leaseId).success || !text.safeParse(comment).success) return { ok: false, error: "Invalid request." } as const;
  if (!approve && comment.trim().length < 3) return { ok: false, error: "Add a comment explaining what to change." } as const;
  return lease<{ rev: number }>("leases.review", "POST", `/${leaseId}/decision`, { rev, approve, text: comment.trim() });
}

export async function decideSetup(kind: "policies" | "curves" | "gl", version: number, approve: boolean, comment: string) {
  if (!["policies", "curves", "gl"].includes(kind) || !Number.isInteger(version)) return { ok: false, error: "Invalid request." } as const;
  return lease("leases.review", "POST", `/setup/${kind}/${version}/decision`, { approve, comment: comment.trim() });
}

export async function submitLease(leaseId: string, rev: number, approverId: string, note = "") {
  if (!id.safeParse(leaseId).success || !id.safeParse(approverId).success) return { ok: false, error: "Choose an approver." } as const;
  return lease<number>("leases.prepare", "POST", `/${leaseId}/submit`, { rev, approverId, note });
}

export async function withdrawLease(leaseId: string, rev: number) {
  return lease("leases.prepare", "POST", `/${leaseId}/withdraw`, { rev });
}

export async function createLease(input: Record<string, unknown>) {
  return lease<{ id: string; rev: number }>("leases.prepare", "POST", "", input);
}

export async function updateLease(leaseId: string, patch: Record<string, unknown>) {
  if (!id.safeParse(leaseId).success) return { ok: false, error: "Invalid request." } as const;
  return lease<{ rev: number }>("leases.prepare", "PATCH", `/${leaseId}`, patch);
}

export async function calculateLease(leaseId: string, rev: number) {
  return lease<{ rev: number; computation: Record<string, unknown> }>("leases.prepare", "POST", `/${leaseId}/calculate`, { rev });
}

export async function addCounterparty(name: string, vendorRef = "") {
  if (name.trim().length < 2) return { ok: false, error: "Enter the counterparty name." } as const;
  return lease<{ id: string }>("leases.prepare", "POST", "/counterparties", { name: name.trim(), vendorRef });
}

export async function saveSetup(kind: "policies" | "curves" | "gl", effectiveFrom: string, data: Record<string, unknown>, reason = "") {
  return lease("leases.review", "POST", `/setup/${kind}`, { effectiveFrom, data, reason });
}

export async function saveEntity(input: { name: string; currency: string; country: string; fyStartMonth: number; bookName: string }) {
  return lease("workspace.update", "PUT", "/entity", input);
}

export async function openPeriod(key: string) {
  if (!/^\d{4}-\d{2}$/.test(key)) return { ok: false, error: "Use YYYY-MM." } as const;
  return lease("leases.review", "POST", "/periods", { key });
}

// Month-end close (LC-02/03).
export async function closeStep(period: string, step: "start" | "generate" | `steps/${string}/complete`, body: Record<string, unknown> = {}) {
  if (!/^\d{4}-\d{2}$/.test(period)) return { ok: false, error: "Invalid period." } as const;
  return lease("leases.prepare", "POST", `/close/${period}/${step}`, body);
}
export async function confirmScheduledPayments(period: string) {
  return lease("leases.prepare", "POST", `/close/${period}/payments/confirm-scheduled`, {});
}
export async function lockPeriod(period: string) {
  return lease("leases.review", "POST", `/periods/${period}/lock`, {});
}
export async function reopenPeriod(period: string, reason: string) {
  if (reason.trim().length < 5) return { ok: false, error: "Give a reason (it's audited)." } as const;
  return lease("leases.review", "POST", `/periods/${period}/reopen`, { reason });
}
export async function postBatch(code: string, erpRef: string) {
  if (!erpRef.trim()) return { ok: false, error: "Enter the ERP reference." } as const;
  return lease("leases.review", "POST", `/batches/${code}/post`, { erpRef: erpRef.trim() });
}

// Lease events (LB-05): index, term change, modification, termination. Preview first, then submit for approval.
export async function previewEvent(leaseId: string, ev: Record<string, unknown>) {
  if (!id.safeParse(leaseId).success) return { ok: false, error: "Invalid request." } as const;
  return lease<{ segment: Record<string, string>; ok: boolean; journals: { account: string; debit: string; credit: string; memo?: string }[] }>("leases.prepare", "POST", `/${leaseId}/events/preview`, ev);
}
export async function addEvent(leaseId: string, rev: number, approverId: string, ev: Record<string, unknown>) {
  if (!id.safeParse(leaseId).success || !id.safeParse(approverId).success) return { ok: false, error: "Choose an approver." } as const;
  return lease("leases.prepare", "POST", `/${leaseId}/events`, { ...ev, rev, approverId });
}

/** Documents go through the engine to object storage (≤ 25 MB; PDF or images). */
export async function uploadLeaseDocument(leaseId: string, form: FormData): Promise<ActionResult<unknown>> {
  const p = await getPrincipal();
  if (!p?.tenantId || !can(p, "leases.prepare")) return { ok: false, error: "You don't have permission to do this." };
  if (!id.safeParse(leaseId).success || !(form.get("file") instanceof File)) return { ok: false, error: "Choose a file." };
  const r = await engineFetch(p, `/api/v1/tenants/${p.tenantId}/leases/${leaseId}/documents`, { method: "POST", body: form });
  const j = (await r.json().catch(() => ({}))) as { detail?: string; data?: unknown };
  if (!r.ok) return { ok: false, error: j.detail ?? "Upload failed." };
  revalidatePath("/leases", "layout");
  return { ok: true, data: j.data };
}

// Lease imports (LC-02): upload → mapping → validate (queue) → accept warnings → commit (queue) → submit all.
export type ImportBatch = { id: string; fileName: string; status: string; progress: number; headers: string[]; mapping: Record<string, string>; warningsAccepted: boolean; rowCount: number | null;
  rows?: { row: number; ref: string; name: string; issues: { severity: string; column: string; message: string }[]; action: string; outcome: string | null; outcomeMessage: string | null; leaseId: string | null }[] };

export async function uploadImport(form: FormData): Promise<ActionResult<ImportBatch>> {
  const p = await getPrincipal();
  if (!p?.tenantId || !can(p, "leases.prepare")) return { ok: false, error: "You don't have permission to do this." };
  if (!(form.get("file") instanceof File)) return { ok: false, error: "Choose a file." };
  const r = await engineFetch(p, `/api/v1/tenants/${p.tenantId}/leases/imports`, { method: "POST", body: form });
  const j = (await r.json().catch(() => ({}))) as { detail?: string; data?: ImportBatch };
  if (!r.ok || !j.data) return { ok: false, error: j.detail ?? "Upload failed." };
  revalidatePath("/leases", "layout");
  return { ok: true, data: j.data };
}
export async function getImport(code: string): Promise<ActionResult<ImportBatch>> {
  const p = await getPrincipal();
  if (!p?.tenantId || !can(p, "leases.view")) return { ok: false, error: "You don't have permission to do this." };
  if (!/^[\w-]{1,40}$/.test(code)) return { ok: false, error: "Invalid import." };
  const r = await engineFetch(p, `/api/v1/tenants/${p.tenantId}/leases/imports/${code}`);
  const j = (await r.json().catch(() => ({}))) as { detail?: string; data?: ImportBatch };
  return r.ok && j.data ? { ok: true, data: j.data } : { ok: false, error: j.detail ?? "Import not found." };
}
export async function setImportMapping(code: string, mapping: Record<string, string>) {
  if (!/^[\w-]{1,40}$/.test(code)) return { ok: false, error: "Invalid import." } as const;
  return lease("leases.prepare", "PUT", `/imports/${code}/mapping`, { mapping });
}
export async function importAction(code: string, action: "accept-warnings" | "commit" | "retry" | "cancel" | "submit", approverId?: string) {
  if (!/^[\w-]{1,40}$/.test(code)) return { ok: false, error: "Invalid import." } as const;
  return lease<{ submitted?: number }>("leases.prepare", "POST", `/imports/${code}/${action}`, approverId ? { approverId } : {});
}
