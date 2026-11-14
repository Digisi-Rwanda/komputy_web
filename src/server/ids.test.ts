import assert from "node:assert/strict";
import { ulid } from "./ids.ts";

// Vector from python-ulid (ECL-Server) for the same millisecond: both services must sort IDs identically.
assert.equal(ulid(1763130000000).slice(0, 10), "01KA1BSGM0");
assert.match(ulid(), /^[0-9A-HJKMNP-TV-Z]{26}$/);
assert.ok(ulid(1) < ulid(2), "time-sortable");
console.log("ulid ok");
