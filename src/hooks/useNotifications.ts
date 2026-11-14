"use client";
import { useEffect, useSyncExternalStore } from "react";
import { fetchNotifications, markNotificationsRead, setKindMuted } from "@/lib/actions/notifications";
import type { Notification } from "@/types/domain";

// One client store so the bell, its popover and /notifications stay in sync. Server is the source of truth:
// updates are optimistic, then confirmed by the next poll (30 s) or rolled back on error.
type State = { items: Notification[]; muted: Notification["kind"][]; loaded: boolean };
const EMPTY: State = { items: [], muted: [], loaded: false };
let state: State = EMPTY;
const subs = new Set<() => void>();
const set = (next: State) => { state = next; subs.forEach((f) => f()); };
let inflight: Promise<void> | null = null;
const refresh = () => (inflight ??= fetchNotifications().then((r) => set({ ...r, loaded: true })).catch(() => {}).finally(() => { inflight = null; }));

async function optimistic(next: State, write: () => Promise<{ ok: boolean }>) {
  const prev = state;
  set(next);
  const r = await write().catch(() => ({ ok: false }));
  if (!r.ok) set(prev);
}

export function useNotifications() {
  const s = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => state, () => EMPTY);
  useEffect(() => {
    void refresh();
    const t = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 30_000);
    return () => clearInterval(t);
  }, []);
  return {
    ...s,
    unread: s.items.filter((n) => !n.read && !s.muted.includes(n.kind)).length,
    markRead: (id: string) => optimistic({ ...state, items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)) }, () => markNotificationsRead({ ids: [id] })),
    markAllRead: () => optimistic({ ...state, items: state.items.map((n) => ({ ...n, read: true })) }, () => markNotificationsRead({})),
    toggleMute: (k: Notification["kind"]) => {
      const muted = !state.muted.includes(k);
      return optimistic({ ...state, muted: muted ? [...state.muted, k] : state.muted.filter((x) => x !== k) }, () => setKindMuted({ kind: k, muted }));
    },
  };
}
