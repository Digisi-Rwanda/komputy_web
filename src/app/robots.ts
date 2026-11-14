import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/home", "/ecl", "/leases", "/admin", "/account", "/notifications", "/activity", "/platform", "/dev", "/onboarding"] },
    sitemap: "https://ledgerline.app/sitemap.xml",
  };
}
