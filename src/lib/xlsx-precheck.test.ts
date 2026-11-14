import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { test } from "node:test";
import { ECL_REQUIRED, precheckXlsx } from "./xlsx-precheck.ts";

const DIR = new URL("../../../ECL-Server/test_data/", import.meta.url);
const file = (name: string) => new File([readFileSync(new URL(name, DIR))], name);
const have = existsSync(new URL("PD_2025_Jan_Feb.xlsx", DIR));

test("real engine fixtures pass their own dataset", { skip: !have && "ECL-Server fixtures not found" }, async () => {
  for (const [name, k] of [["PD_2025_Jan_Feb.xlsx", "pd"], ["LGD_2025_03.xlsx", "lgd"], ["EAD_2025_03.xlsx", "ead"]] as const) {
    const r = await precheckXlsx(file(name), ECL_REQUIRED[k]);
    assert.ok(r.ok, `${name}: ${r.errors.join(" ")}`);
  }
});
test("wrong dataset is caught", { skip: !have && "ECL-Server fixtures not found" }, async () => {
  const r = await precheckXlsx(file("LGD_2025_03.xlsx"), ECL_REQUIRED.ead);
  assert.equal(r.ok, false);
});
test("non-xlsx and fake zips are rejected", async () => {
  assert.equal((await precheckXlsx(new File(["a,b"], "x.csv"), ECL_REQUIRED.pd)).ok, false);
  assert.match((await precheckXlsx(new File(["x"], "m.xlsm"), ECL_REQUIRED.pd)).errors[0], /[Mm]acro/);
  assert.match((await precheckXlsx(new File(["not a zip"], "f.xlsx"), ECL_REQUIRED.pd)).errors[0], /valid/);
});
