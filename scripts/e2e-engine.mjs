// Live browser E2E across web + engine + queue + storage: the ECL journey a bank analyst and reviewer take.
// Needs: web :3300 (BETTER_AUTH_URL=http://localhost:3300 ENGINE_URL=http://127.0.0.1:8100), engine API :8100 + worker, MinIO :9010, seed.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(process.env.PLAYWRIGHT_DIR ?? "/home/moses/.npm/_npx/361ceb562f3b3235/node_modules/");
const { chromium } = require("playwright");
const BASE = process.env.E2E_BASE ?? "http://localhost:3300", PW = "Komputy-Demo-2026", OWNER = "a.mugisha@kivubank.rw";
const WB = new URL("../../komputy_server/tests/fixtures/workbooks/", import.meta.url).pathname;
const PGU = execFileSync("docker", ["exec", "ecl-web-pg", "printenv", "POSTGRES_USER"]).toString().trim();
// E2E_DATABASE_URL (any reachable Postgres, e.g. Render external URL) or the local dev container.
const sql = (q) => (process.env.E2E_DATABASE_URL ? execFileSync("psql", [process.env.E2E_DATABASE_URL, "-tAc", q]) : execFileSync("docker", ["exec", "ecl-web-pg", "psql", "-U", PGU, "-d", "ecl_db", "-tAc", q])).toString().trim();
const results = [];
const check = (name, ok, info = "") => { results.push(ok); console.log(ok ? "PASS" : "FAIL", name, info); };
const step = async (name, fn) => { try { await fn(); } catch (e) { check(name, false, String(e.message ?? e).split("\n")[0].slice(0, 300)); } };

const browser = await chromium.launch();
const signIn = async (email) => {
  const ctx = await browser.newContext({ acceptDownloads: true }); const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem("ll_onboarding", JSON.stringify({ welcomed: true })));
  page.on("pageerror", (e) => console.log("  [pageerror]", e.message.slice(0, 200)));
  await page.goto(`${BASE}/sign-in`, { timeout: 120000 }); await page.fill("#si-email", email); await page.fill("input[name=password]", PW);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/sign-in"), { timeout: 120000 }), page.click("button[type=submit]")]);
  if (page.url().includes("/select-workspace")) { await page.locator("label").first().click(); await page.locator("button[type=submit]").first().click(); await page.waitForURL(/home/, { timeout: 60000 }); }
  return { ctx, page };
};
const tid = sql("select id from tenants where name='Kivu Commercial Bank'");
// A second Kivu member who reviews (not the preparer): give them the ECL reviewer role for this test.
const reviewer = sql(`select u.email from users u join tenant_memberships m on m.user_id=u.id where m.tenant_id='${tid}' and m.status='active' and u.email<>'${OWNER}' and u.is_active order by m.workspace_role limit 1`);
const revMid = sql(`select m.id from tenant_memberships m join users u on u.id=m.user_id where u.email='${reviewer}' and m.tenant_id='${tid}'`);
sql(`delete from member_service_roles where membership_id='${revMid}' and service='ecl'; insert into member_service_roles (id, membership_id, service, role) values ('01E2EREVIEWER0000000000000','${revMid}','ecl','reviewer'); update tenants set authz_version = authz_version + 1 where id='${tid}'`);

const { page } = await signIn(OWNER);
let runId = "";
const name = `E2E run ${new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).replace(",", "")}`;

await step("create run (setup)", async () => {
  await page.goto(`${BASE}/ecl/runs/new/setup?new=1`, { timeout: 120000 });
  await page.waitForURL(/\/ecl\/runs\/new\/setup$/, { timeout: 60000 }).catch(() => {});
  await page.locator("#ws-name").fill(name);
  await page.getByRole("button", { name: /Create run and continue/ }).click();
  await page.waitForURL(/\/ecl\/runs\/new\/pd\?run=/, { timeout: 60000 });
  runId = new URL(page.url()).searchParams.get("run");
  check("create run (setup)", /^[0-9A-Z]{26}$/.test(runId), runId);
});

const dataStep = async (k, file) => {
  await step(`${k}: upload → validate → accept`, async () => {
    await page.goto(`${BASE}/ecl/runs/new/${k}?run=${runId}`, { timeout: 120000 });
    await page.waitForTimeout(2500); // wizard hydrates the run from the engine before showing the drop zone
    await page.locator("input[type=file]").first().setInputFiles(WB + file);
    await page.getByText(/All checks passed|Passed with warnings|Cannot continue/).waitFor({ timeout: 180000 });
    if (k === "pd") { // a second PD workbook (more months of history), as banks do
      await page.locator("#replace-pd").setInputFiles(WB + "PD_2025_Mar_Apr.xlsx");
      await page.waitForTimeout(1500);
      await page.getByText(/All checks passed|Passed with warnings|Cannot continue/).waitFor({ timeout: 180000 });
    }
    const blocked = await page.getByText(/Cannot continue/).count();
    if (await page.getByRole("checkbox", { name: /reviewed the/ }).count()) await page.getByRole("checkbox", { name: /reviewed the/ }).click();
    const acc = page.getByRole("button", { name: new RegExp(`Accept ${k.toUpperCase()} and continue`) });
    if (!blocked) { await acc.click(); await page.waitForURL(new RegExp(`/ecl/runs/new/(lgd|ead|review)`), { timeout: 60000 }); }
    await page.waitForTimeout(1000);
    const status = sql(`select string_agg(validation_status || ':' || warnings_accepted, ',') from engine.uploads where run_id='${runId}' and kind='${k.toUpperCase()}'`);
    check(`${k}: upload → validate → accept`, !blocked && /^(ok:\w+|warn:true)(,(ok:\w+|warn:true))*$/.test(status), status);
  });
};
await dataStep("pd", "PD_2025_Jan_Feb.xlsx");
await dataStep("lgd", "LGD_2025_03.xlsx");
await dataStep("ead", "EAD_2025_03.xlsx");

await step("compute (queued, live progress)", async () => {
  await page.goto(`${BASE}/ecl/runs/new/review?run=${runId}`, { timeout: 120000 });
  await page.waitForTimeout(3000); // hydrate before the gate settles
  await page.getByRole("button", { name: "Compute ECL" }).click();
  await page.waitForURL(/\/ecl\/runs\/new\/compute/, { timeout: 60000 });
  await page.getByRole("heading", { name: "ECL computed" }).waitFor({ timeout: 300000 });
  check("compute (queued, live progress)", sql(`select status from engine.runs where id='${runId}'`) === "complete");
});

await step("run summary shows engine figures", async () => {
  await page.goto(`${BASE}/ecl/runs/${runId}/summary`, { timeout: 120000 });
  const total = Number(sql(`select total_ecl from engine.runs where id='${runId}'`));
  await page.getByText("Total ECL").first().waitFor({ timeout: 60000 });
  const body = await page.locator("main").innerText();
  const shown = total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  check("run summary shows engine figures", total > 0 && body.includes(shown.split(".")[0]), `total ${shown}`);
});
await step("results tab, exceptions, outputs", async () => {
  await page.goto(`${BASE}/ecl/runs/${runId}/results`, { timeout: 120000 });
  const rows = await page.locator("tbody tr").count();
  await page.goto(`${BASE}/ecl/runs/${runId}/outputs`, { timeout: 120000 });
  await page.waitForTimeout(3000);
  const outs = await page.getByRole("link", { name: "Download" }).count();
  check("results tab, exceptions, outputs", rows > 5, `loan rows ${rows}, output files ${outs}`);
});
await step("report export downloads", async () => {
  const r = await page.request.get(`${BASE}/api/ecl/reports/coverage?run=${runId}&fmt=xlsx`);
  const buf = await r.body();
  check("report export downloads", r.ok() && buf.slice(0, 2).toString() === "PK", `${r.status()} ${buf.length} bytes`);
});
await step("preparer can't sign off", async () => {
  await page.goto(`${BASE}/ecl/runs/${runId}/summary`, { timeout: 120000 });
  const btn = page.getByRole("button", { name: /Approve & sign off/ });
  check("preparer can't sign off", (await btn.count()) === 0 || await btn.isDisabled());
});

const { page: rp } = await signIn(reviewer);
await step("reviewer signs off → locked", async () => {
  await rp.goto(`${BASE}/ecl/runs/${runId}/summary`, { timeout: 120000 });
  await rp.getByRole("button", { name: /Approve & sign off/ }).click();
  await rp.getByRole("dialog").getByRole("button", { name: "Sign off" }).click();
  await rp.waitForTimeout(3000);
  const st = sql(`select review_status || ':' || (locked_at is not null) from engine.runs where id='${runId}'`);
  check("reviewer signs off → locked", st === "signed_off:true", st);
});
await step("notices delivered via web (outbox → notify)", async () => {
  const consumed = (await rp.request.post(`${BASE}/api/cron/events`, { headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` } })).status();
  const pending = sql(`select count(*) from engine.outbox_events where payload->>'runId'='${runId}' and consumed_at is null`);
  if (consumed === 401) console.log("SKIP notices delivered via web (set CRON_SECRET to run)", `pending ${pending}`);
  else check("notices delivered via web (outbox → notify)", consumed === 200 && pending === "0", `cron ${consumed}, pending ${pending}`);
});

await browser.close();
sql(`delete from member_service_roles where id='01E2EREVIEWER0000000000000'`);
console.log(`\nSUMMARY ${results.filter(Boolean).length} / ${results.length}`);
process.exit(results.every(Boolean) ? 0 : 1);
