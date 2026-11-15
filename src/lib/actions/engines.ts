"use server";
import { z } from "zod";
import { audit } from "@/server/audit";
import { engine } from "@/server/engine/client";
import type { ActionResult } from "@/server/mutate";
import { can } from "@/server/policy";
import { getPrincipal } from "@/server/session";

/** PA8.1: promote an engine version to default (the engine owns versions; we authorize + audit). */
export async function promoteEngine(version: string): Promise<ActionResult> {
  const v = z.string().regex(/^(ecl|leases)@[\w.-]{1,32}$/).safeParse(version); // "<service>@<version>" from the Engines table
  const p = await getPrincipal();
  if (!v.success || !p || !can(p, "engine.promote")) return { ok: false, error: "You don't have permission to do this." };
  const [service, ver] = v.data.split("@") as ["ecl" | "leases", string];
  const r = await engine(p, null).POST("/api/v1/platform/engine-versions/promote", { body: { service, version: ver } }).catch(() => null);
  if (!r?.response.ok) return { ok: false, error: "The engine refused the promotion. Check the version and try again." };
  await audit({ event: "platform.engine_promoted", userId: p.userId, tenantId: null, details: { detail: v.data, staff: true } });
  return { ok: true, data: undefined };
}
