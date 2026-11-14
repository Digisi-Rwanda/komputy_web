"use client";
import { useSyncExternalStore } from "react";
import { saveOnboarding } from "@/lib/actions/onboarding";

// Checklist progress (`done`, `dismissed`) belongs to the workspace and is saved on the server (seeded by <Checklist>).
// Viewer-only UI state (welcome seen, tour step, sample run, collapsed groups) stays in this browser.
export interface OnboardingState { done: string[]; dismissed: boolean; welcomed: boolean; tourStep: number | null; sampleRun: "none" | "running" | "done"; collapsed: string[] }
const KEY = "ll_onboarding";
const INITIAL: OnboardingState = { done: ["verify-email"], dismissed: false, welcomed: false, tourStep: null, sampleRun: "none", collapsed: [] };

let cache: OnboardingState | null = null;
let server: Pick<OnboardingState, "done" | "dismissed"> | null = null;
const subs = new Set<() => void>();
const read = (): OnboardingState => {
  if (cache) return cache;
  let local: Partial<OnboardingState> = {};
  try { local = JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { /* storage blocked */ }
  cache = { ...INITIAL, welcomed: local.welcomed ?? false, tourStep: local.tourStep ?? null, sampleRun: local.sampleRun ?? "none", collapsed: local.collapsed ?? [], ...server };
  return cache;
};
const emit = () => subs.forEach((f) => f());
export function update(patch: Partial<OnboardingState> | ((s: OnboardingState) => Partial<OnboardingState>)) {
  const cur = read(), p = typeof patch === "function" ? patch(cur) : patch;
  cache = { ...cur, ...p };
  try { const { welcomed, tourStep, sampleRun, collapsed } = cache; localStorage.setItem(KEY, JSON.stringify({ welcomed, tourStep, sampleRun, collapsed })); } catch { /* storage blocked: state lives for this session */ }
  if (p.dismissed !== undefined && p.dismissed !== cur.dismissed) void saveOnboarding({ dismissed: p.dismissed });
  if (p.done) for (const id of new Set([...p.done, ...cur.done])) if (p.done.includes(id) !== cur.done.includes(id)) void saveOnboarding({ task: id, done: p.done.includes(id) });
  emit();
}
export const markDone = (id: string) => update((s) => ({ done: s.done.includes(id) ? s.done : [...s.done, id] }));
export const resetOnboarding = () => { cache = null; try { localStorage.removeItem(KEY); } catch {} emit(); };
/** Workspace progress from the server; call during render of the checklist (idempotent per value). */
export function seedOnboarding(s: Pick<OnboardingState, "done" | "dismissed">) {
  if (server && server.dismissed === s.dismissed && server.done.join() === s.done.join()) return;
  server = s;
  if (cache) cache = { ...cache, ...s };
}

export function useOnboarding() {
  return useSyncExternalStore((cb) => (subs.add(cb), () => subs.delete(cb)), read, () => ({ ...INITIAL, ...server }));
}
