"use client";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Textarea } from "@/components/atoms/Textarea";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { FilterBar, type FilterValues } from "@/components/organisms/FilterBar";
import { Sheet } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import { updateLead } from "@/lib/actions/platform";
import type { Lead, LeadStage as Stage } from "@/types/domain";
import { EntitlementDrawer } from "@/components/organisms/platform/EntitlementDrawer";
import { showCode } from "@/lib/code";

const STAGES: [Stage, string][] = [["new", "New"], ["contacted", "Contacted"], ["negotiating", "Negotiating"], ["won", "Won"], ["lost", "Lost"]];
const ini = (s: string) => s.split(/[ .]+/).filter(Boolean).map((x) => x[0]).join("").slice(0, 2).toUpperCase();

/** PA5 requests pipeline: board / table, drawer with timeline, stage moves, Won → Activate (PA4.2 prefilled). */
type Row = Lead & { timeline: string[] };

export function RequestsPipeline({ initial, assignees }: { initial: Row[]; assignees: string[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initial);
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) { setSeen(initial); setLeads(initial); }
  const [mode, setMode] = useState("board");
  const [f, setF] = useState<FilterValues>({});
  const [sel, setSel] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const list = leads.filter((l) => (!f.type?.length || f.type.includes(l.type)) && (!f.service?.length || l.services.some((s) => f.service.includes(s))) && (!f.assignee?.length || f.assignee.includes(l.assignee ?? "none")));
  const cur = leads.find((l) => l.id === sel);
  const move = async (id: string, stage: Stage, msg?: string) => {
    const prev = leads;
    setLeads((x) => x.map((l) => (l.id === id ? { ...l, stage } : l)));
    const r = await updateLead({ id, stage });
    if (!r.ok) { setLeads(prev); toast.error(r.error); return; }
    toast.success(msg ?? `Moved to ${STAGES.find((s) => s[0] === stage)![1]}`); router.refresh();
  };
  const card = (l: Lead) => (
    <button key={l.id} type="button" onClick={() => setSel(l.id)} className={cn("flex w-full flex-col gap-2 rounded-card border p-3 text-left", sel === l.id ? "border-fg" : "border-line hover:border-line-strong")}>
      <span className="flex items-center justify-between gap-2"><Badge tone={l.type === "Quote" ? "info" : l.type === "Waitlist" ? "neutral" : "warning"}>{l.type}</Badge><span className="font-mono text-micro text-fg-muted">{l.age}</span></span>
      <span className="text-small text-fg">{l.company}</span>
      <span className="flex flex-wrap gap-1">{l.services.map((s) => <span key={s} className="rounded-full bg-surface px-2 py-0.5 text-micro text-fg-body">{s}</span>)}</span>
      <span className="text-micro text-fg-muted">{l.size} · {l.source}</span>
      <span className="flex items-center justify-between">{l.assignee ? <span className="flex items-center gap-1.5 text-micro text-fg-muted"><Avatar initials={ini(l.assignee)} size="xs" />{l.assignee}</span> : <span className="text-micro text-fg-subtle">Unassigned</span>}
        {l.stage === "won" && <span className="text-micro text-link">Activate…</span>}</span>
    </button>
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2"><ToggleGroup label="View" value={mode} onChange={setMode} options={[{ value: "board", label: "Board" }, { value: "table", label: "Table" }]} />
        <FilterBar value={f} onChange={setF} filters={[{ key: "type", label: "Type", options: [...new Set(leads.map((l) => l.type))].map((t) => ({ value: t, label: t })) }, { key: "service", label: "Service", options: [...new Set(leads.flatMap((l) => l.services))].map((t) => ({ value: t, label: t })) }, { key: "assignee", label: "Assignee", options: [...assignees.map((a) => ({ value: a, label: a })), { value: "none", label: "Unassigned" }] }]} /></div>
      {mode === "board" ? (
        <div className="relative overflow-x-auto pb-2"><div className="grid min-w-[1100px] grid-cols-5 gap-3">{STAGES.map(([s, label]) => { const col = list.filter((l) => l.stage === s); return (
          <section key={s} aria-label={label} className="flex flex-col gap-2 rounded-panel border border-line bg-raised p-2"><h2 className="flex items-center justify-between px-1 py-1 text-small text-fg">{label}<span className="font-mono text-micro text-fg-muted">{s === "won" ? 12 + col.length - 1 : col.length}</span></h2>{col.map(card)}{!col.length && <p className="px-1 py-4 text-center text-micro text-fg-subtle">Nothing here</p>}</section>); })}</div></div>
      ) : (
        <div className="relative overflow-x-auto rounded-panel border border-line"><table className="w-full min-w-[820px] text-small"><caption className="sr-only">Requests</caption>
          <thead><tr className="border-b border-line text-fg-muted">{["ID", "Company", "Type", "Service", "Stage", "Assignee", "Age"].map((h) => <th key={h} scope="col" className="px-4 py-2.5 text-left font-normal">{h}</th>)}</tr></thead>
          <tbody>{list.map((l) => <tr key={l.id} onClick={() => setSel(l.id)} className="cursor-pointer border-b border-line last:border-0 hover:bg-surface-hover"><td className="px-4 py-3 font-mono text-micro">{showCode(l.code ?? l.id)}</td><td className="px-4 text-fg">{l.company}</td><td className="px-4">{l.type}</td><td className="px-4">{l.services.join(", ")}</td><td className="px-4"><StatusPill tone={l.stage === "won" ? "positive" : l.stage === "lost" ? "neutral" : "info"}>{STAGES.find((s) => s[0] === l.stage)![1]}</StatusPill></td><td className="px-4">{l.assignee ?? "Unassigned"}</td><td className="px-4 text-fg-muted">{l.age}</td></tr>)}</tbody></table></div>
      )}
      <Sheet open={Boolean(cur)} onOpenChange={(v) => !v && setSel(null)} title={cur ? `${cur.company} · ${cur.type}` : ""} description={cur?.code}
        footer={cur && <>{cur.stage !== "lost" && cur.stage !== "won" && <Button variant="ghost" onClick={() => move(cur.id, "lost")}>Mark lost</Button>}
          {(cur.stage === "new" || cur.stage === "contacted") && <Button variant="secondary" onClick={() => move(cur.id, cur.stage === "new" ? "contacted" : "negotiating")}>Move to {cur.stage === "new" ? "Contacted" : "Negotiating"}</Button>}
          {cur.workspace && cur.stage !== "lost" && ["ecl", "leases", "ECL", "Leases"].includes(cur.services[0]) ? <EntitlementDrawer kind="activate" ws={cur.company} tenantId={cur.workspace} service={/ecl/i.test(cur.services[0]) ? "ecl" : "leases"} linked={cur.id} trigger={<Button>{cur.stage === "won" ? "Activate service" : "Won → Activate service"}</Button>} />
            : cur.stage !== "won" && cur.stage !== "lost" && <Button onClick={() => move(cur.id, "won")}>Mark won</Button>}</>}>
        {cur && <div className="flex flex-col gap-5">
          {cur.contact && <p className="text-small text-fg-body">{cur.contact}</p>}
          {cur.message && <blockquote className="border-l-2 border-line-strong pl-3 text-small text-fg-body">“{cur.message}”</blockquote>}
          {cur.workspace && <p className="text-small">Linked workspace: <Link href={`/platform/workspaces/${cur.workspace}/summary`} className="text-link hover:underline">{cur.company.replace(/ \(.*\)/, "")}</Link></p>}
          <div><p className="mb-2 font-mono text-micro uppercase tracking-wider text-fg-muted">Timeline</p><ol className="flex flex-col gap-2 border-l border-line pl-4">{(cur.timeline.length ? cur.timeline : [`Submitted · ${cur.source} · ${cur.age} ago`]).map((t, i) => <li key={i} className="text-small text-fg-body">{t}</li>)}</ol></div>
          <label className="flex flex-col gap-1.5 text-small text-fg-body">Add note<Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></label>
          <Button size="sm" variant="secondary" className="w-fit" disabled={!note.trim()} onClick={async () => { const r = await updateLead({ id: cur.id, note: note.trim() }); if (!r.ok) { toast.error(r.error); return; } setNote(""); toast.success("Note added"); router.refresh(); }}>Add note</Button>
        </div>}
      </Sheet>
    </div>
  );
}
