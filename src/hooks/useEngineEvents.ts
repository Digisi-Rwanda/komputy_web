"use client";
import { useEffect, useRef } from "react";

export type EngineEvent = { type: string; runId?: string; leaseId?: string; scope?: string; status?: string; jobId?: string; tenantId: string };

/** Subscribe to live engine events for this workspace (run progress, validation done, approvals). */
export function useEngineEvents(onEvent: (e: EngineEvent) => void) {
  const cb = useRef(onEvent);
  useEffect(() => { cb.current = onEvent; });
  useEffect(() => {
    const es = new EventSource("/api/engine/events");
    es.onmessage = (m) => { try { cb.current(JSON.parse(m.data) as EngineEvent); } catch { /* ignore */ } };
    return () => es.close();
  }, []);
}
