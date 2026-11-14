"use server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { schema } from "@/server/db/client";
import { readMeta } from "@/server/dal/onboarding";
import { mutate } from "@/server/mutate";

/** O2: tick/untick a step or hide the checklist for the whole workspace. Any member can (it's guidance, not policy). */
export const saveOnboarding = mutate({
  action: "workspace.view",
  schema: z.object({ task: z.string().regex(/^[a-z-]{2,32}$/).optional(), done: z.boolean().optional(), dismissed: z.boolean().optional() }),
  run: async ({ p, input, tx }) => {
    const [t] = await tx.select({ meta: schema.tenants.metadata }).from(schema.tenants).where(eq(schema.tenants.id, p.tenantId!)).for("update");
    const meta = readMeta(t?.meta ?? null);
    const cur = (meta.onboarding ?? { done: [], dismissed: false }) as { done: string[]; dismissed: boolean };
    const done = new Set(cur.done);
    if (input.task && input.done !== undefined) { if (input.done) done.add(input.task); else done.delete(input.task); }
    meta.onboarding = { done: [...done], dismissed: input.dismissed ?? cur.dismissed };
    await tx.update(schema.tenants).set({ metadata: JSON.stringify(meta) }).where(eq(schema.tenants.id, p.tenantId!));
  },
});
