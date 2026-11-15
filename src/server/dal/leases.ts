import "server-only";
import { cache } from "react";
import { call } from "@/server/dal/engine";
import type { Principal } from "@/server/policy";
import type { AssetClass, Lease, LeaseStatus } from "@/types/domain";

/* eslint-disable @typescript-eslint/no-explicit-any -- engine payloads are mapped field by field below */
type Any = any;

const tid = (p: Principal) => ({ tenant_id: p.tenantId! });
const n = (v: unknown) => (v == null || v === "" ? 0 : Number(v));
const CLASS: Record<string, AssetClass> = { property: "Property", vehicles: "Vehicles", it: "IT equipment", equipment: "IT equipment", atm: "Branch ATMs" };
const asClass = (c: string) => (CLASS[c?.toLowerCase?.()] ?? (c ? c.charAt(0).toUpperCase() + c.slice(1) : "Property")) as AssetClass;
const ago = (iso?: string | null) => {
  if (!iso) return "Never";
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`;
};
const GL_LABEL: Record<string, string> = {
  rou_cost: "ROU asset: cost", rou_accdep: "ROU asset: accumulated depreciation", lease_liability: "Lease liability", interest_expense: "Interest expense",
  depreciation_expense: "Depreciation expense", cash_payable: "Cash / payables clearing", lease_expense: "Short term / low value expense", modification_gain_loss: "Modification gain / loss",
  restoration_provision: "Restoration provision", idc_clearing: "Initial direct costs clearing", incentive_receivable: "Incentive receivable",
};

export type LeaseBook = Awaited<ReturnType<typeof buildBook>>;

async function buildBook(state: Any, pf: Any, me: string) {
  const members: Record<string, string> = Object.fromEntries((state.members ?? []).map((m: Any) => [m.id, m.name]));
  const who = (id?: string | null) => (id ? members[id] ?? "Someone" : "Not assigned");
  const ov = pf.overview;
  const register: (Lease & { code: string; leaseId: string; currency: string; verificationFailed: boolean })[] = (pf.register ?? []).map((r: Any) => ({
    id: r.code, leaseId: r.id, code: r.code, name: r.name, counterparty: r.counterparty, assetClass: asClass(r.assetClass), entity: r.entity,
    start: r.start ?? undefined, end: r.end ?? undefined, liability: r.liability ?? undefined, rouAsset: r.rouAsset ?? undefined, rate: r.rate ?? undefined,
    status: r.status as LeaseStatus, exempt: r.exempt ?? undefined, createdBy: who(r.createdBy), currency: r.currency, verificationFailed: Boolean(r.verificationFailed),
  }));
  const setupStatus = (list: Any[]) => {
    const latest = list?.at?.(-1);
    if (!latest) return "not-started" as const;
    return latest.status === "approved" ? ("approved" as const) : latest.status === "in_review" ? ("pending" as const) : ("draft" as const);
  };
  const setupSteps = [
    { id: "entity", label: "Entity", status: state.setup?.entity ? ("approved" as const) : ("not-started" as const) },
    { id: "gl", label: "GL mapping", status: setupStatus(state.gl) },
    { id: "periods", label: "Periods", status: state.setup?.periods ? ("approved" as const) : ("not-started" as const) },
    { id: "policies", label: "Policies", status: setupStatus(state.policies) },
    { id: "rates", label: "Rate curves", status: setupStatus(state.curves) },
  ];
  const glApproved = (state.gl ?? []).filter((v: Any) => v.status === "approved").at(-1) ?? (state.gl ?? []).at(-1);
  const glMapping: [string, string, string][] = Object.entries(glApproved?.accounts ?? {}).map(([k, v]: [string, Any]) => [GL_LABEL[k] ?? k, String(v?.code ?? v ?? ""), String(v?.name ?? "")]);
  const curve = (state.curves ?? []).filter((v: Any) => v.status === "approved").at(-1) ?? (state.curves ?? []).at(-1);
  const rateCurve: [number, number][] = (curve?.points ?? []).map((p: Any) => [n(p.termYears), n(p.rate)]);
  // Inbox: everything waiting for a decision (leases in review, setup in review, journal batches to approve).
  const inbox: { id: string; type: "lease" | "setup" | "event" | "journal"; title: string; meta: string; age: string; by: string; byId?: string; due?: boolean; lease?: string; leaseId?: string; rev?: number; version?: number; kind?: string; liability?: number; rou?: number; returnComment?: string }[] = [];
  const mine: typeof inbox = [];
  for (const l of state.leases ?? []) {
    const v = (l.versions ?? []).at(-1);
    if (!v) continue;
    const item = { id: `${l.id}:${v.n}`, type: (v.event && v.event !== "initial" && v.n > 1 ? "event" : "lease") as "lease" | "event", title: `${v.n > 1 ? `Event · ${v.event}` : "New lease"} · ${l.name}`,
      meta: `${l.code} · ${who(v.submittedBy ?? v.createdBy)}${v.calculated?.liability ? ` · liability ${Number(v.calculated.liability).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : ""}`,
      age: ago(v.submittedAt ?? v.createdAt), by: who(v.submittedBy ?? v.createdBy), byId: v.submittedBy ?? v.createdBy, lease: l.code, leaseId: l.id, rev: l.rev, version: v.n,
      liability: v.calculated?.liability ? Number(v.calculated.liability) : undefined, rou: v.calculated?.rou ? Number(v.calculated.rou) : undefined, returnComment: (v.comments ?? []).at(-1)?.text };
    if (v.status === "in_review") inbox.push(item);
    if ((v.status === "returned" || v.status === "draft") && (v.createdBy === me || v.submittedBy === me)) mine.push({ ...item, meta: `${item.meta}${v.status === "returned" ? ` · returned by ${who(v.decidedBy)}` : " · draft"}` });
  }
  for (const k of ["policies", "curves", "gl"] as const) for (const v of state[k] ?? []) if (v.status === "in_review")
    inbox.push({ id: `${k}:${v.version}`, type: "setup", title: `Setup change · ${k === "curves" ? "Rate curve" : k === "gl" ? "GL mapping" : "Policies"} v${v.version}`, meta: `Effective ${v.effectiveFrom} · ${who(v.createdBy)}`, age: ago(v.createdAt), by: who(v.createdBy), byId: v.createdBy, kind: k, version: v.version });
  for (const b of state.batches ?? []) if (b.status === "draft" || b.status === "pending_approval")
    inbox.push({ id: `batch:${b.id}`, type: "journal", title: `Journal batch · ${b.id}`, meta: `${b.period} close · ${(b.lines ?? []).length} lines`, age: ago(b.createdAt), by: who(b.createdBy), due: true });
  const imports: [string, string, number, string, string, string][] = (state.imports ?? []).map((i: Any) => [String(i.id), String(i.fileName ?? ""), n(i.rows ?? i.total), String(i.status), who(i.createdBy), ago(i.createdAt)]);
  const batches: { id: string; period: string; lines: number; total: number; status: "approved" | "posted" | "reversal"; erp: string; raw: Any }[] = (state.batches ?? []).map((b: Any) => {
    const lines = b.lines ?? [];
    const total = lines.reduce((a: number, l: Any) => a + n(l.debit), 0);
    return { id: b.id, period: b.period, lines: lines.length, total, status: b.reversalOf ? "reversal" : b.status === "posted" ? "posted" : "approved", erp: b.erpRef ?? "", raw: b };
  });
  const latestBatch = batches.at(-1)?.raw;
  const acct = new Map<string, [number, number]>();
  for (const l of latestBatch?.lines ?? []) { const c = acct.get(l.account) ?? [0, 0]; acct.set(l.account, [c[0] + n(l.debit), c[1] + n(l.credit)]); }
  const batchAccounts: [string, string, number, number][] = [...acct.entries()].map(([a, [d, c]]) => [a, GL_LABEL[a] ?? a, d, c]);
  const openClose = (state.closes ?? []).find((c: Any) => c.status !== "locked") ?? (state.closes ?? []).at(-1);
  const payments: { lease: string; name: string; due: string; scheduled: number; actual: number; id: string; match: string }[] = (openClose?.payments ?? []).map((pm: Any) => ({ lease: register.find((r) => r.leaseId === pm.leaseId)?.code ?? "None", name: pm.vendor, due: pm.date, scheduled: n(pm.expected), actual: n(pm.amount), id: pm.id, match: pm.match }));
  const rf = Object.fromEntries((ov.rollForward ?? []).map((x: Any) => [x.label, x.value]));
  // Per lease timeline, documents and audit (lease detail tabs), keyed by lease code.
  const audit = state.audit ?? [];
  const details: Record<string, { events: { v: string; title: string; at: string; by: string }[]; docs: [string, string, string, number, string][]; audit: { at: string; actor: string; initials: string; action: string; object: string; service: string }[]; versions: Any[]; leaseId: string; rev: number }> = {};
  for (const l of state.leases ?? []) {
    details[l.code] = {
      leaseId: l.id, rev: l.rev, versions: l.versions ?? [],
      events: [...(l.versions ?? [])].reverse().map((v: Any) => ({ v: `v${v.n}`, title: `${v.n === 1 ? "Draft created" : `Event · ${v.event}`} · ${v.status.replace("_", " ")}`, at: v.decidedAt ?? v.submittedAt ?? v.createdAt, by: who(v.decidedBy ?? v.submittedBy ?? v.createdBy) })),
      docs: (l.docs ?? []).map((d: Any) => [d.name ?? d.fileName ?? "Document", d.size ? `${Math.max(1, Math.round(n(d.size) / 1024))} KB` : "Unknown size", who(d.uploadedBy ?? d.createdBy), d.version ?? 1, d.id] as [string, string, string, number, string]),
      audit: audit.filter((a: Any) => String(a.target ?? a.object ?? "").startsWith(l.code)).map((a: Any) => ({ at: a.at, actor: who(a.userId ?? a.by), initials: who(a.userId ?? a.by).split(" ").map((w: string) => w[0]).join("").slice(0, 2), action: a.action ?? a.event ?? "", object: a.detail ?? a.target ?? l.code, service: "Leases" })),
    };
  }
  const lastImport = (state.imports ?? [])[0];
  const importMapping = Object.entries(lastImport?.mapping ?? {}).map(([col, field]) => [col, String(field), "", true] as [string, string, string, boolean]);
  return {
    period: pf.period as string, currency: pf.currency as string, role: state.role as string, me, members: (state.members ?? []) as { id: string; name: string; role: string; title: string }[], setupDone: setupSteps.every((s) => s.status === "approved"),
    register, overview: { ...ov, deltaVsSep: 0 } as { liability: number; rou: number; current: number; nonCurrent: number; due30: number; due30Count: number; expiring12: number; active: number; entities: number; deltaVsSep: number; byClass: [string, number][]; rollForward: { label: string; value: number; kind?: "total" }[]; expiries: [string, string, string, string, number][]; maturity: [string, number][] },
    setupSteps, glMapping, rateCurve, inbox, mySubmissions: mine, imports, importMapping, importErrors: [] as [number, string][], details, batches, batchAccounts, payments, close: openClose ?? null,
    closeSummary: { liability: ov.liability, interest: n(ov.interestYtd ?? rf.Interest), depreciation: n(ov.depreciationYtd), payments: n(ov.paymentsYtd ?? -n(rf.Payments)) },
    maturity: ov.maturity as [string, number][],
    disclosure: { rouByClass: (ov.rouByClass ?? []) as [string, number, number][], cashOutflow: n(ov.paymentsYtd ?? -n(rf.Payments)), fyFrom: String(ov.fyFrom ?? ""), paragraphs: ["53(a)", "53(b)", "53(c)", "53(e)", "53(g)", "54", "55", "56", "57", "58"] },
    state,
  };
}

/** The whole lease book for the active workspace (engine state + portfolio figures), mapped to the UI shapes. */
export const getLeaseBook = cache(async (p: Principal, period?: string) => {
  const [st, pf] = await Promise.all([
    call<Any>(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/leases/state", { params: { path: tid(p) } })),
    call<Any>(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/leases/views/portfolio", { params: { path: tid(p), query: { period } } })),
  ]);
  if (!st.ok) return { ok: false as const, error: st.error };
  if (!pf.ok) return { ok: false as const, error: pf.error };
  return { ok: true as const, data: await buildBook(st.data, pf.data, p.userId) };
});

export type LeaseView = {
  lease: Any; counterparty: string | null; entity: string | null; exempt: boolean | null; engineVersion: string | null; computedAt: string | null;
  monthly: Record<string, string | boolean>[]; annual: Record<string, string | boolean>[]; journals: { month: string; date: string; kind: string; memo: string; lines: { account: string; debit: string; credit: string }[] }[] | Any[];
};
/** One lease with its approved schedule and journals (from the engine's books). */
export const getLeaseView = cache(async (p: Principal, codeOrId: string) =>
  call<LeaseView>(p, (c) => c.GET("/api/v1/tenants/{tenant_id}/leases/views/lease/{lease_id}", { params: { path: { ...tid(p), lease_id: codeOrId } } })));
