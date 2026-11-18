import assert from "node:assert/strict";
import { test } from "node:test";
import { daysLeft } from "./entitlements.ts";

const at = (trialEndsAt: string | null) => ({ trialEndsAt }) as Parameters<typeof daysLeft>[0];
const today = new Date("2026-11-18T10:00:00Z");

test("trial days left never go negative", () => {
  assert.equal(daysLeft(at("2026-11-16T00:00:00Z"), today), 0); // ended two days ago
  assert.equal(daysLeft(at("2026-11-18T23:00:00Z"), today), 1); // ends later today
  assert.equal(daysLeft(at("2026-11-25T10:00:00Z"), today), 7);
  assert.equal(daysLeft(at(null), today), null);
});
