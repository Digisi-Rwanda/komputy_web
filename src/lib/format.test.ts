import assert from "node:assert/strict";
import { test } from "node:test";
import { date, days, month } from "./format.ts";

test("dates read the same with or without a time, and never throw", () => {
  assert.equal(date("2025-03-31"), "31 Mar 2025");
  assert.equal(date("2025-03-31T00:00:00"), "31 Mar 2025"); // the value that crashed the new run wizard
  assert.equal(date("2025-03-31 00:00:00"), "31 Mar 2025");
  assert.equal(date("not a date"), "");
  assert.equal(month("2026-11"), "Nov 2026");
  assert.equal(days(1), "1 day");
  assert.equal(days(3), "3 days");
});
