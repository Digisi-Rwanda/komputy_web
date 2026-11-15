import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { LEGAL } from "@/data/legal";
import { SERVICES } from "@/lib/services";

// Real 404 status for unknown slugs (dynamic pages stream before notFound(), which would otherwise send 200).
const KNOWN: Record<string, Set<string>> = {
  services: new Set(SERVICES.map((s) => s.id)),
  legal: new Set(LEGAL.map((d) => d.slug)),
};
const PUBLIC_SECTIONS = new Set(["services", "legal"]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const [, section, slug, ...rest] = pathname.split("/");
  if (PUBLIC_SECTIONS.has(section)) {
    if (rest.length || !KNOWN[section]?.has(slug)) return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
    return;
  }
  // Optimistic only: no session cookie → sign in. Real checks happen in the data layer (server/session.ts).
  if (!getSessionCookie(request, { cookiePrefix: "komputy" })) {
    const to = new URL("/sign-in", request.url);
    to.searchParams.set("next", pathname + search);
    return NextResponse.redirect(to);
  }
}

export const config = {
  matcher: [
    "/services/:path+", "/legal/:path+",
    "/home", "/ecl/:path*", "/leases/:path*", "/admin/:path*", "/account/:path*", "/notifications", "/activity", "/help", "/locked/:path*",
    "/platform/:path*", "/onboarding/:path*", "/select-workspace", "/new-workspace",
  ],
};
