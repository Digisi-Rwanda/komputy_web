"use client";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Textarea } from "@/components/atoms/Textarea";
import { KeyValue } from "@/components/molecules/StatCard";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { StateView } from "@/components/organisms/StateView";
import { toast } from "@/components/organisms/Toaster";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import { decideRequest } from "@/lib/actions/requests";
import type { AccessRequest } from "@/types/domain";

type Decided = AccessRequest & { decision: "approved" | "declined" | "forwarded" };

/** CA5 member requests: list + detail with reply; SoD warning; inactive services forward to Komputy sales. */
export function Requests({ initial }: { initial: AccessRequest[] }) {
  const router = useRouter();
  const split = (all: AccessRequest[]) => [all.filter((r) => (r.status ?? "open") === "open"), all.filter((r) => r.status && r.status !== "open").map((r) => ({ ...r, decision: r.status as Decided["decision"] }))] as const;
  const [open, setOpen] = useState(() => split(initial)[0]);
  const [done, setDone] = useState<Decided[]>(() => split(initial)[1]);
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) { setSeen(initial); setOpen(split(initial)[0]); setDone(split(initial)[1]); }
  const [tab, setTab] = useState("open");
  const [sel, setSel] = useState(initial[0]?.id);
  const [reply, setReply] = useState("");
  const list = tab === "open" ? open : done.filter((d) => (tab === "approved" ? d.decision !== "declined" : d.decision === "declined"));
  const cur = list.find((r) => r.id === sel) ?? list[0];
  const decide = async (r: AccessRequest, decision: Decided["decision"]) => {
    const prev = [open, done] as const;
    setOpen((o) => o.filter((x) => x.id !== r.id)); setDone((d) => [{ ...r, decision }, ...d]);
    const res = await decideRequest({ id: r.id, decision, reply: reply.trim() || undefined });
    if (!res.ok) { setOpen(prev[0]); setDone(prev[1]); toast.error(res.error); return; }
    setReply("");
    toast.success(decision === "approved" ? `${r.who} now has ${r.requested}` : decision === "forwarded" ? "Forwarded to Komputy sales" : `Declined · ${r.who} was notified`);
    router.refresh();
  };;
  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup label="Request status" value={tab} onChange={setTab} options={[{ value: "open", label: "Open", count: open.length }, { value: "approved", label: "Approved" }, { value: "declined", label: "Declined" }]} />
      {list.length === 0 ? <StateView icon="inbox" title={tab === "open" ? "No open requests" : `Nothing ${tab} yet`} description="Members can ask for access from any locked screen." /> : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <ul className="flex flex-col gap-3">{list.map((r) => (
            <li key={r.id}><div role="button" tabIndex={0} aria-pressed={cur?.id === r.id} onClick={() => setSel(r.id)} onKeyDown={(e) => e.key === "Enter" && setSel(r.id)} className={cn("flex cursor-pointer flex-col gap-3 rounded-panel border p-4 outline-none focus-visible:ring-2 focus-visible:ring-focus", cur?.id === r.id ? "border-fg" : "border-line hover:border-line-strong")}>
              <div className="flex items-start gap-3"><Avatar initials={r.initials} size="sm" /><span className="min-w-0 flex-1"><span className="block text-small text-fg">{r.title}</span><span className="block text-micro text-fg-muted">{r.meta}</span></span><span className="text-micro text-fg-muted">{r.age}</span></div>
              {r.note && <p className="flex items-start gap-2 rounded-card bg-warning-tint px-3 py-2 text-micro text-fg"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />{r.note}</p>}
              {"decision" in r ? <StatusPill tone={r.decision === "declined" ? "neutral" : "positive"} className="w-fit">{r.decision === "forwarded" ? "Forwarded to Komputy" : r.decision === "approved" ? "Approved" : "Declined"}</StatusPill>
                : <div className="flex flex-wrap items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>{r.kind === "service" ? <><span className="mr-auto text-micro text-fg-muted">Creates a request to our sales team.</span><Button size="sm" onClick={() => decide(r, "forwarded")}>Forward to Komputy</Button></> : <><Button size="sm" variant="secondary" onClick={() => decide(r, "declined")}>Decline</Button><Button size="sm" onClick={() => decide(r, "approved")}>Approve</Button></>}</div>}
            </div></li>))}
          </ul>
          {cur && <aside className="flex h-fit flex-col gap-4 rounded-panel border border-line p-5 lg:sticky lg:top-20">
            <div className="flex items-center gap-3"><Avatar initials={cur.initials} /><span><span className="block text-small text-fg">{cur.who}</span><span className="block text-micro text-fg-muted">{cur.age}</span></span></div>
            <KeyValue columns={1} items={[["Current roles", cur.current], ["Requested", cur.requested]]} />
            {!("decision" in cur) && cur.kind !== "service" && <><label className="flex flex-col gap-1.5 text-small text-fg-body">Reply (optional)<Textarea value={reply} onChange={(e) => setReply(e.target.value)} maxLength={500} /></label>
              <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => decide(cur, "declined")}>Decline</Button><Button onClick={() => decide(cur, "approved")}>Approve</Button></div></>}
            <div className="border-t border-line pt-3"><p className="mb-2 font-mono text-micro uppercase tracking-wider text-fg-muted">History</p><p className="text-micro text-fg-body">Requested from the locked {cur.kind === "service" ? "Tax Provision" : "service"} screen · {cur.age}</p></div>
          </aside>}
        </div>
      )}
    </div>
  );
}
