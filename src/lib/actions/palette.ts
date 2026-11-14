"use server";
import { can } from "@/server/policy";
import { listMembers } from "@/server/dal/members";
import { listMyWorkspaces } from "@/server/dal/workspace";
import { getPrincipal } from "@/server/session";

/** ⌘K data, loaded when the palette opens: people in this workspace (admins only), my workspaces, what I may do. */
export async function paletteData() {
  const p = await getPrincipal();
  if (!p) return null;
  const [mine, people] = await Promise.all([listMyWorkspaces(p.userId), p.tenantId && can(p, "members.manage") ? listMembers(p.tenantId) : Promise.resolve([])]);
  return {
    current: p.tenantId,
    workspaces: mine.filter((m) => !m.suspended).map((m) => ({ id: m.ws.id, name: m.ws.name, role: m.role })),
    people: people.map((m) => ({ name: m.name, email: m.email })),
    can: { admin: can(p, "members.manage"), ecl: p.services.ecl !== "none", leases: p.services.leases !== "none", staff: Boolean(p.staff) },
  };
}
