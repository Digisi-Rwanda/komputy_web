"use client";
import { useState } from "react";
import { CheckCircle2, Info } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Icon, type IconName } from "@/components/atoms/Icon";
import { Textarea } from "@/components/atoms/Textarea";
import { Banner } from "@/components/molecules/Banner";
import { KeyValue } from "@/components/molecules/StatCard";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { Sheet } from "@/components/organisms/Modal";
import { StateView } from "@/components/organisms/StateView";
import { toast } from "@/components/organisms/Toaster";
import { calculate } from "@/lib/lease";
import { money } from "@/lib/format";
import type { InboxItem } from "@/data/mock/leases";

const ICON: Record<InboxItem["type"], IconName> = { lease: "file", setup: "settings", event: "refresh", journal: "journal" };
const ME = "Jean Habimana";

/** LC-01 approvals inbox + decision drawer. Segregation of duties: you can't approve what you submitted. */
export function Inbox({ waiting, mine }: { waiting: InboxItem[]; mine: InboxItem[] }) {
  const [tab, setTab] = useState("waiting");
  const [items, setItems] = useState(waiting);
  const [done, setDone] = useState<InboxItem[]>([]);
  const [open, setOpen] = useState<InboxItem | null>(null);
  const [comment, setComment] = useState("");
  const list = tab === "waiting" ? items : tab === "mine" ? mine : done;
  const decide = (approve: boolean) => {
    if (!open) return;
    setItems((x) => x.filter((i) => i.id !== open.id)); setDone((d) => [open, ...d]);
    toast.success(approve ? `${open.title.split(" · ")[1]} approved` : `Returned to ${open.by}`);
    setOpen(null); setComment("");
  };
  const preview = calculate({ commencement: "2026-11-01", end: "2031-10-31", payment: 107500, frequency: "annual", timing: "arrears", rate: 0.095 });
  const self = open?.by === ME;
  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup label="Inbox" value={tab} onChange={setTab} options={[{ value: "waiting", label: "Waiting for me", count: items.length }, { value: "mine", label: "Submitted by me", count: mine.length }, { value: "done", label: "Done", count: done.length }]} />
      {list.length === 0 ? <StateView icon="check-circle" title="You're all caught up" description="New items appear here when someone submits them." /> : (
        <ul className="divide-y divide-line rounded-panel border border-line">
          {list.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-surface text-fg-muted"><Icon name={ICON[i.type]} /></span>
              <span className="min-w-0 flex-1"><span className="block text-small text-fg">{i.title}</span><span className="block text-micro text-fg-muted">{i.meta}</span></span>
              {i.due && <Badge tone="warning">Due today</Badge>}
              <span className="w-12 text-right font-mono text-micro text-fg-muted">{i.age}</span>
              {tab === "mine" ? <Button size="sm" variant="secondary" onClick={() => toast("Opens the lease in edit mode to resubmit")}>Edit and resubmit</Button> : tab === "waiting" && <Button size="sm" onClick={() => setOpen(i)}>Review</Button>}
            </li>
          ))}
        </ul>
      )}
      {tab === "mine" && <Banner tone="warning">Returned by Jean Habimana: “Please attach the signed contract and confirm the 36-month term.”</Banner>}
      <Sheet open={open !== null} onOpenChange={(v) => !v && setOpen(null)} width="w-[640px]" title={open ? `Approve ${open.title.toLowerCase()}` : ""}
        footer={<><Button variant="outline" disabled={comment.trim().length < 5} disabledReason={comment.trim().length < 5 ? "A comment is required to return" : undefined} onClick={() => decide(false)}>Return with comments</Button><Button disabled={self} disabledReason={self ? "You can't approve your own submission." : undefined} onClick={() => decide(true)}>Approve</Button></>}>
        {open && <div className="flex flex-col gap-5">
          {open.type === "lease" && <><KeyValue columns={2} items={[["Counterparty", "Nyarutarama Estates"], ["Term", "5 years"], ["Rate", "9.50 % curve"], ["Liability · USD", money(preview.liability)], ["ROU · USD", `${money(preview.rou + 5500)} (incl. IDC 5,500.00)`]]} />
            <div><p className="mb-2 text-small text-fg">Schedule preview (first 3 years)</p><table className="text-small tabular-nums"><tbody>{preview.rows.slice(0, 3).map((r) => <tr key={r.year}><td className="pr-8 text-fg-body">{r.year}</td><td className="text-right">{money(r.payment)}</td></tr>)}</tbody></table></div></>}
          {open.type !== "lease" && <p className="text-small text-fg-body">{open.meta}</p>}
          <ul className="flex flex-col gap-1.5">{["No overrides", "Duplicate check passed", "Documents 2"].map((c) => <li key={c} className="flex items-center gap-2 text-small text-fg-body"><CheckCircle2 className="size-4 text-positive" />{c}</li>)}</ul>
          <label className="flex flex-col gap-1.5 text-small text-fg-body">Comments (required if returning)<Textarea value={comment} maxLength={1000} onChange={(e) => setComment(e.target.value)} /></label>
          <p className="flex items-start gap-2 text-micro text-fg-muted"><Info className="mt-0.5 size-3.5" />{self ? "You submitted this item, so you can't approve it." : "Segregation of duties: you did not prepare this item."}</p>
        </div>}
      </Sheet>
    </div>
  );
}
