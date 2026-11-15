import assert from "node:assert/strict";
import { ACTIONS, can, canApprove, canChangeRole, type Principal } from "./policy.ts";

const base: Principal = { userId: "u", email: "u@x.rw", name: "U", sessionId: "s", mfa: true, staff: null, tenantId: "t", membershipId: "m", workspaceRole: "member", services: { ecl: "analyst", leases: "none" } };
const as = (o: Partial<Principal>): Principal => ({ ...base, ...o });

const member = as({}), admin = as({ workspaceRole: "admin" }), owner = as({ workspaceRole: "owner" });
const outsider = as({ tenantId: null, membershipId: null, workspaceRole: null });
const staff = { admin: as({ staff: "admin", workspaceRole: null }), sales: as({ staff: "sales", workspaceRole: null }), support: as({ staff: "support", workspaceRole: null }) };

// Exhaustive expectations: every action must appear, so a new rule without a test fails here.
const EXPECT: Record<string, Principal[]> = {
  "workspace.view": [member, admin, owner], "notifications.manage": [member, admin, owner], "access.request": [member, admin, owner], "activity.view": [member, admin, owner],
  "workspace.update": [admin, owner], "members.view": [admin, owner], "members.manage": [admin, owner], "invites.manage": [admin, owner], "security.manage": [admin, owner],
  "requests.decide": [admin, owner], "audit.view": [admin, owner], "services.request": [admin, owner], "support.decide": [admin, owner],
  "ownership.transfer": [owner], "workspace.close": [owner],
  "ecl.view": [member, admin, owner], "ecl.prepare": [member, admin, owner], "ecl.review": [admin, owner],
  "leases.view": [admin, owner], "leases.prepare": [admin, owner], "leases.review": [admin, owner],
  "platform.view": [staff.admin, staff.sales, staff.support], "pipeline.manage": [staff.admin, staff.sales], "entitlements.propose": [staff.admin, staff.sales],
  "entitlements.change": [staff.admin], "tenants.manage": [staff.admin], "users.manage": [staff.admin], "staff.manage": [staff.admin], "catalog.publish": [staff.admin],
  "engine.promote": [staff.admin], "support.request": [staff.admin, staff.support], "notes.write": [staff.admin, staff.sales, staff.support],
};
assert.deepEqual(Object.keys(EXPECT).sort(), [...ACTIONS].sort(), "every action has expectations");
const everyone = [member, admin, owner, outsider, staff.admin, staff.sales, staff.support];
for (const a of ACTIONS) for (const p of everyone) assert.equal(can(p, a), EXPECT[a].includes(p), `${a} for ${p.staff ?? p.workspaceRole ?? "outsider"}`);

assert.equal(canChangeRole(admin, { workspaceRole: "member", userId: "x" }, "admin"), true);
assert.equal(canChangeRole(admin, { workspaceRole: "owner", userId: "x" }, "member"), false, "owner role is untouchable");
assert.equal(canChangeRole(owner, { workspaceRole: "admin", userId: "x" }, "owner"), false, "ownership goes through transfer");
assert.equal(canChangeRole(member, { workspaceRole: "member", userId: "x" }, "admin"), false);
const eclReviewer = as({ services: { ecl: "reviewer", leases: "poster" } }), viewer = as({ services: { ecl: "viewer", leases: "viewer" } });
assert.equal(can(eclReviewer, "ecl.review"), true);
assert.equal(can(eclReviewer, "leases.review"), true);
assert.equal(can(viewer, "ecl.view") && !can(viewer, "ecl.prepare") && can(viewer, "leases.view") && !can(viewer, "leases.prepare"), true, "viewers read only");
assert.equal(canApprove(base, "u"), false, "no self-approval");
assert.equal(canApprove(base, "other"), true);
console.log(`policy ok (${ACTIONS.length} actions × ${everyone.length} principals)`);
