"use server";
import { z } from "zod";
import { audit } from "@/server/audit";
import { engine } from "@/server/engine/client";
import type { ActionResult } from "@/server/mutate";
import { can } from "@/server/policy";
import { getPrincipal } from "@/server/session";

/** PA8.1: promote an engine version to default (Python owns engine versions; we authorize + audit). */
export async function promoteEngine(version: string): Promise<ActionResult> {
  const v = z.string().regex(/^[\w.-]{1,40}$/).safeParse(version);
  const p = await getPrincipal();
  if (!v.success || !p || !can(p, "engine.promote")) return { ok: false, error: "You don't have permission to do this." };
  const r = await engine(p, null).POST("/api/v1/platform/engine-versions/{version}/promote", { params: { path: { version: v.data } } }).catch(() => null);
  if (!r?.response.ok) return { ok: false, error: "The engine refused the promotion. Check the version and try again." };
  await audit({ event: "platform.engine_promoted", userId: p.userId, tenantId: null, details: { detail: v.data, staff: true } });
  return { ok: true, data: undefined };
}
