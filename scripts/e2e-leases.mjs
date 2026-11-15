// Live browser E2E for Lease Accounting (web + engine): setup (maker/checker) → new lease → approve → register/overview.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(process.env.PLAYWRIGHT_DIR ?? "/home/moses/.npm/_npx/361ceb562f3b3235/node_modules/");
const { chromium } = require("playwright");
const BASE = "http://localhost:3300", PW = "Ledgerline-Demo-2026", OWNER = "a.mugisha@kivubank.rw";
const PGU = execFileSync("docker", ["exec", "ecl-web-pg", "printenv", "POSTGRES_USER"]).toString().trim();
const sql = (q) => execFileSync("docker", ["exec", "ecl-web-pg", "psql", "-U", PGU, "-d", "ecl_db", "-tAc", q]).toString().trim();
const results = [];
const check = (name, ok, info = "") => { results.push(ok); console.log(ok ? "PASS" : "FAIL", name, info); };
const step = async (name, fn) => { try { await fn(); } catch (e) { check(name, false, String(e.message ?? e).split("\n")[0].slice(0, 300)); } };
const tid = sql("select id from tenants where name='Kivu Commercial Bank'");
// Fresh lease book for a repeatable run (engine-owned rows only).
for (const t of ["lease_journal_lines", "lease_journal_batches", "lease_actual_payments", "lease_close_runs", "lease_posted_balances", "lease_books", "lease_documents", "lease_versions", "leases", "lease_counterparties", "lease_setup_versions", "lease_periods", "lease_entities", "lease_alerts_sent"])
  sql(`delete from engine.${t} where tenant_id='${tid}'`);
const reviewer = sql(`select u.email from users u join tenant_memberships m on m.user_id=u.id where m.tenant_id='${tid}' and m.status='active' and u.email<>'${OWNER}' and u.is_active order by m.workspace_role limit 1`);
const revMid = sql(`select m.id from tenant_memberships m join users u on u.id=m.user_id where u.email='${reviewer}' and m.tenant_id='${tid}'`);
sql(`delete from member_service_roles where membership_id='${revMid}' and service='leases'; insert into member_service_roles (id, membership_id, service, role) values ('01E2ELEASEREVIEWER00000000','${revMid}','leases','reviewer'); update tenants set authz_version = authz_version + 1 where id='${tid}'`);

const browser = await chromium.launch();
const signIn = async (email) => {
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem("ll_onboarding", JSON.stringify({ welcomed: true })));
  page.on("pageerror", (e) => console.log("  [pageerror]", e.message.slice(0, 200)));
  await page.goto(`${BASE}/sign-in`, { timeout: 120000 }); await page.fill("#si-email", email); await page.fill("input[name=password]", PW);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/sign-in"), { timeout: 120000 }), page.click("button[type=submit]")]);
  if (page.url().includes("/select-workspace")) { await page.locator("label").first().click(); await page.locator("button[type=submit]").first().click(); await page.waitForURL(/home/, { timeout: 60000 }); }
  return page;
};
const toastErr = async (p) => (await p.locator("[data-sonner-toast][data-type=error]").allInnerTexts()).join(" | ");
const owner = await signIn(OWNER);
const setupStep = async (label, fill) => {
  await owner.goto(`${BASE}/leases/setup`, { timeout: 120000 }); await owner.waitForTimeout(1500);
  await owner.locator("ol button", { hasText: label }).first().click();
  await fill();
  await owner.getByRole("button", { name: /^(Save|Submit for approval|Submit a new version)/ }).click();
  await owner.waitForTimeout(2500);
  const err = await toastErr(owner);
  if (err) throw new Error(err);
};
await step("setup: entity + period (admin)", async () => {
  await setupStep("Entity", async () => { await owner.locator("#le-name").fill("Kivu Commercial Bank Plc"); });
  await setupStep("Periods", async () => { await owner.locator("#pe-first").fill("2027-01"); });
  check("setup: entity + period (admin)", sql(`select count(*) from engine.lease_entities where tenant_id='${tid}'`) === "1" && sql(`select count(*) from engine.lease_periods where tenant_id='${tid}'`) === "1");
});
await step("setup: GL, policies, rates submitted", async () => {
  await setupStep("GL mapping", async () => { const inputs = owner.locator("input[aria-label^='GL account for']"); const n = await inputs.count(); for (let i = 0; i < n; i++) await inputs.nth(i).fill(String(1600 + i)); });
  await setupStep("Policies", async () => {});
  await setupStep("Rate curves", async () => { await owner.locator("#rc-src").fill("Treasury memo TM-1"); });
  // The first version of each setup item is approved on creation (bootstrap); later changes go through review.
  check("setup: GL, policies, rates submitted", sql(`select count(*) from engine.lease_setup_versions where tenant_id='${tid}' and status in ('in_review','approved')`) === "3");
});
const rev = await signIn(reviewer);
const approveAll = async (pattern) => {
  await rev.goto(`${BASE}/leases/inbox`, { timeout: 120000 }); await rev.waitForTimeout(1500);
  let n = 0;
  for (;;) {
    const btn = rev.locator("li", { hasText: pattern }).getByRole("button", { name: "Review" }).first();
    if (!(await btn.count())) break;
    await btn.click(); await rev.getByRole("button", { name: "Approve" }).click(); await rev.waitForTimeout(2500); n++;
    const err = await toastErr(rev); if (err) throw new Error(err);
    if (n > 5) break;
  }
  return n;
};
await step("reviewer approves setup in inbox", async () => {
  const n = await approveAll(/Setup change/);
  check("reviewer approves setup in inbox", sql(`select count(*) from engine.lease_setup_versions where tenant_id='${tid}' and status='approved'`) === "3", `approved via inbox ${n}`);
});
await step("new lease wizard → submitted", async () => {
  await owner.goto(`${BASE}/leases/new/contract`, { timeout: 120000 }); await owner.waitForTimeout(1500);
  await owner.locator("#nl-name").fill("HQ — Floor 4");
  await owner.locator("#nl-cp").fill("Kigali Heights Properties");
  await owner.getByRole("button", { name: "Continue" }).click(); await owner.waitForURL(/terms/);
  await owner.locator("#nl-start").fill("2027-01-01"); await owner.locator("#nl-end").fill("2029-12-31");
  await owner.getByRole("button", { name: "Continue" }).click(); await owner.waitForURL(/payments/);
  const pay = owner.locator("#nl-amt"); await pay.fill("10000"); await pay.press("Tab");
  for (const s of ["rate", "judgements", "preview", "submit"]) { await owner.getByRole("button", { name: "Continue" }).click(); await owner.waitForURL(new RegExp(s)); }
  await owner.getByRole("button", { name: "Submit for approval" }).click();
  await owner.getByText(/submitted for approval/).waitFor({ timeout: 60000 });
  check("new lease wizard → submitted", sql(`select v.status from engine.lease_versions v join engine.leases l on l.id=v.lease_id where l.tenant_id='${tid}'`) === "in_review");
});
await step("reviewer approves lease; books computed", async () => {
  const n = await approveAll(/New lease/);
  const books = sql(`select count(*) from engine.lease_books b join engine.leases l on l.id=b.lease_id where l.tenant_id='${tid}'`);
  check("reviewer approves lease; books computed", n === 1 && books === "1", `approved ${n}, books ${books}`);
});
await step("register + overview show the lease", async () => {
  await owner.goto(`${BASE}/leases/register`, { timeout: 120000 });
  const reg = await owner.locator("main").innerText();
  await owner.goto(`${BASE}/leases`, { timeout: 120000 });
  const ov = await owner.locator("main").innerText();
  check("register + overview show the lease", reg.includes("HQ — Floor 4") && /[1-9][\d,]*\.\d{2}/.test(ov), "");
});
await step("lease detail: schedule + journals from the books", async () => {
  const code = sql(`select code from engine.leases where tenant_id='${tid}' limit 1`);
  await owner.goto(`${BASE}/leases/register/${code}/schedule`, { timeout: 120000 });
  const rows = await owner.locator("tbody tr").count();
  await owner.goto(`${BASE}/leases/register/${code}/journals`, { timeout: 120000 });
  const lines = await owner.locator("tbody tr").count();
  check("lease detail: schedule + journals from the books", rows >= 3 && lines >= 4, `schedule rows ${rows}, journal lines ${lines}`);
});
await step("month-end close starts", async () => {
  await owner.goto(`${BASE}/leases/close`, { timeout: 120000 }); await owner.waitForTimeout(1500);
  await owner.getByRole("button", { name: "Start the close" }).click(); await owner.waitForTimeout(3000);
  check("month-end close starts", sql(`select count(*) from engine.lease_close_runs where tenant_id='${tid}'`) === "1", await toastErr(owner));
});
await browser.close();
sql(`delete from member_service_roles where id='01E2ELEASEREVIEWER00000000'`);
console.log(`\nSUMMARY ${results.filter(Boolean).length} / ${results.length}`);
process.exit(results.every(Boolean) ? 0 : 1);
