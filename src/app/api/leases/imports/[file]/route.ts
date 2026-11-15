import { engineFetch } from "@/server/engine/client";
import { can } from "@/server/policy";
import { getPrincipal } from "@/server/session";

// /api/leases/imports/template → the import template CSV; /api/leases/imports/<code> → that batch's errors CSV.
export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const p = await getPrincipal();
  if (!p?.tenantId || !can(p, "leases.view")) return new Response("Unauthorized", { status: 401 });
  if (!/^[\w-]{1,40}$/.test(file)) return new Response("Not found", { status: 404 });
  const path = file === "template" ? "imports/template.csv" : `imports/${file}/errors.csv`;
  const r = await engineFetch(p, `/api/v1/tenants/${p.tenantId}/leases/${path}`);
  if (!r.ok || !r.body) return new Response("Not available.", { status: r.status || 502 });
  return new Response(r.body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": r.headers.get("content-disposition") ?? `attachment; filename="${file}.csv"`, "Cache-Control": "private, no-store" } });
}
