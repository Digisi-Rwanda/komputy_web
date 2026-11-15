/** NA2 notification events: [id, label, in-app default, email default, lock note]. Shared by the prefs UI and server/notify.ts. */
export type EventRow = [string, string, boolean, boolean, string?];
export const EVENT_GROUPS: [string, EventRow[]][] = [
  ["Runs", [["completed", "Completed", true, false], ["failed", "Failed", true, true], ["signoff", "Awaiting my sign off", true, true, "Required for reviewers"]]],
  ["Leases", [["approvals", "Approvals", true, true], ["close", "Close steps due", true, true], ["alerts", "Alerts (expiries, payments)", true, false]]],
  ["Workspace", [["joined", "Member joined", true, false], ["role", "Role changed", true, true], ["invites", "Invites", true, false]]],
  ["Access", [["trial", "Trial started / ending / ended", true, true], ["service", "Service activated / suspended", true, true], ["requests", "Request updates", true, true]]],
  ["Security", [["device", "New device sign in", true, true, "Always on for your safety"], ["pw", "Password or MFA changed", true, true, "Always on for your safety"], ["support", "Support session started/ended", true, true, "Always on for your safety"]]],
];
export type NotifyEvent = "completed" | "failed" | "signoff" | "approvals" | "close" | "alerts" | "joined" | "role" | "invites" | "trial" | "service" | "requests" | "device" | "pw" | "support";
const SECURITY = new Set(["device", "pw", "support"]);
export const isLocked = (event: string, ch: "app" | "email") => SECURITY.has(event) || (event === "signoff" && ch === "email");
/** Sent immediately even when the person chose a digest. */
export const URGENT = new Set(["failed", "signoff", "approvals", "close", "trial", "service", "device", "pw", "support"]);
export const DEFAULTS: Record<string, boolean> = Object.fromEntries(EVENT_GROUPS.flatMap(([, rows]) => rows.flatMap((r) => [[`${r[0]}:app`, r[2]], [`${r[0]}:email`, r[3]]])));
export type NotifyKind = "runs" | "leases" | "access" | "workspace" | "security";

/** Pure decision (tested): which channels a person gets for an event, given their saved prefs. */
export function channels(event: NotifyEvent, kind: NotifyKind, prefs?: { matrix: unknown; mutedKinds: string[]; digest: string }) {
  const m = (prefs?.matrix ?? {}) as Record<string, boolean>;
  const on = (ch: "app" | "email") => isLocked(event, ch) || (m[`${event}:${ch}`] ?? DEFAULTS[`${event}:${ch}`] ?? false);
  const app = on("app") && (isLocked(event, "app") || !prefs?.mutedKinds.includes(kind));
  const email = on("email");
  // Non-urgent email waits for the digest (cron `digest` job) unless the person turned the digest off.
  return { app, email: email && (URGENT.has(event) || !prefs || prefs.digest === "off") };
}

