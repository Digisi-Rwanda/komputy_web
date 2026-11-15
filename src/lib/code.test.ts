import assert from "node:assert/strict";
import { test } from "node:test";
import { codesInText, showCode } from "./code.ts";

test("codes read without dashes", () => {
  assert.equal(showCode("L-0012"), "L 0012");
  assert.equal(showCode("JB-202611-001"), "JB 202611 001");
  assert.equal(showCode("PD-01"), "PD 01");
  assert.equal(showCode(null), "");
  assert.equal(codesInText("Signed off RUN-0142 and L-0012, see JB-202611-001."), "Signed off RUN 0142 and L 0012, see JB 202611 001.");
  assert.equal(codesInText("No codes here: sign off, 14 day trial."), "No codes here: sign off, 14 day trial.");
});
