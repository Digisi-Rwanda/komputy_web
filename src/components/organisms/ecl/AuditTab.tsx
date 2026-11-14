"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AuditTimeline } from "@/components/organisms/AuditTimeline";
import { FilterBar, type FilterValues } from "@/components/organisms/FilterBar";
import { download, toCsv } from "@/lib/csv";
import type { AuditEvent } from "@/types/domain";

/** R8 run audit: timeline, person/action filters, CSV export. */
export function AuditTab({ events, runId }: { events: AuditEvent[]; runId: string }) {
  const [f, setF] = useState<FilterValues>({});
  const kind = (e: AuditEvent) => e.action.split(" ")[0];
  const list = events.filter((e) => (!f.person?.length || f.person.includes(e.actor)) && (!f.action?.length || f.action.includes(kind(e))));
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <FilterBar value={f} onChange={setF} filters={[{ key: "person", label: "Person", options: [...new Set(events.map((e) => e.actor))].map((v) => ({ value: v, label: v })) }, { key: "action", label: "Action", options: [...new Set(events.map(kind))].map((v) => ({ value: v, label: v })) }]} />
        <Button size="sm" variant="secondary" className="ml-auto" icon={<Download />} onClick={() => download(`${runId}-audit.csv`, toCsv([["Time (UTC)", "Person", "Action", "Object"], ...list.map((e) => [e.at, e.actor, e.action, e.object])]))}>Export audit log (CSV)</Button>
      </div>
      <AuditTimeline events={list} />
    </div>
  );
}
