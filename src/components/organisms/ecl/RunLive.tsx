"use client";
import { useRouter } from "next/navigation";
import { useEngineEvents } from "@/hooks/useEngineEvents";

/** Refreshes the run page when the engine reports progress for this run (SSE), while it's computing or building outputs. */
export function RunLive({ runId, active }: { runId: string; active: boolean }) {
  const router = useRouter();
  useEngineEvents((e) => { if (active && e.runId === runId) router.refresh(); });
  return null;
}
