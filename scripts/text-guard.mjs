// Plain text guard (docs/POLISH_PLAN.md): the words people read on komputy.com contain no dashes of any kind.
// Usage: node scripts/text-guard.mjs [base-url]   (default http://localhost:3000; CI runs it against `next start`)
// With GUARD_EMAIL and GUARD_PASSWORD (a seeded workspace owner) it also signs in and checks the app screens.
// With GUARD_BROWSER=1 it reads the text a real browser shows after rendering (catches client-only text).
const BASE = process.argv[2] ?? process.env.GUARD_BASE ?? "http://localhost:3000";
const PAGES = ["/", "/pricing", "/contact", "/security", "/updates", "/services/ecl", "/services/leases", "/services/tax",
  "/legal/terms", "/legal/privacy", "/legal/dpa", "/legal/cookies", "/sign-in", "/sign-up", "/forgot-password"];
// Allowed: customer data shown verbatim in demos (loan and customer IDs), email addresses, the date format users type.
const ALLOW = [/^(LN|CU)-[\w-]+$/, /^YYYY-MM(-DD)?$/, /_/, /^ws-[a-z]+$/]; // loan/customer IDs, file names, demo seed workspace ids

const visibleText = (html) => html
  .replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, '"')
  .replace(/\S+@\S+\.\w+/g, " ");

const APP = ["/home", "/ecl", "/ecl/runs", "/ecl/results", "/ecl/reports", "/ecl/setup/segments", "/leases", "/leases/register",
  "/leases/inbox", "/leases/journals", "/leases/close", "/leases/imports", "/leases/reports", "/admin/overview", "/admin/members",
  "/admin/services", "/admin/requests", "/admin/profile", "/admin/security", "/admin/audit-log", "/account/profile",
  "/account/security", "/account/notifications", "/account/appearance", "/notifications", "/activity", "/help",
  "/platform", "/platform/workspaces", "/platform/requests", "/platform/users", "/platform/services", "/platform/health", "/platform/audit", "/platform/engines"];
let cookie = "";
if (process.env.GUARD_EMAIL) {
  const r = await fetch(BASE + "/api/auth/sign-in/email", { method: "POST", headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({ email: process.env.GUARD_EMAIL, password: process.env.GUARD_PASSWORD }) });
  cookie = r.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  if (!r.ok || !cookie) { console.error(`text guard: sign-in failed (${r.status})`); process.exit(1); }
  PAGES.push(...APP);
}

let browser, page;
if (process.env.GUARD_BROWSER) {
  const { createRequire } = await import("node:module");
  const { chromium } = createRequire(process.env.PLAYWRIGHT_DIR ?? "/home/moses/.npm/_npx/361ceb562f3b3235/node_modules/")("playwright");
  browser = await chromium.launch();
  const ctx = await browser.newContext();
  if (cookie) await ctx.addCookies(cookie.split("; ").map((c) => { const i = c.indexOf("="); return { name: c.slice(0, i), value: c.slice(i + 1), url: BASE }; }));
  page = await ctx.newPage();
}
const read = async (path) => {
  if (page) {
    const r = await page.goto(BASE + path, { waitUntil: "load" }).catch(() => null);
    if (!r || r.status() === 404 || !page.url().endsWith(path)) return null;
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {}); // live pages keep a stream open
    return (await page.evaluate(() => document.body.innerText)).replace(/\S+@\S+\.\w+/g, " ");
  }
  const res = await fetch(BASE + path, { headers: cookie ? { cookie } : {}, redirect: "manual" });
  if (res.status === 404 || (res.status >= 300 && res.status < 400)) return null;
  return visibleText(await res.text());
};

let failures = 0;
for (const path of PAGES) {
  const text = await read(path);
  if (text === null) continue; // missing or redirected page
  const bad = [...text.matchAll(/[\w%).]*(?:[-\u2010-\u2015\u2212][\w(.]*)+/g)].map((m) => m[0])
    .filter((w) => /\w/.test(w) || /[\u2010-\u2015\u2212]/.test(w))
    .filter((w) => !ALLOW.some((re) => re.test(w)));
  if (bad.length) { failures += bad.length; console.log(`${path}: ${[...new Set(bad)].join(", ")}`); }
}
await browser?.close();
if (failures) { console.error(`text guard: ${failures} dash(es) in visible text`); process.exit(1); }
console.log(`text guard: ${PAGES.length} pages clean`);
