import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { getSession } from "@/server/session";

/** Profile photo bytes. Signed-in only; URLs carry a version (?v=) so they cache for a day without going stale. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return new Response(null, { status: 401 });
  const [u] = await db.select({ data: schema.users.avatarData }).from(schema.users).where(eq(schema.users.id, (await params).id));
  const m = u?.data && /^data:(image\/(?:webp|png|jpeg));base64,(.+)$/.exec(u.data);
  if (!m) return new Response(null, { status: 404 });
  return new Response(Buffer.from(m[2], "base64"), { headers: { "content-type": m[1], "cache-control": "private, max-age=86400, immutable", "x-content-type-options": "nosniff" } });
}
