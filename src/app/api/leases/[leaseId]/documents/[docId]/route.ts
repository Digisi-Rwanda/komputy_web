import { engineFetch } from "@/server/engine/client";
import { can } from "@/server/policy";
import { getPrincipal } from "@/server/session";

// Lease document download: the engine returns a short-lived signed storage link; we redirect to it.
export async function GET(_: Request, { params }: { params: Promise<{ leaseId: string; docId: string }> }) {
  const { leaseId, docId } = await params;
  const p = await getPrincipal();
  if (!p?.tenantId || !can(p, "leases.view")) return new Response("Unauthorized", { status: 401 });
  if (!/^[0-9A-Z]{26}$/.test(leaseId) || !/^[0-9A-Z]{26}$/.test(docId)) return new Response("Not found", { status: 404 });
  const r = await engineFetch(p, `/api/v1/tenants/${p.tenantId}/leases/${leaseId}/documents/${docId}/url`);
  if (!r.ok) return new Response("This document isn't available.", { status: r.status });
  const j = (await r.json()) as { data?: { url?: string } };
  return j.data?.url ? Response.redirect(j.data.url, 302) : new Response("Not found", { status: 404 });
}
