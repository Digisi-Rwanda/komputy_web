import "server-only";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { audit } from "@/server/audit";
import { db, type Tx } from "@/server/db/client";
import { can, type Action, type Principal } from "@/server/policy";
import { getPrincipal } from "@/server/session";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** A refusal the user should read (wrong state, not allowed, conflict). Anything else is logged and hidden. */
export class UserError extends Error {}

interface Ctx<I> { p: Principal; input: I; tx: Tx; audit: (event: string, details?: Record<string, unknown>) => Promise<void> }

/**
 * The one way the app writes data: validate → authenticate → authorize → transaction (write + audit + outbox) → revalidate.
 * Returned function is an async Server Action body; export it from a "use server" file.
 */
export function mutate<S extends z.ZodType, R>(o: {
  action: Action;
  schema: S;
  run: (ctx: Ctx<z.infer<S>>) => Promise<R>;
  tags?: (p: Principal, input: z.infer<S>, result: R) => string[];
}) {
  return async (raw: z.input<S>): Promise<ActionResult<R>> => {
    const parsed = o.schema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const i of parsed.error.issues) fieldErrors[i.path.join(".") || "_"] ??= i.message;
      return { ok: false, error: "Check the highlighted fields.", fieldErrors };
    }
    const p = await getPrincipal();
    if (!p) return { ok: false, error: "Your session ended. Sign in again." };
    if (!can(p, o.action)) return { ok: false, error: "You don't have permission to do this." };
    try {
      const data = await db.transaction((tx) => o.run({ p, input: parsed.data, tx, audit: (event, details) => audit({ event, userId: p.userId, tenantId: p.tenantId, details }, tx) }));
      for (const t of o.tags?.(p, parsed.data, data) ?? []) revalidateTag(t, "max");
      return { ok: true, data };
    } catch (e) {
      if (e instanceof UserError) return { ok: false, error: e.message };
      console.error(`[mutate:${o.action}]`, e);
      return { ok: false, error: "Something went wrong. Nothing was saved. Try again." };
    }
  };
}
