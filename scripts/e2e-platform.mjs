// Browser E2E for the Next-owned platform features. Needs: dev server on :3300, seeded DB (npm run db:seed), docker ecl-web-pg.
// Run: node scripts/e2e-platform.mjs   (PLAYWRIGHT_DIR overrides where the playwright package is found)
// shortcut: playwright is borrowed from the npx cache, not a devDependency; add @playwright/test when CI runs this.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(process.env.PLAYWRIGHT_DIR ?? "/home/moses/.npm/_npx/361ceb562f3b3235/node_modules/");
const { chromium } = require("playwright");
const BASE = process.env.E2E_BASE ?? "http://localhost:3300", PW = "Komputy-Demo-2026", OWNER = "a.mugisha@kivubank.rw", ADMIN = "j.kamau@komputy.com";
const PGU = execFileSync("docker", ["exec", "ecl-web-pg", "printenv", "POSTGRES_USER"]).toString().trim();
// E2E_DATABASE_URL (any reachable Postgres, e.g. Render external URL) or the local dev container.
const sql = (q) => (process.env.E2E_DATABASE_URL ? execFileSync("psql", [process.env.E2E_DATABASE_URL, "-tAc", q]) : execFileSync("docker", ["exec", "ecl-web-pg", "psql", "-U", PGU, "-d", "ecl_db", "-tAc", q])).toString().trim();
const results = [];
const check = (name, ok, info = "") => { results.push(ok); console.log(ok ? "PASS" : "FAIL", name, info); };
const step = async (name, fn) => { try { await fn(); } catch (e) { check(name, false, String(e.message ?? e).split("\n")[0].slice(0, 200)); } };
const outbox = (subj, to) => Number(sql(`select count(*) from email_outbox where payload->>'subject' ilike '${subj}' ${to ? `and payload->>'to'='${to}'` : ""}`));

const browser = await chromium.launch();
const signIn = async (email) => {
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem("ll_onboarding", JSON.stringify({ welcomed: true }))); // no welcome modal over the page
  await page.goto(`${BASE}/sign-in`, { timeout: 120000 }); await page.fill("#si-email", email); await page.fill("input[name=password]", PW);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/sign-in"), { timeout: 120000 }), page.click("button[type=submit]")]);
  return { ctx, page };
};

const EMAIL = `buyer+${Date.now()}@acmebank.rw`;
await step("contact form creates lead", async () => {
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${BASE}/contact`, { timeout: 120000 });
  const before = Number(sql("select count(*) from access_requests where kind='lead'"));
  await page.fill("input[name=name]", "Test Buyer"); await page.fill("input[name=email]", EMAIL); await page.fill("input[name=company]", "Acme Bank");
  await page.locator("select[name=country]").selectOption({ index: 1 });
  if (!(await page.locator("input[name=services]").count())) await page.locator("button[aria-pressed]").first().click();
  await page.getByRole("checkbox", { name: /agree to be contacted/ }).click();
  await page.getByRole("button", { name: "Send request" }).click();
  await page.getByText(/Reference REQ-/).waitFor({ timeout: 60000 });
  const after = Number(sql("select count(*) from access_requests where kind='lead'"));
  const ref = await page.getByText(/Reference REQ-/).innerText();
  check("contact form creates lead", after === before + 1 && !/REQ-2026/.test(ref), `leads ${before}→${after}; ${ref.slice(0, 40)}; ack=${outbox("We got your request%", EMAIL)}`);
});

const { ctx: oc, page } = await signIn(OWNER);
if (page.url().includes("/select-workspace")) { await page.locator("label").first().click(); await page.locator("button[type=submit]").first().click(); await page.waitForURL(/home/); }
const tid = sql("select id from tenants where name='Kivu Commercial Bank'");

await step("checklist auto-done + persisted", async () => {
  sql(`update tenants set metadata = null where id='${tid}'`); // start from a clean checklist
  await page.goto(`${BASE}/home`); await page.waitForSelector("#setup-title", { timeout: 120000 });
  const invite = await page.getByRole("checkbox", { name: /Invite your team/ }).getAttribute("aria-checked");
  await page.getByRole("checkbox", { name: 'Mark "Add collateral types" done' }).click(); await page.waitForTimeout(2500);
  const meta = sql(`select metadata from tenants where id='${tid}'`);
  await page.reload(); await page.waitForSelector("#setup-title");
  const after = await page.getByRole("checkbox", { name: 'Mark "Add collateral types" not done' }).count();
  check("checklist auto-done + persisted", invite === "true" && meta.includes("ecl-collateral") && after === 1, `invite=${invite} meta=${meta.slice(0, 70)}`);
});
await step("command palette real data", async () => {
  await page.waitForLoadState("networkidle"); // shortcut handler attaches on hydration
  await page.keyboard.press("Control+k"); await page.waitForSelector("[cmdk-input]"); await page.waitForTimeout(2000);
  const groups = await page.locator("[cmdk-group-heading]").allTextContents();
  check("command palette real data", groups.includes("People") && !groups.includes("Runs"), `groups=${groups.join("/")}`);
  await page.keyboard.press("Escape");
});
await step("members deep link filters", async () => {
  const email = sql(`select u.email from users u join tenant_memberships m on m.user_id=u.id where m.tenant_id='${tid}' and u.email<>'${OWNER}' limit 1`);
  await page.goto(`${BASE}/admin/members?q=${encodeURIComponent(email)}`); await page.waitForTimeout(3000);
  check("members deep link filters", (await page.locator("tbody tr").count()) === 1, email);
});
await step("photo upload persists", async () => {
  await page.goto(`${BASE}/account/profile`); await page.waitForSelector("input[aria-label='Upload photo']", { state: "attached", timeout: 120000 }); await page.waitForLoadState("networkidle"); // React must hydrate before the file event
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGklEQVR4nGNk+M9Qz0AEYBxVSF+FAAAKiAH/7oA1qgAAAABJRU5ErkJggg==", "base64");
  await page.setInputFiles("input[aria-label='Upload photo']", { name: "me.png", mimeType: "image/png", buffer: png }); await page.waitForTimeout(4000);
  const img = sql(`select coalesce(image,'') from users where email='${OWNER}'`);
  const res = img ? await page.request.get(`${BASE}${img}`, { timeout: 120000 }) : null;
  check("photo upload persists", img.startsWith("/api/avatar/") && res?.headers()["content-type"] === "image/webp", `image=${img}`);
});
await step("password change emails", async () => {
  const before = outbox("Your Komputy password was changed", OWNER);
  const a = await page.request.post(`${BASE}/api/auth/change-password`, { data: { currentPassword: PW, newPassword: PW + "!x" }, headers: { origin: BASE } });
  const b = await page.request.post(`${BASE}/api/auth/change-password`, { data: { currentPassword: PW + "!x", newPassword: PW }, headers: { origin: BASE } });
  check("password change emails", a.ok() && b.ok() && outbox("Your Komputy password was changed", OWNER) === before + 2, `${a.status()}/${b.status()}`);
});
await step("idle sign-out", async () => {
  const c2 = await browser.newContext(); await c2.addCookies(await oc.cookies()); const p2 = await c2.newPage();
  await p2.addInitScript(() => localStorage.setItem("ll_onboarding", JSON.stringify({ welcomed: true })));
  await p2.clock.install(); await p2.goto(`${BASE}/home`); await p2.waitForSelector("#setup-title", { timeout: 120000 });
  await p2.clock.runFor("29:30");
  const warned = await p2.getByText("You'll be signed out in a minute").count();
  await p2.clock.runFor("01:00");
  await p2.waitForURL(/sign-in/, { timeout: 60000 });
  check("idle sign-out", warned > 0 && p2.url().includes("expired=1"), `warned=${warned} url=${p2.url()}`);
  await c2.close();
});

const { page: ap } = await signIn(ADMIN);
const { page: op } = await signIn(OWNER);
await step("suspend workspace", async () => {
  await ap.goto(`${BASE}/platform/workspaces/${tid}/summary`, { timeout: 120000 }); await ap.getByRole("button", { name: "More" }).click();
  await ap.getByRole("menuitem", { name: /Suspend workspace/ }).click(); await ap.locator("textarea").last().fill("Unpaid invoices test");
  await ap.getByRole("button", { name: "Suspend workspace" }).click(); await ap.waitForTimeout(3000);
  await op.goto(`${BASE}/home`); await op.waitForURL(/select-workspace/, { timeout: 60000 }).catch(() => {});
  check("suspend workspace", sql(`select status from tenants where id='${tid}'`) === "suspended" && op.url().includes("error=suspended"), op.url());
});
await step("reactivate workspace", async () => {
  await ap.reload(); await ap.getByRole("button", { name: "More" }).click(); await ap.getByRole("menuitem", { name: /Reactivate/ }).click();
  await ap.locator("textarea").last().fill("Paid"); await ap.getByRole("button", { name: "Reactivate" }).click(); await ap.waitForTimeout(3000);
  check("reactivate workspace", ["active", "trial"].includes(sql(`select status from tenants where id='${tid}'`)));
});
await step("workspace session timeout", async () => {
  await op.goto(`${BASE}/select-workspace`); await op.locator("label").first().click(); await op.locator("button[type=submit]").first().click().catch(() => {}); await op.waitForTimeout(3000);
  const count = () => Number(sql(`select count(*) from auth_sessions where user_id=(select id from users where email='${OWNER}')`));
  const before = count();
  sql(`update tenants set session_timeout_hours = 0 where id='${tid}'`); // every session is now over the limit
  try { await op.goto(`${BASE}/home`); await op.waitForURL(/select-workspace/, { timeout: 60000 }).catch(() => {}); } finally { sql(`update tenants set session_timeout_hours = 8 where id='${tid}'`); }
  check("workspace session timeout", count() === before - 1, `sessions ${before}→${count()}`);
});
await step("muted prefs suppress notices", async () => {
  const ownerId = sql(`select id from users where email='${OWNER}'`);
  sql(`insert into notification_preferences (id,user_id,muted_kinds,matrix,digest) values ('01TESTPREF0000000000000000','${ownerId}','{access}','{"requests:email": false}','daily') on conflict (user_id) do update set muted_kinds='{access}', matrix='{"requests:email": false}'`);
  const reqs = () => Number(sql(`select count(*) from access_requests where tenant_id='${tid}' and scope='member'`));
  const inApp = () => Number(sql(`select count(*) from user_notifications where user_id='${ownerId}' and kind='access'`));
  const member = sql(`select u.email from users u join tenant_memberships m on m.user_id=u.id where m.tenant_id='${tid}' and m.workspace_role='member' and m.status='active' and not exists (select 1 from member_service_roles r where r.membership_id=m.id and r.service='leases') limit 1`);
  sql(`delete from access_requests where tenant_id='${tid}' and service='leases' and status='open'`); // page shows "requested" while one is open
  const { ctx, page: mp } = await signIn(member);
  const [r0, n0, m0] = [reqs(), inApp(), outbox("%asked for%", OWNER)];
  await mp.goto(`${BASE}/locked/leases`, { timeout: 120000 }); await mp.waitForTimeout(2000);
  await mp.getByRole("button", { name: "Ask my admin" }).first().click(); await mp.waitForTimeout(800);
  await mp.getByRole("button", { name: "Send request" }).click(); await mp.waitForTimeout(4000);
  check("muted prefs suppress notices", reqs() === r0 + 1 && inApp() === n0 && outbox("%asked for%", OWNER) === m0, `member=${member} requests ${r0}→${reqs()} in-app ${n0}→${inApp()}`);
  sql(`delete from notification_preferences where user_id='${ownerId}'`);
  await ctx.close();
});

await browser.close();
console.log(`\nSUMMARY ${results.filter(Boolean).length} / ${results.length}`);
process.exit(results.every(Boolean) ? 0 : 1);
