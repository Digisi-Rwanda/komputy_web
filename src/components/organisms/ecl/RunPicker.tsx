"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/atoms/Select";
import type { Run } from "@/types/domain";

/** Pill-like run select that writes ?{param}=<run id>. */
export function RunPicker({ runs, param, value, label }: { runs: Pick<Run, "id" | "name" | "status">[]; param: string; value: string; label: string }) {
  const router = useRouter(), sp = useSearchParams();
  return (
    <Select aria-label={label} wrapperClassName="w-full sm:w-80" value={value} onChange={(e) => { const q = new URLSearchParams(sp.toString()); q.set(param, e.target.value); q.delete("loan"); router.push(`?${q.toString()}`); }}>
      {runs.map((r) => <option key={r.id} value={r.id}>{r.name}{r.status === "signed-off" ? " · Signed off" : r.status === "needs-review" ? " · Awaiting sign off" : ""}</option>)}
    </Select>
  );
}
