import { engineFetch } from "@/server/engine/client";
import { can } from "@/server/policy";
import { getPrincipal } from "@/server/session";

// Downloads for a run. Output workbooks redirect to a short-lived signed storage link (no bytes through us);
// bundles and original inputs stream through from the engine. Access is checked by the engine as well.
export async function GET(_: Request, { params }: { params: Promise<{ runId: string; area: string; kind: string }> }) {
  const { runId, area, kind } = await params;
  const p = await getPrincipal();
  if (!p?.tenantId || !can(p, "ecl.view")) return new Response("Unauthorized", { status: 401 });
  if (!/^[0-9A-Z]{26}$/.test(runId) || !/^[a-z_]{2,24}$/.test(kind) || !["downloads", "inputs"].includes(area)) return new Response("Not found", { status: 404 });
  const base = `/api/v1/tenants/${p.tenantId}/runs/${runId}/${area}`;
  if (area === "downloads" && kind !== "bundle") {
    const r = await engineFetch(p, `${base}/${kind.toUpperCase()}`);
    if (!r.ok) return new Response("This file isn't available.", { status: r.status });
    const { data } = (await r.json()) as { data: { url: string } };
    return Response.redirect(data.url, 302);
  }
  const r = await engineFetch(p, kind === "bundle" ? `${base}/bundle` : `${base}/${kind.toUpperCase()}/file`);
  if (!r.ok || !r.body) return new Response("This file isn't available.", { status: r.status || 502 });
  return new Response(r.body, { headers: { "Content-Type": r.headers.get("content-type") ?? "application/octet-stream", "Content-Disposition": r.headers.get("content-disposition") ?? "attachment", "Cache-Control": "private, no-store" } });
}
