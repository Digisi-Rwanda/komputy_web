"use client";
import { useSyncExternalStore } from "react";

// Run draft for the wizard (blueprint §11.4). The run itself lives in the engine (`runId`); this store holds the
// screen state between steps and is re-hydrated from the engine whenever the wizard opens with ?run=<id>.
export type Dataset = "pd" | "lgd" | "ead";
export type Outcome = "passed" | "warnings" | "failed";
export interface EngineCriterion { id: string; title: string; detail: string; status: "passed" | "warning" | "error" }
export interface FileState { status: "empty" | "uploading" | "uploaded" | "validating" | "report" | "accepted"; name?: string; sizeMb?: number; progress?: number; outcome?: Outcome; ack?: boolean; comment?: string; acceptedAt?: string; jobId?: string; criteria?: EngineCriterion[]; rows?: number | null; sha?: string }
export type RunPhase = "draft" | "computing" | "compute-failed" | "computed" | "submitted" | "returned" | "signed-off";
export interface Draft {
  id: string; name: string; reportingDate: string; currency: string; engine: string; description: string;
  files: Record<Dataset, FileState>; phase: RunPhase; computeStartedAt?: number; computeAttempt: number;
  sample: boolean; reviewer: string; note: string; savedAt: number; returnComment?: string;
  /** Engine run id (ULID) once the run exists; every step after setup needs it. */
  runId?: string; failureMessage?: string | null; progress?: Record<string, { status: string }> | null;
}

const KEY = "ll_run_draft";
export { STEPS, type Step } from "@/data/wizard-steps";
const empty: FileState = { status: "empty" };
const lastMonthEnd = () => { const d = new Date(); d.setDate(0); return d; };
export const NEW_DRAFT = (): Draft => {
  const e = lastMonthEnd();
  return {
    // Reporting date blank = use the EAD file's most common Reporting Date (spec 1.5 excludes rows with another date).
    id: "New run", name: `${e.toLocaleString("en-GB", { month: "short" })} ${e.getFullYear()} month-end`, reportingDate: "",
    currency: "USD", engine: "current", description: "", files: { pd: empty, lgd: empty, ead: empty }, phase: "draft", computeAttempt: 0, sample: false, reviewer: "", note: "", savedAt: 0,
  };
};
export const SAMPLE_FILES: Record<Dataset, FileState> = {
  pd: { status: "report", name: "SAMPLE_PD.xlsx", sizeMb: 0.4, outcome: "warnings" },
  lgd: { status: "empty" },
  ead: { status: "empty" },
};

let cache: Draft | null = null;
const subs = new Set<() => void>();
const read = (): Draft => {
  if (cache) return cache;
  try { cache = { ...NEW_DRAFT(), ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { cache = NEW_DRAFT(); }
  return cache!;
};
const SERVER = NEW_DRAFT();
export function setDraft(patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) {
  const cur = read();
  cache = { ...cur, ...(typeof patch === "function" ? patch(cur) : patch), savedAt: Date.now() };
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* storage blocked: draft lives for this tab */ }
  subs.forEach((f) => f());
}
export const setFile = (k: Dataset, patch: Partial<FileState>) => setDraft((d) => ({ files: { ...d.files, [k]: { ...d.files[k], ...patch } } }));
export const resetDraft = (d: Draft = NEW_DRAFT()) => { cache = null; try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} cache = d; subs.forEach((f) => f()); };
export const useDraft = () => useSyncExternalStore((cb) => (subs.add(cb), () => subs.delete(cb)), read, () => SERVER);

/** Furthest step the user may open: each data step needs the previous one accepted (gate rule). */
export function maxStep(d: Draft): number {
  if (d.files.pd.status !== "accepted") return 1;
  if (d.files.lgd.status !== "accepted") return 2;
  if (d.files.ead.status !== "accepted") return 3;
  if (d.phase === "draft") return 4;
  if (d.phase === "computing" || d.phase === "compute-failed") return 5;
  return 6;
}
