import "server-only";
import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { pricing } from "@/data/content";
import { db, schema } from "@/server/db/client";

export interface PublicPlan { name: string; price: string; unit: string; detail: string; cta: string; featured: boolean }

/** PA6 → public pricing: the published catalog, cached; `saveCatalog({ publish })` revalidates the "catalog" tag. */
export async function publishedPlans(): Promise<PublicPlan[]> {
  "use cache";
  cacheTag("catalog");
  cacheLife("hours");
  try {
    const [c] = await db.select({ published: schema.catalog.published }).from(schema.catalog).where(eq(schema.catalog.id, "main"));
    const pkgs = (c?.published as { packages?: (PublicPlan & { features?: string[] })[] } | undefined)?.packages;
    if (pkgs?.length) return pkgs.filter((p) => p.name !== "Trial").slice(0, 3).map(({ name, price, unit, detail, cta, featured, features }) => ({ name, price, unit, detail: features?.filter(Boolean).join(" · ") || detail, cta, featured }));
  } catch {
    // No database at build time or a transient error: fall back to the built-in copy rather than break the public site.
  }
  return pricing.plans;
}
