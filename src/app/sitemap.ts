import type { MetadataRoute } from "next";
import { SERVICES } from "@/lib/services";

const BASE = "https://komputy.com";

/** Public, indexable pages only (app and platform routes are private). */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/pricing", "/security", "/updates", "/contact", "/sign-up", "/sign-in", "/updates/rss.xml", ...SERVICES.map((s) => `/services/${s.id}`), ...["terms", "privacy", "dpa", "cookies"].map((d) => `/legal/${d}`)];
  return pages.map((p) => ({ url: `${BASE}${p}`, changeFrequency: p === "" ? "weekly" : "monthly", priority: p === "" ? 1 : 0.6 }));
}
