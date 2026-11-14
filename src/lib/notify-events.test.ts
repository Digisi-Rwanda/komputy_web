import assert from "node:assert/strict";
import { test } from "node:test";
import { channels } from "./notify-events.ts";

const p = (matrix: Record<string, boolean>, mutedKinds: string[] = [], digest = "daily") => ({ matrix, mutedKinds, digest });
test("defaults apply without prefs", () => assert.deepEqual(channels("joined", "workspace"), { app: true, email: false }));
test("security is locked on", () => assert.deepEqual(channels("pw", "security", p({ "pw:app": false, "pw:email": false }, ["security"])), { app: true, email: true }));
test("muted kind hides in-app", () => assert.equal(channels("requests", "access", p({}, ["access"])).app, false));
test("matrix off wins over default", () => assert.equal(channels("role", "workspace", p({ "role:email": false })).email, false));
test("non-urgent email waits for digest", () => { assert.equal(channels("invites", "workspace", p({ "invites:email": true })).email, false); assert.equal(channels("invites", "workspace", p({ "invites:email": true }, [], "off")).email, true); });
